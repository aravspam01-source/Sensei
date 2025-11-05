import express from 'express';
import { prisma } from '../models/database';
import { auth } from './users';

const router = express.Router();

// Get shared story (public access)
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { password } = req.query;

    // In a real implementation, you would have a shares table in the database
    // For now, we'll simulate the share functionality

    // Mock shared story data
    const mockSharedStory = {
      id: 'shared-story-id',
      title: 'Shared Educational Story',
      original_text: 'This is a sample shared story about the water cycle...',
      difficulty_level: 'ELEMENTARY',
      animation_style: 'CARTOON',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scenes: [
        {
          id: 'scene-1',
          story_id: 'shared-story-id',
          scene_order: 0,
          text_content: 'The water cycle begins when the sun heats up water in oceans, lakes, and rivers.',
          visual_elements: {
            keywords: ['sun', 'water', 'heat'],
            template: 'water_cycle',
            visualElements: ['sun', 'ocean', 'clouds']
          },
          animation_data: {
            lottieUrl: '/animations/water_cycle_1.json',
            duration: 5
          },
          duration: 5
        },
        {
          id: 'scene-2',
          story_id: 'shared-story-id',
          scene_order: 1,
          text_content: 'Water evaporates and rises into the atmosphere as water vapor.',
          visual_elements: {
            keywords: ['evaporation', 'vapor', 'atmosphere'],
            template: 'evaporation',
            visualElements: ['vapor', 'clouds', 'air']
          },
          animation_data: {
            lottieUrl: '/animations/evaporation_2.json',
            duration: 4
          },
          duration: 4
        }
      ],
      shareInfo: {
        shareId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        viewCount: 1,
        allowDownload: true,
        password: password ? 'protected' : null
      }
    };

    res.json({
      success: true,
      data: mockSharedStory
    });
  } catch (error) {
    console.error('Error fetching shared story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared story'
    });
  }
});

// Get sharing analytics
router.get('/:shareId/analytics', async (req, res) => {
  try {
    const { shareId } = req.params;

    // Mock analytics data
    const analytics = {
      views: 25,
      downloads: 8,
      lastViewed: new Date().toISOString(),
      referrers: [
        { source: 'direct', count: 15 },
        { source: 'twitter', count: 6 },
        { source: 'facebook', count: 4 }
      ],
      viewTimeline: [
        { date: '2024-01-01', views: 5 },
        { date: '2024-01-02', views: 12 },
        { date: '2024-01-03', views: 8 }
      ]
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching sharing analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sharing analytics'
    });
  }
});

// Create shareable link
router.post('/create', auth, async (req: any, res) => {
  try {
    const { storyId, expiresIn = 7 * 24 * 60 * 60 * 1000, password, allowDownload = true } = req.body;
    const userId = req.user.id;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'Story ID is required'
      });
    }

    // Verify user owns the story
    const story = await prisma.story.findUnique({
      where: { id: storyId }
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

    // Generate share ID and URL
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareId}`;

    // In a real implementation, you would save this to a shares table
    // For now, we'll return the share information

    res.json({
      success: true,
      data: {
        shareId,
        shareUrl,
        storyId,
        expiresAt: new Date(Date.now() + expiresIn).toISOString(),
        allowDownload,
        hasPassword: !!password
      },
      message: 'Shareable link created successfully'
    });
  } catch (error) {
    console.error('Error creating shareable link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create shareable link'
    });
  }
});

// Update share settings
router.put('/:shareId', auth, async (req: any, res) => {
  try {
    const { shareId } = req.params;
    const { expiresIn, password, allowDownload } = req.body;

    // In a real implementation, you would update the share record in the database
    // For now, we'll return a success response

    res.json({
      success: true,
      message: 'Share settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating share settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update share settings'
    });
  }
});

// Delete shareable link
router.delete('/:shareId', auth, async (req: any, res) => {
  try {
    const { shareId } = req.params;

    // In a real implementation, you would delete the share record from the database
    // For now, we'll return a success response

    res.json({
      success: true,
      message: 'Shareable link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shareable link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete shareable link'
    });
  }
});

// Record view for shared story
router.post('/:shareId/view', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { userAgent, referrer } = req.body;

    // In a real implementation, you would record this view in the database
    // For now, we'll just return a success response

    res.json({
      success: true,
      message: 'View recorded successfully'
    });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record view'
    });
  }
});

// Validate share access
router.post('/:shareId/validate', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { password } = req.body;

    // In a real implementation, you would validate the share against the database
    // For now, we'll simulate validation

    const isValid = true; // Mock validation
    const isExpired = false;
    const requiresPassword = false;

    if (isExpired) {
      return res.status(410).json({
        success: false,
        error: 'Share link has expired'
      });
    }

    if (requiresPassword && !password) {
      return res.status(401).json({
        success: false,
        error: 'Password required',
        requiresPassword: true
      });
    }

    if (requiresPassword && password) {
      // In a real implementation, you would validate the password
      const isPasswordValid = true; // Mock password validation

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password',
          requiresPassword: true
        });
      }
    }

    res.json({
      success: true,
      data: {
        isValid,
        requiresPassword,
        storyInfo: {
          title: 'Shared Story Title',
          difficulty: 'ELEMENTARY',
          animationStyle: 'CARTOON',
          sceneCount: 3,
          duration: 45
        }
      }
    });
  } catch (error) {
    console.error('Error validating share access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate share access'
    });
  }
});

module.exports = router;