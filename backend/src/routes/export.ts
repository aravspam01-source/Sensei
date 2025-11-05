import express from 'express';
import { exportService } from '../services/exportService';
import { prisma } from '../models/database';
import { auth } from './users';

const router = express.Router();

// Export story as video
router.post('/video', auth, async (req: any, res) => {
  try {
    const { storyId, quality = 'medium', format = 'mp4', includeAudio = true } = req.body;
    const userId = req.user.id;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'Story ID is required'
      });
    }

    // Verify user owns the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        scenes: {
          orderBy: { scene_order: 'asc' },
          include: {
            assets: true
          }
        }
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
        error: 'Not authorized to export this story'
      });
    }

    // Start video export process
    const taskId = `video_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    exportService.exportVideo(taskId, {
      story,
      quality,
      format,
      includeAudio,
      userId
    }).catch(error => {
      console.error(`Error in video export for task ${taskId}:`, error);
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        estimatedTime: estimateExportTime(story.scenes.length, quality),
        message: 'Video export started'
      }
    });
  } catch (error) {
    console.error('Error starting video export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start video export'
    });
  }
});

// Export story as PDF
router.post('/pdf', auth, async (req: any, res) => {
  try {
    const { storyId, format = 'a4', includeThumbnails = true, layout = 'storyboard' } = req.body;
    const userId = req.user.id;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'Story ID is required'
      });
    }

    // Verify user owns the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        scenes: {
          orderBy: { scene_order: 'asc' },
          include: {
            assets: true
          }
        }
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
        error: 'Not authorized to export this story'
      });
    }

    // Start PDF export process
    const taskId = `pdf_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    exportService.exportPdf(taskId, {
      story,
      format,
      includeThumbnails,
      layout,
      userId
    }).catch(error => {
      console.error(`Error in PDF export for task ${taskId}:`, error);
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        estimatedTime: 30, // PDF exports are typically faster
        message: 'PDF export started'
      }
    });
  } catch (error) {
    console.error('Error starting PDF export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start PDF export'
    });
  }
});

// Export story as SCORM package for LMS integration
router.post('/scorm', auth, async (req: any, res) => {
  try {
    const { storyId, version = '1.2', includeQuiz = false } = req.body;
    const userId = req.user.id;

    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'Story ID is required'
      });
    }

    // Verify user owns the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        scenes: {
          orderBy: { scene_order: 'asc' },
          include: {
            assets: true
          }
        }
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
        error: 'Not authorized to export this story'
      });
    }

    // Start SCORM export process
    const taskId = `scorm_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    exportService.exportScorm(taskId, {
      story,
      version,
      includeQuiz,
      userId
    }).catch(error => {
      console.error(`Error in SCORM export for task ${taskId}:`, error);
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        estimatedTime: 60, // SCORM packages take longer
        message: 'SCORM export started'
      }
    });
  } catch (error) {
    console.error('Error starting SCORM export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start SCORM export'
    });
  }
});

// Get export status
router.get('/status/:taskId', auth, async (req: any, res) => {
  try {
    const { taskId } = req.params;

    const status = await exportService.getExportStatus(taskId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Export task not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error checking export status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check export status'
    });
  }
});

// Download exported file
router.get('/download/:taskId', auth, async (req: any, res) => {
  try {
    const { taskId } = req.params;

    const exportData = await exportService.getExportFile(taskId);

    if (!exportData) {
      return res.status(404).json({
        success: false,
        error: 'Export file not found'
      });
    }

    if (exportData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Export not yet completed'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Length', exportData.fileSize);

    // Stream the file
    exportData.stream.pipe(res);
  } catch (error) {
    console.error('Error downloading export file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download export file'
    });
  }
});

// Cancel export task
router.delete('/tasks/:taskId', auth, async (req: any, res) => {
  try {
    const { taskId } = req.params;

    await exportService.cancelExport(taskId);

    res.json({
      success: true,
      message: 'Export task cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling export task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel export task'
    });
  }
});

// Get user's export history
router.get('/history', auth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, format } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const history = await exportService.getExportHistory(userId, {
      page: Number(page),
      limit: Number(limit),
      format: format as string
    });

    res.json({
      success: true,
      data: history.exports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: history.total,
        totalPages: Math.ceil(history.total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching export history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch export history'
    });
  }
});

// Get export formats and options
router.get('/formats', auth, async (req: any, res) => {
  try {
    const formats = await exportService.getSupportedFormats();

    res.json({
      success: true,
      data: formats
    });
  } catch (error) {
    console.error('Error fetching export formats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch export formats'
    });
  }
});

// Batch export multiple stories
router.post('/batch', auth, async (req: any, res) => {
  try {
    const { storyIds, format, options = {} } = req.body;
    const userId = req.user.id;

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Story IDs array is required'
      });
    }

    if (!format) {
      return res.status(400).json({
        success: false,
        error: 'Export format is required'
      });
    }

    // Verify user owns all stories
    const stories = await prisma.story.findMany({
      where: {
        id: { in: storyIds },
        user_id: userId
      },
      include: {
        scenes: {
          orderBy: { scene_order: 'asc' },
          include: {
            assets: true
          }
        }
      }
    });

    if (stories.length !== storyIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to export some stories'
      });
    }

    // Start batch export process
    const taskId = `batch_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    exportService.batchExport(taskId, {
      stories,
      format,
      options,
      userId
    }).catch(error => {
      console.error(`Error in batch export for task ${taskId}:`, error);
    });

    res.json({
      success: true,
      data: {
        taskId,
        status: 'pending',
        totalStories: stories.length,
        estimatedTime: estimateExportTime(
          stories.reduce((total, story) => total + story.scenes.length, 0),
          options.quality || 'medium'
        ) * stories.length,
        message: 'Batch export started'
      }
    });
  } catch (error) {
    console.error('Error starting batch export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start batch export'
    });
  }
});

// Create shareable export link
router.post('/share/:taskId', auth, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { expiresIn = 24 * 60 * 60 * 1000, password, allowDownload = true } = req.body; // Default 24 hours

    const shareData = await exportService.createShareableLink(taskId, {
      expiresIn,
      password,
      allowDownload,
      createdBy: req.user.id
    });

    res.json({
      success: true,
      data: shareData,
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

// Get shared export (public access)
router.get('/shared/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { password } = req.query;

    const exportData = await exportService.getSharedExport(shareId, password as string);

    if (!exportData) {
      return res.status(404).json({
        success: false,
        error: 'Shared export not found'
      });
    }

    // Set headers for file download or preview
    if (exportData.allowDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      res.setHeader('Content-Type', exportData.contentType);
      res.setHeader('Content-Length', exportData.fileSize);
      exportData.stream.pipe(res);
    } else {
      // Return preview information
      res.json({
        success: true,
        data: {
          filename: exportData.filename,
          fileSize: exportData.fileSize,
          contentType: exportData.contentType,
          createdAt: exportData.createdAt,
          previewAvailable: true
        }
      });
    }
  } catch (error) {
    console.error('Error accessing shared export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to access shared export'
    });
  }
});

// Helper function to estimate export time
function estimateExportTime(sceneCount: number, quality: string): number {
  const baseTime = 30; // Base 30 seconds
  const timePerScene = {
    low: 5,
    medium: 10,
    high: 20
  };

  return baseTime + (sceneCount * (timePerScene[quality as keyof typeof timePerScene] || 10));
}

module.exports = router;