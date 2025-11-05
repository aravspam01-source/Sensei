import express from 'express';
import { animationGenerator } from '../services/animationGenerator';
import { prisma } from '../models/database';
import { auth } from './users';

const router = express.Router();

// Get available pre-made animations
router.get('/premade', async (req, res) => {
  try {
    const { category, difficulty, style } = req.query;

    const animations = await animationGenerator.getPremadeAnimations({
      category: category as string,
      difficulty: difficulty as string,
      style: style as string
    });

    res.json({
      success: true,
      data: animations
    });
  } catch (error) {
    console.error('Error fetching pre-made animations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pre-made animations'
    });
  }
});

// Generate animations from text
router.post('/generate', auth, async (req: any, res) => {
  try {
    const { text, keywords, style, difficulty } = req.body;

    if (!text || !keywords || !style || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Text, keywords, style, and difficulty are required'
      });
    }

    // Start animation generation
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process generation asynchronously
    animationGenerator.generateAnimation(taskId, {
      text,
      keywords,
      style,
      difficulty
    }).catch(error => {
      console.error(`Error generating animation for task ${taskId}:`, error);
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        message: 'Animation generation started'
      }
    });
  } catch (error) {
    console.error('Error starting animation generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start animation generation'
    });
  }
});

// Generate AI images for concepts
router.post('/ai-generate', auth, async (req: any, res) => {
  try {
    const { concepts, style } = req.body;

    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Concepts array is required'
      });
    }

    if (!style) {
      return res.status(400).json({
        success: false,
        error: 'Animation style is required'
      });
    }

    const results = await Promise.allSettled(
      concepts.map(async (concept: string) => {
        try {
          const imageUrl = await animationGenerator.generateAiImage(concept, style);
          return { concept, url: imageUrl, success: true };
        } catch (error) {
          console.error(`Error generating AI image for concept "${concept}":`, error);
          return { concept, error: error.message, success: false };
        }
      })
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(item => item.success);

    const failed = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(item => !item.success);

    res.json({
      success: true,
      data: successful,
      meta: {
        total: concepts.length,
        successful: successful.length,
        failed: failed.length,
        errors: failed
      }
    });
  } catch (error) {
    console.error('Error generating AI images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI images'
    });
  }
});

// Check animation generation status
router.get('/status/:taskId', auth, async (req: any, res) => {
  try {
    const { taskId } = req.params;

    const status = await animationGenerator.getGenerationStatus(taskId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error checking generation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check generation status'
    });
  }
});

// Get animation library categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await animationGenerator.getAnimationCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching animation categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch animation categories'
    });
  }
});

// Search animations by keyword
router.get('/search', async (req, res) => {
  try {
    const { q: query, difficulty, style, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await animationGenerator.searchAnimations({
      query: query as string,
      difficulty: difficulty as string,
      style: style as string,
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching animations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search animations'
    });
  }
});

// Generate custom animation template
router.post('/templates', auth, async (req: any, res) => {
  try {
    const { name, description, keywords, animationData, category } = req.body;
    const userId = req.user.id;

    if (!name || !description || !keywords || !animationData) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, keywords, and animation data are required'
      });
    }

    const template = await animationGenerator.createCustomTemplate({
      name,
      description,
      keywords,
      animationData,
      category: category || 'custom',
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Custom animation template created successfully'
    });
  } catch (error) {
    console.error('Error creating animation template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create animation template'
    });
  }
});

// Get user's custom templates
router.get('/templates', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { category, limit = 10 } = req.query;

    const templates = await animationGenerator.getUserCustomTemplates(userId, {
      category: category as string,
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching custom templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom templates'
    });
  }
});

// Delete custom template
router.delete('/templates/:templateId', auth, async (req: any, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    await animationGenerator.deleteCustomTemplate(templateId, userId);

    res.json({
      success: true,
      message: 'Custom template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting custom template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete custom template'
    });
  }
});

// Generate animation variations
router.post('/variations', auth, async (req: any, res) => {
  try {
    const { baseAnimationId, variations, style } = req.body;

    if (!baseAnimationId || !variations || !Array.isArray(variations)) {
      return res.status(400).json({
        success: false,
        error: 'Base animation ID and variations array are required'
      });
    }

    const taskId = `variation_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process variation generation asynchronously
    animationGenerator.generateVariations(taskId, {
      baseAnimationId,
      variations,
      style
    }).catch(error => {
      console.error(`Error generating variations for task ${taskId}:`, error);
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        message: 'Animation variation generation started'
      }
    });
  } catch (error) {
    console.error('Error starting variation generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start variation generation'
    });
  }
});

// Batch generate animations for multiple concepts
router.post('/batch-generate', auth, async (req: any, res) => {
  try {
    const { concepts, style, difficulty, priority = 'normal' } = req.body;

    if (!concepts || !Array.isArray(concepts) || concepts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Concepts array is required'
      });
    }

    const taskId = `batch_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process batch generation asynchronously
    animationGenerator.batchGenerate(taskId, {
      concepts,
      style,
      difficulty,
      priority
    }).catch(error => {
      console.error(`Error in batch generation for task ${taskId}:`, error);
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        totalConcepts: concepts.length,
        message: 'Batch animation generation started'
      }
    });
  } catch (error) {
    console.error('Error starting batch generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start batch generation'
    });
  }
});

// Get animation assets for a scene
router.get('/assets/:sceneId', auth, async (req: any, res) => {
  try {
    const { sceneId } = req.params;

    const assets = await prisma.generatedAsset.findMany({
      where: { scene_id: sceneId },
      orderBy: { created_at: 'asc' }
    });

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error fetching animation assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch animation assets'
    });
  }
});

// Upload custom animation asset
router.post('/assets/upload', auth, async (req: any, res) => {
  try {
    // This would handle file uploads for custom animation assets
    // For now, return a placeholder response

    res.status(501).json({
      success: false,
      error: 'Asset upload not yet implemented'
    });
  } catch (error) {
    console.error('Error uploading animation asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload animation asset'
    });
  }
});

module.exports = router;