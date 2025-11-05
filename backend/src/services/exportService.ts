import { Story, Scene } from '@prisma/client';
import { prisma } from '../models/database';

export interface ExportTask {
  id: string;
  type: 'video' | 'pdf' | 'scorm' | 'batch';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  userId: string;
}

export interface VideoExportOptions {
  story: Story & { scenes: Scene[] };
  quality: 'low' | 'medium' | 'high';
  format: 'mp4' | 'webm';
  includeAudio: boolean;
  userId: string;
}

export interface PdfExportOptions {
  story: Story & { scenes: Scene[] };
  format: 'a4' | 'letter';
  includeThumbnails: boolean;
  layout: 'storyboard' | 'script';
  userId: string;
}

export interface ScormExportOptions {
  story: Story & { scenes: Scene[] };
  version: '1.2' | '2004';
  includeQuiz: boolean;
  userId: string;
}

export interface BatchExportOptions {
  stories: (Story & { scenes: Scene[] })[];
  format: 'video' | 'pdf';
  options: any;
  userId: string;
}

export class ExportService {
  private exportTasks: Map<string, ExportTask> = new Map();

  // Export story as video
  async exportVideo(taskId: string, options: VideoExportOptions): Promise<void> {
    const task: ExportTask = {
      id: taskId,
      type: 'video',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      userId: options.userId
    };

    this.exportTasks.set(taskId, task);

    try {
      task.status = 'processing';
      task.startedAt = new Date();
      task.progress = 10;

      // Process scenes and prepare for video compilation
      const processedScenes = await this.processScenesForVideo(options.story.scenes);
      task.progress = 30;

      // Generate video based on quality settings
      const videoConfig = this.getVideoConfig(options.quality, options.format);
      task.progress = 40;

      // Compile animations into video
      const videoData = await this.compileVideo(processedScenes, videoConfig, (progress) => {
        task.progress = 40 + (progress * 0.5); // 40-90% range
      });
      task.progress = 90;

      // Add audio if requested
      if (options.includeAudio) {
        await this.addAudioToVideo(videoData, options.story);
        task.progress = 95;
      }

      // Save final video file
      const finalVideoUrl = await this.saveVideoFile(videoData, options);
      task.progress = 100;

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = {
        url: finalVideoUrl,
        filename: `${this.slugify(options.story.title)}_${options.quality}.${options.format}`,
        fileSize: this.estimateFileSize(options.story, options.quality, 'video'),
        duration: options.story.scenes.reduce((total, scene) => total + scene.duration, 0),
        format: options.format,
        quality: options.quality
      };

    } catch (error) {
      console.error(`Video export failed for task ${taskId}:`, error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  // Export story as PDF
  async exportPdf(taskId: string, options: PdfExportOptions): Promise<void> {
    const task: ExportTask = {
      id: taskId,
      type: 'pdf',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      userId: options.userId
    };

    this.exportTasks.set(taskId, task);

    try {
      task.status = 'processing';
      task.startedAt = new Date();
      task.progress = 10;

      // Generate PDF content based on layout
      const pdfContent = await this.generatePdfContent(options, (progress) => {
        task.progress = 10 + (progress * 0.7); // 10-80% range
      });
      task.progress = 80;

      // Generate thumbnails if requested
      if (options.includeThumbnails) {
        await this.generatePdfThumbnails(pdfContent, options.story.scenes);
        task.progress = 90;
      }

      // Compile and save PDF
      const pdfUrl = await this.savePdfFile(pdfContent, options);
      task.progress = 100;

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = {
        url: pdfUrl,
        filename: `${this.slugify(options.story.title)}_${options.layout}.pdf`,
        fileSize: this.estimateFileSize(options.story, 'medium', 'pdf'),
        format: 'pdf',
        layout: options.layout,
        pages: options.story.scenes.length + (options.layout === 'storyboard' ? 1 : 0)
      };

    } catch (error) {
      console.error(`PDF export failed for task ${taskId}:`, error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  // Export story as SCORM package
  async exportScorm(taskId: string, options: ScormExportOptions): Promise<void> {
    const task: ExportTask = {
      id: taskId,
      type: 'scorm',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      userId: options.userId
    };

    this.exportTasks.set(taskId, task);

    try {
      task.status = 'processing';
      task.startedAt = new Date();
      task.progress = 10;

      // Generate SCORM manifest
      const manifest = await this.generateScormManifest(options);
      task.progress = 30;

      // Create HTML content wrapper
      const htmlContent = await this.createScormHtmlContent(options);
      task.progress = 50;

      // Package animations and assets
      const packagedAssets = await this.packageScormAssets(options);
      task.progress = 70;

      // Add quiz if requested
      if (options.includeQuiz) {
        await this.addScormQuiz(htmlContent, options);
        task.progress = 85;
      }

      // Create SCORM package
      const packageUrl = await this.createScormPackage(manifest, htmlContent, packagedAssets, options);
      task.progress = 100;

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = {
        url: packageUrl,
        filename: `${this.slugify(options.story.title)}_scorm.zip`,
        fileSize: this.estimateFileSize(options.story, 'medium', 'scorm'),
        format: 'scorm',
        version: options.version,
        hasQuiz: options.includeQuiz
      };

    } catch (error) {
      console.error(`SCORM export failed for task ${taskId}:`, error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  // Batch export multiple stories
  async batchExport(taskId: string, options: BatchExportOptions): Promise<void> {
    const task: ExportTask = {
      id: taskId,
      type: 'batch',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      userId: options.userId
    };

    this.exportTasks.set(taskId, task);

    try {
      task.status = 'processing';
      task.startedAt = new Date();

      const results = [];

      for (let i = 0; i < options.stories.length; i++) {
        const story = options.stories[i];
        task.progress = (i / options.stories.length) * 100;

        try {
          let result;

          if (options.format === 'video') {
            const videoTaskId = `batch_video_${taskId}_${i}`;
            await this.exportVideo(videoTaskId, {
              ...options.options,
              story,
              userId: options.userId
            });

            const videoTask = this.exportTasks.get(videoTaskId);
            result = videoTask?.result;
          } else if (options.format === 'pdf') {
            const pdfTaskId = `batch_pdf_${taskId}_${i}`;
            await this.exportPdf(pdfTaskId, {
              ...options.options,
              story,
              userId: options.userId
            });

            const pdfTask = this.exportTasks.get(pdfTaskId);
            result = pdfTask?.result;
          }

          results.push({
            storyId: story.id,
            storyTitle: story.title,
            success: true,
            result
          });

        } catch (error) {
          results.push({
            storyId: story.id,
            storyTitle: story.title,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Create batch summary
      const batchUrl = await this.createBatchPackage(results, options);
      task.progress = 100;

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = {
        type: 'batch',
        url: batchUrl,
        filename: `batch_export_${Date.now()}.zip`,
        totalStories: options.stories.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  // Get export status
  async getExportStatus(taskId: string): Promise<ExportTask | null> {
    return this.exportTasks.get(taskId) || null;
  }

  // Get export file for download
  async getExportFile(taskId: string): Promise<{
    stream: any;
    filename: string;
    contentType: string;
    fileSize: number;
    status: string;
  } | null> {
    const task = this.exportTasks.get(taskId);

    if (!task || task.status !== 'completed') {
      return null;
    }

    // In a real implementation, this would stream the actual file
    return {
      stream: null, // Would be actual file stream
      filename: task.result?.filename || 'export',
      contentType: this.getContentType(task.type, task.result?.format),
      fileSize: task.result?.fileSize || 0,
      status: task.status
    };
  }

  // Cancel export task
  async cancelExport(taskId: string): Promise<void> {
    const task = this.exportTasks.get(taskId);

    if (task && (task.status === 'pending' || task.status === 'processing')) {
      task.status = 'failed';
      task.error = 'Export cancelled by user';
      task.completedAt = new Date();
    }
  }

  // Get export history for user
  async getExportHistory(userId: string, options: {
    page: number;
    limit: number;
    format?: string;
  }): Promise<{
    exports: any[];
    total: number;
  }> {
    // In a real implementation, this would query the database
    const userExports = Array.from(this.exportTasks.values())
      .filter(task => task.userId === userId)
      .filter(task => task.status === 'completed')
      .filter(task => !options.format || task.result?.format === options.format)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((options.page - 1) * options.limit, options.page * options.limit);

    return {
      exports: userExports,
      total: userExports.length
    };
  }

  // Get supported export formats
  async getSupportedFormats(): Promise<{
    video: Array<{ format: string; qualities: string[]; description: string }>;
    pdf: Array<{ format: string; layouts: string[]; description: string }>;
    scorm: Array<{ version: string; description: string }>;
  }> {
    return {
      video: [
        {
          format: 'mp4',
          qualities: ['low', 'medium', 'high'],
          description: 'Standard video format compatible with most devices'
        },
        {
          format: 'webm',
          qualities: ['low', 'medium', 'high'],
          description: 'Web-optimized video format for online streaming'
        }
      ],
      pdf: [
        {
          format: 'pdf',
          layouts: ['storyboard', 'script'],
          description: 'Portable document format for easy sharing and printing'
        }
      ],
      scorm: [
        {
          version: '1.2',
          description: 'SCORM 1.2 compatible package for Learning Management Systems'
        },
        {
          version: '2004',
          description: 'SCORM 2004 4th Edition package for modern LMS platforms'
        }
      ]
    };
  }

  // Create shareable link for export
  async createShareableLink(taskId: string, options: {
    expiresIn: number;
    password?: string;
    allowDownload: boolean;
    createdBy: string;
  }): Promise<{
    shareId: string;
    shareUrl: string;
    expiresAt: Date;
    allowDownload: boolean;
    hasPassword: boolean;
  }> {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `${process.env.FRONTEND_URL}/share/export/${shareId}`;

    // In a real implementation, save to database
    // await db.sharedExports.create({
    //   shareId,
    //   taskId,
    //   expiresAt: new Date(Date.now() + options.expiresIn),
    //   password: options.password,
    //   allowDownload: options.allowDownload,
    //   createdBy: options.createdBy
    // });

    return {
      shareId,
      shareUrl,
      expiresAt: new Date(Date.now() + options.expiresIn),
      allowDownload: options.allowDownload,
      hasPassword: !!options.password
    };
  }

  // Get shared export
  async getSharedExport(shareId: string, password?: string): Promise<{
    stream: any;
    filename: string;
    contentType: string;
    fileSize: number;
    createdAt: Date;
    allowDownload: boolean;
  } | null> {
    // In a real implementation, validate share and return file
    // const sharedExport = await db.sharedExports.findUnique({
    //   where: { shareId },
    //   include: { task: true }
    // });

    // if (!sharedExport || sharedExport.expiresAt < new Date()) {
    //   return null;
    // }

    // if (sharedExport.password && sharedExport.password !== password) {
    //   throw new Error('Invalid password');
    // }

    return null; // Placeholder
  }

  // Private helper methods

  private async processScenesForVideo(scenes: Scene[]): Promise<any[]> {
    return scenes.map(scene => ({
      id: scene.id,
      duration: scene.duration,
      content: scene.text_content,
      visualElements: scene.visual_elements,
      animationData: scene.animation_data
    }));
  }

  private getVideoConfig(quality: string, format: string): any {
    const configs = {
      low: { resolution: '480p', bitrate: '500k', framerate: 24 },
      medium: { resolution: '720p', bitrate: '1500k', framerate: 30 },
      high: { resolution: '1080p', bitrate: '3000k', framerate: 30 }
    };

    return {
      ...configs[quality as keyof typeof configs] || configs.medium,
      format,
      codec: format === 'webm' ? 'VP9' : 'H.264'
    };
  }

  private async compileVideo(scenes: any[], config: any, progressCallback?: (progress: number) => void): Promise<any> {
    // Simulate video compilation
    for (let i = 0; i < scenes.length; i++) {
      await this.simulateProcessing(500);
      progressCallback?.((i + 1) / scenes.length);
    }

    return {
      format: config.format,
      config,
      scenes,
      metadata: {
        duration: scenes.reduce((total, scene) => total + scene.duration, 0)
      }
    };
  }

  private async addAudioToVideo(videoData: any, story: Story): Promise<void> {
    // Simulate audio addition
    await this.simulateProcessing(1000);
  }

  private async saveVideoFile(videoData: any, options: VideoExportOptions): Promise<string> {
    const filename = `${this.slugify(options.story.title)}_${options.quality}_${Date.now()}.${options.format}`;
    return `/exports/videos/${filename}`;
  }

  private async generatePdfContent(options: PdfExportOptions, progressCallback?: (progress: number) => void): Promise<any> {
    const content = {
      title: options.story.title,
      layout: options.layout,
      format: options.format,
      scenes: options.story.scenes,
      metadata: {
        createdAt: new Date().toISOString(),
        difficulty: options.story.difficulty_level,
        style: options.story.animation_style
      }
    };

    // Simulate PDF generation
    for (let i = 0; i < options.story.scenes.length; i++) {
      await this.simulateProcessing(300);
      progressCallback?.((i + 1) / options.story.scenes.length);
    }

    return content;
  }

  private async generatePdfThumbnails(pdfContent: any, scenes: Scene[]): Promise<void> {
    // Simulate thumbnail generation
    await this.simulateProcessing(scenes.length * 200);
  }

  private async savePdfFile(pdfContent: any, options: PdfExportOptions): Promise<string> {
    const filename = `${this.slugify(options.story.title)}_${options.layout}_${Date.now()}.pdf`;
    return `/exports/pdfs/${filename}`;
  }

  private async generateScormManifest(options: ScormExportOptions): Promise<any> {
    return {
      identifier: `course_${options.story.id}_${Date.now()}`,
      version: options.version,
      title: options.story.title,
      structure: 'hierarchical',
      entry: 'resource_1'
    };
  }

  private async createScormHtmlContent(options: ScormExportOptions): Promise<any> {
    return {
      html: `<!DOCTYPE html><html><head><title>${options.story.title}</title></head><body>...</body></html>`,
      scripts: ['scorm_api.js', 'content_loader.js'],
      styles: ['scorm_styles.css']
    };
  }

  private async packageScormAssets(options: ScormExportOptions): Promise<string[]> {
    // Simulate asset packaging
    return options.story.scenes.map(scene => `/assets/scene_${scene.id}.json`);
  }

  private async addScormQuiz(htmlContent: any, options: ScormExportOptions): Promise<void> {
    // Simulate quiz addition
    await this.simulateProcessing(2000);
  }

  private async createScormPackage(manifest: any, htmlContent: any, assets: string[], options: ScormExportOptions): Promise<string> {
    const filename = `${this.slugify(options.story.title)}_scorm_${options.version}_${Date.now()}.zip`;
    return `/exports/scorm/${filename}`;
  }

  private async createBatchPackage(results: any[], options: BatchExportOptions): Promise<string> {
    const filename = `batch_export_${options.format}_${Date.now()}.zip`;
    return `/exports/batch/${filename}`;
  }

  private getContentType(type: string, format?: string): string {
    const types = {
      video: format === 'webm' ? 'video/webm' : 'video/mp4',
      pdf: 'application/pdf',
      scorm: 'application/zip',
      batch: 'application/zip'
    };

    return types[type as keyof typeof types] || 'application/octet-stream';
  }

  private estimateFileSize(story: Story & { scenes: Scene[] }, quality: string, type: string): number {
    const baseSizes = {
      video: { low: 2, medium: 5, high: 10 }, // MB per minute
      pdf: 0.5, // MB per page
      scorm: 20 // MB base size
    };

    const duration = story.scenes.reduce((total, scene) => total + scene.duration, 0) / 60; // minutes

    if (type === 'video') {
      return Math.round(duration * (baseSizes.video[quality as keyof typeof baseSizes.video] || baseSizes.video.medium) * 1024 * 1024);
    } else if (type === 'pdf') {
      return Math.round((story.scenes.length + 1) * baseSizes.pdf * 1024 * 1024);
    } else {
      return Math.round(baseSizes.scorm * 1024 * 1024);
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const exportService = new ExportService();