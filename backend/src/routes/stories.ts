import express from 'express';
import { prisma } from '../models/database';
import { textProcessor } from '../services/textProcessor';
import { animationGenerator } from '../services/animationGenerator';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all stories (with optional user filter)
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const { userId, page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (userId) {
      where.user_id = userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { original_text: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          scenes: {
            orderBy: { scene_order: 'asc' }
          },
          user: {
            select: { id: true, email: true }
          }
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.story.count({ where })
    ]);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stories'
    });
  }
});

// Get a single story by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        scenes: {
          orderBy: { scene_order: 'asc' },
          include: {
            assets: true
          }
        },
        user: {
          select: { id: true, email: true, age_group: true }
        }
      }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch story'
    });
  }
});

// Create a new story
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const { title, original_text, difficulty_level, animation_style } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !original_text) {
      return res.status(400).json({
        success: false,
        error: 'Title and text content are required'
      });
    }

    // Create the story
    const story = await prisma.story.create({
      data: {
        user_id: userId,
        title,
        original_text,
        difficulty_level: difficulty_level || 'ELEMENTARY',
        animation_style: animation_style || 'CARTOON'
      },
      include: {
        scenes: true,
        user: {
          select: { id: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create story'
    });
  }
});

// Update a story
router.put('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, original_text, difficulty_level, animation_style } = req.body;
    const userId = req.user.id;

    // Check if story exists and belongs to user
    const existingStory = await prisma.story.findUnique({
      where: { id }
    });

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (existingStory.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this story'
      });
    }

    // Update the story
    const updatedStory = await prisma.story.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(original_text && { original_text }),
        ...(difficulty_level && { difficulty_level }),
        ...(animation_style && { animation_style }),
        updated_at: new Date()
      },
      include: {
        scenes: {
          orderBy: { scene_order: 'asc' }
        },
        user: {
          select: { id: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedStory
    });
  } catch (error) {
    console.error('Error updating story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update story'
    });
  }
});

// Delete a story
router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if story exists and belongs to user
    const existingStory = await prisma.story.findUnique({
      where: { id }
    });

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (existingStory.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this story'
      });
    }

    // Delete the story (cascade will handle scenes and assets)
    await prisma.story.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete story'
    });
  }
});

// Generate scenes for a story
router.post('/:id/generate-scenes', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { force_regenerate = false } = req.body;
    const userId = req.user.id;

    // Check if story exists and belongs to user
    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        scenes: true
      }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (story.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to generate scenes for this story'
      });
    }

    // Check if scenes already exist
    if (story.scenes.length > 0 && !force_regenerate) {
      return res.status(400).json({
        success: false,
        error: 'Scenes already exist. Use force_regenerate=true to overwrite.'
      });
    }

    // Delete existing scenes if regenerating
    if (force_regenerate && story.scenes.length > 0) {
      await prisma.scene.deleteMany({
        where: { story_id: id }
      });
    }

    // Process text and generate scenes
    const processedText = await textProcessor.processText(
      story.original_text,
      story.difficulty_level
    );

    const generatedScenes = await textProcessor.generateScenes(
      processedText,
      story.difficulty_level,
      story.animation_style
    );

    // Save scenes to database
    const savedScenes = await Promise.all(
      generatedScenes.map(async (sceneData, index) => {
        const scene = await prisma.scene.create({
          data: {
            story_id: id,
            scene_order: index,
            text_content: sceneData.text_content,
            visual_elements: sceneData.visual_elements,
            animation_data: sceneData.animation_data,
            duration: sceneData.duration
          }
        });

        // Generate assets for the scene
        if (sceneData.visual_elements?.keywords) {
          await animationGenerator.generateAssetsForScene(scene.id, sceneData.visual_elements);
        }

        return scene;
      })
    );

    res.json({
      success: true,
      data: savedScenes,
      message: `Generated ${savedScenes.length} scenes`
    });
  } catch (error) {
    console.error('Error generating scenes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate scenes'
    });
  }
});

// Duplicate a story
router.post('/:id/duplicate', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newTitle } = req.body;
    const userId = req.user.id;

    // Get original story with scenes
    const originalStory = await prisma.story.findUnique({
      where: { id },
      include: {
        scenes: {
          orderBy: { scene_order: 'asc' },
          include: {
            assets: true
          }
        }
      }
    });

    if (!originalStory) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (originalStory.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to duplicate this story'
      });
    }

    // Create duplicated story
    const duplicatedStory = await prisma.story.create({
      data: {
        user_id: userId,
        title: newTitle || `${originalStory.title} (Copy)`,
        original_text: originalStory.original_text,
        difficulty_level: originalStory.difficulty_level,
        animation_style: originalStory.animation_style
      }
    });

    // Duplicate scenes
    const duplicatedScenes = await Promise.all(
      originalStory.scenes.map(async (scene) => {
        const newScene = await prisma.scene.create({
          data: {
            story_id: duplicatedStory.id,
            scene_order: scene.scene_order,
            text_content: scene.text_content,
            visual_elements: scene.visual_elements,
            animation_data: scene.animation_data,
            duration: scene.duration
          }
        });

        // Duplicate assets
        if (scene.assets.length > 0) {
          await Promise.all(
            scene.assets.map(async (asset) => {
              await prisma.generatedAsset.create({
                data: {
                  scene_id: newScene.id,
                  asset_type: asset.asset_type,
                  cloudinary_url: asset.cloudinary_url,
                  local_path: asset.local_path,
                  generation_method: asset.generation_method,
                  metadata: asset.metadata
                }
              });
            })
          );
        }

        return newScene;
      })
    );

    res.status(201).json({
      success: true,
      data: {
        ...duplicatedStory,
        scenes: duplicatedScenes
      },
      message: 'Story duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate story'
    });
  }
});

// Get user's stories
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where: { user_id: userId },
        include: {
          scenes: {
            select: { id: true, duration: true }
          }
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.story.count({ where: { user_id: userId } })
    ]);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stories'
    });
  }
});

// Share a story
router.post('/:id/share', auth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { expiresIn = 7 * 24 * 60 * 60 * 1000, allowDownload = true } = req.body; // Default 7 days
    const userId = req.user.id;

    // Check if story exists and belongs to user
    const story = await prisma.story.findUnique({
      where: { id }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found'
      });
    }

    if (story.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to share this story'
      });
    }

    // Generate shareable link (this would typically involve creating a share record in DB)
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareId}`;

    // In a real implementation, you would save this to the database with expiration
    // For now, we'll return the share URL

    res.json({
      success: true,
      data: {
        shareId,
        shareUrl,
        expiresAt: new Date(Date.now() + expiresIn),
        allowDownload
      },
      message: 'Story shared successfully'
    });
  } catch (error) {
    console.error('Error sharing story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share story'
    });
  }
});

module.exports = router;