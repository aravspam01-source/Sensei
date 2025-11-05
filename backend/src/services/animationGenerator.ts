import { AnimationStyle, DifficultyLevel, GeneratedAsset, AssetType, GenerationMethod } from '@prisma/client';
import { prisma } from '../models/database';

export interface AnimationRequest {
  text: string;
  keywords: string[];
  style: AnimationStyle;
  difficulty: DifficultyLevel;
}

export interface GenerationTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface PremadeAnimation {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  thumbnailUrl: string;
  animationUrl: string;
  duration: number;
  category: string;
  difficulty: DifficultyLevel[];
  style: AnimationStyle[];
}

export interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  animationData: any;
  category: string;
  createdBy: string;
  createdAt: Date;
}

export class AnimationGenerator {
  private generationTasks: Map<string, GenerationTask> = new Map();
  private premadeAnimations: PremadeAnimation[] = [];

  constructor() {
    this.initializePremadeAnimations();
  }

  // Initialize pre-made animation library
  private initializePremadeAnimations() {
    this.premadeAnimations = [
      {
        id: 'water_cycle_001',
        name: 'Water Cycle',
        description: 'Complete water cycle animation with evaporation, condensation, and precipitation',
        keywords: ['water', 'cycle', 'evaporation', 'condensation', 'precipitation', 'sun', 'cloud', 'rain'],
        thumbnailUrl: '/animations/premade/water_cycle_thumb.jpg',
        animationUrl: '/animations/premade/water_cycle.json',
        duration: 8,
        category: 'science',
        difficulty: ['ELEMENTARY', 'MIDDLE'],
        style: ['CARTOON', 'REALISTIC']
      },
      {
        id: 'photosynthesis_001',
        name: 'Photosynthesis Process',
        description: 'Plant photosynthesis showing how plants convert sunlight into energy',
        keywords: ['photosynthesis', 'plant', 'sunlight', 'chlorophyll', 'carbon dioxide', 'oxygen'],
        thumbnailUrl: '/animations/premade/photosynthesis_thumb.jpg',
        animationUrl: '/animations/premade/photosynthesis.json',
        duration: 6,
        category: 'science',
        difficulty: ['MIDDLE', 'HIGH'],
        style: ['REALISTIC', 'ABSTRACT']
      },
      {
        id: 'solar_system_001',
        name: 'Solar System',
        description: 'Animated solar system showing planets orbiting around the sun',
        keywords: ['solar', 'system', 'planets', 'sun', 'orbit', 'earth', 'mars', 'jupiter'],
        thumbnailUrl: '/animations/premade/solar_system_thumb.jpg',
        animationUrl: '/animations/premade/solar_system.json',
        duration: 10,
        category: 'science',
        difficulty: ['ELEMENTARY', 'MIDDLE', 'HIGH'],
        style: ['CARTOON', 'REALISTIC']
      },
      {
        id: 'cell_structure_001',
        name: 'Cell Structure',
        description: 'Detailed animal cell structure with organelles',
        keywords: ['cell', 'structure', 'nucleus', 'mitochondria', 'membrane', 'organelles'],
        thumbnailUrl: '/animations/premade/cell_structure_thumb.jpg',
        animationUrl: '/animations/premade/cell_structure.json',
        duration: 7,
        category: 'science',
        difficulty: ['MIDDLE', 'HIGH'],
        style: ['REALISTIC', 'ABSTRACT']
      },
      {
        id: 'fraction_visualization_001',
        name: 'Fraction Visualization',
        description: 'Visual representation of fractions and division',
        keywords: ['fraction', 'division', 'numerator', 'denominator', 'mathematics', 'calculate'],
        thumbnailUrl: '/animations/premade/fraction_thumb.jpg',
        animationUrl: '/animations/premade/fraction.json',
        duration: 5,
        category: 'mathematics',
        difficulty: ['ELEMENTARY', 'MIDDLE'],
        style: ['CARTOON', 'ABSTRACT']
      },
      {
        id: 'ancient_egypt_001',
        name: 'Ancient Egypt',
        description: 'Ancient Egyptian civilization with pyramids and Nile river',
        keywords: ['ancient', 'egypt', 'pyramid', 'pharaoh', 'nile', 'civilization', 'history'],
        thumbnailUrl: '/animations/premade/ancient_egypt_thumb.jpg',
        animationUrl: '/animations/premade/ancient_egypt.json',
        duration: 8,
        category: 'history',
        difficulty: ['MIDDLE', 'HIGH'],
        style: ['CARTOON', 'REALISTIC']
      },
      {
        id: 'grammar_lesson_001',
        name: 'Grammar Basics',
        description: 'Basic grammar concepts with sentence structure',
        keywords: ['grammar', 'sentence', 'noun', 'verb', 'adjective', 'language', 'writing'],
        thumbnailUrl: '/animations/premade/grammar_thumb.jpg',
        animationUrl: '/animations/premade/grammar.json',
        duration: 6,
        category: 'language',
        difficulty: ['ELEMENTARY', 'MIDDLE'],
        style: ['CARTOON', 'ABSTRACT']
      },
      {
        id: 'volcanic_eruption_001',
        name: 'Volcanic Eruption',
        description: 'Volcanic eruption showing magma flow and lava',
        keywords: ['volcano', 'eruption', 'lava', 'magma', 'earth', 'geology', 'rock'],
        thumbnailUrl: '/animations/premade/volcano_thumb.jpg',
        animationUrl: '/animations/premade/volcano.json',
        duration: 6,
        category: 'science',
        difficulty: ['MIDDLE', 'HIGH'],
        style: ['REALISTIC', 'CARTOON']
      }
    ];
  }

  // Get available pre-made animations
  async getPremadeAnimations(filters?: {
    category?: string;
    difficulty?: string;
    style?: string;
  }): Promise<PremadeAnimation[]> {
    let filtered = this.premadeAnimations;

    if (filters?.category) {
      filtered = filtered.filter(anim => anim.category === filters.category);
    }

    if (filters?.difficulty) {
      filtered = filtered.filter(anim => anim.difficulty.includes(filters.difficulty as DifficultyLevel));
    }

    if (filters?.style) {
      filtered = filtered.filter(anim => anim.style.includes(filters.style as AnimationStyle));
    }

    return filtered;
  }

  // Generate animation from text
  async generateAnimation(taskId: string, request: AnimationRequest): Promise<void> {
    const task: GenerationTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.generationTasks.set(taskId, task);

    try {
      // Update status to processing
      task.status = 'processing';
      task.startedAt = new Date();
      task.progress = 10;

      // Check for matching pre-made animations
      const matchingAnimation = this.findMatchingAnimation(request);

      if (matchingAnimation) {
        task.progress = 50;

        // Simulate processing time
        await this.simulateProcessing(2000);

        task.progress = 90;
        task.result = {
          type: 'premade',
          animationId: matchingAnimation.id,
          url: matchingAnimation.animationUrl,
          thumbnailUrl: matchingAnimation.thumbnailUrl,
          duration: matchingAnimation.duration
        };
      } else {
        // Generate custom animation using AI
        task.progress = 30;

        const aiResult = await this.generateCustomAnimation(request, (progress) => {
          task.progress = 30 + (progress * 0.6); // 30-90% range
        });

        task.result = {
          type: 'custom',
          url: aiResult.url,
          thumbnailUrl: aiResult.thumbnailUrl,
          duration: aiResult.duration,
          metadata: aiResult.metadata
        };
      }

      // Complete task
      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();

    } catch (error) {
      console.error(`Animation generation failed for task ${taskId}:`, error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  // Generate AI images for concepts
  async generateAiImage(concept: string, style: AnimationStyle): Promise<string> {
    try {
      // Simulate AI image generation
      await this.simulateProcessing(3000);

      // Mock image URL
      const imageUrl = `/generated/ai_images/${this.slugify(concept)}_${Date.now()}.jpg`;

      return imageUrl;
    } catch (error) {
      console.error(`Failed to generate AI image for concept "${concept}":`, error);
      throw error;
    }
  }

  // Get generation task status
  async getGenerationStatus(taskId: string): Promise<GenerationTask | null> {
    return this.generationTasks.get(taskId) || null;
  }

  // Get animation categories
  async getAnimationCategories(): Promise<string[]> {
    const categories = [...new Set(this.premadeAnimations.map(anim => anim.category))];
    return categories.sort();
  }

  // Search animations by keyword
  async searchAnimations(params: {
    query: string;
    difficulty?: string;
    style?: string;
    limit: number;
  }): Promise<PremadeAnimation[]> {
    const { query, difficulty, style, limit } = params;
    const lowerQuery = query.toLowerCase();

    let filtered = this.premadeAnimations.filter(anim =>
      anim.name.toLowerCase().includes(lowerQuery) ||
      anim.description.toLowerCase().includes(lowerQuery) ||
      anim.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
    );

    if (difficulty) {
      filtered = filtered.filter(anim => anim.difficulty.includes(difficulty as DifficultyLevel));
    }

    if (style) {
      filtered = filtered.filter(anim => anim.style.includes(style as AnimationStyle));
    }

    return filtered.slice(0, limit);
  }

  // Generate assets for a scene
  async generateAssetsForScene(sceneId: string, visualElements: any): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];

    try {
      // Generate background
      if (visualElements.visualElements?.length > 0) {
        const backgroundAsset = await this.generateAsset(sceneId, {
          type: 'BACKGROUND',
          concept: visualElements.visualElements[0],
          style: visualElements.animationStyle,
          method: 'ai'
        });
        assets.push(backgroundAsset);
      }

      // Generate character/main element
      if (visualElements.keywords?.length > 0) {
        const characterAsset = await this.generateAsset(sceneId, {
          type: 'CHARACTER',
          concept: visualElements.keywords[0],
          style: visualElements.animationStyle,
          method: 'ai'
        });
        assets.push(characterAsset);
      }

      // Generate additional props
      if (visualElements.visualElements?.length > 1) {
        for (let i = 1; i < Math.min(visualElements.visualElements.length, 3); i++) {
          const propAsset = await this.generateAsset(sceneId, {
            type: 'PROP',
            concept: visualElements.visualElements[i],
            style: visualElements.animationStyle,
            method: 'pre_made'
          });
          assets.push(propAsset);
        }
      }

    } catch (error) {
      console.error(`Failed to generate assets for scene ${sceneId}:`, error);
    }

    return assets;
  }

  // Create custom animation template
  async createCustomTemplate(templateData: {
    name: string;
    description: string;
    keywords: string[];
    animationData: any;
    category: string;
    createdBy: string;
  }): Promise<AnimationTemplate> {
    const template: AnimationTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...templateData,
      createdAt: new Date()
    };

    // In a real implementation, save to database
    // await db.animationTemplates.create(template);

    return template;
  }

  // Get user's custom templates
  async getUserCustomTemplates(userId: string, options: {
    category?: string;
    limit: number;
  }): Promise<AnimationTemplate[]> {
    // In a real implementation, fetch from database
    // return await db.animationTemplates.findMany({
    //   where: { createdBy: userId, category: options.category },
    //   limit: options.limit
    // });

    return []; // Placeholder
  }

  // Delete custom template
  async deleteCustomTemplate(templateId: string, userId: string): Promise<void> {
    // In a real implementation, delete from database
    // await db.animationTemplates.delete({
    //   where: { id: templateId, createdBy: userId }
    // });
  }

  // Generate animation variations
  async generateVariations(taskId: string, params: {
    baseAnimationId: string;
    variations: string[];
    style: AnimationStyle;
  }): Promise<void> {
    const task: GenerationTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.generationTasks.set(taskId, task);

    try {
      task.status = 'processing';
      task.startedAt = new Date();

      const results = [];

      for (let i = 0; i < params.variations.length; i++) {
        task.progress = (i / params.variations.length) * 100;

        // Simulate variation generation
        await this.simulateProcessing(2000);

        results.push({
          variation: params.variations[i],
          url: `/animations/variations/${params.baseAnimationId}_${this.slugify(params.variations[i])}.json`,
          thumbnailUrl: `/animations/variations/${params.baseAnimationId}_${this.slugify(params.variations[i])}_thumb.jpg`
        });
      }

      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();
      task.result = { type: 'variations', variations: results };

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  // Batch generate animations
  async batchGenerate(taskId: string, params: {
    concepts: string[];
    style: AnimationStyle;
    difficulty: DifficultyLevel;
    priority: 'low' | 'normal' | 'high';
  }): Promise<void> {
    const task: GenerationTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.generationTasks.set(taskId, task);

    try {
      task.status = 'processing';
      task.startedAt = new Date();

      const results = [];

      for (let i = 0; i < params.concepts.length; i++) {
        task.progress = (i / params.concepts.length) * 100;

        const concept = params.concepts[i];
        const request: AnimationRequest = {
          text: concept,
          keywords: [concept],
          style: params.style,
          difficulty: params.difficulty
        };

        try {
          const result = await this.generateCustomAnimation(request, () => {});
          results.push({
            concept,
            success: true,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl
          });
        } catch (error) {
          results.push({
            concept,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();
      task.result = { type: 'batch', results };

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
    }
  }

  // Private helper methods

  private findMatchingAnimation(request: AnimationRequest): PremadeAnimation | null {
    const { keywords, difficulty, style } = request;

    for (const animation of this.premadeAnimations) {
      const keywordMatches = animation.keywords.filter(keyword =>
        keywords.some(userKeyword =>
          keyword.toLowerCase().includes(userKeyword.toLowerCase()) ||
          userKeyword.toLowerCase().includes(keyword.toLowerCase())
        )
      ).length;

      const styleMatch = animation.style.includes(style);
      const difficultyMatch = animation.difficulty.includes(difficulty);

      if (keywordMatches >= 2 && styleMatch && difficultyMatch) {
        return animation;
      }
    }

    return null;
  }

  private async generateCustomAnimation(request: AnimationRequest, progressCallback?: (progress: number) => void): Promise<{
    url: string;
    thumbnailUrl: string;
    duration: number;
    metadata: any;
  }> {
    progressCallback?.(0);

    // Simulate complex AI generation process
    await this.simulateProcessing(1000);
    progressCallback?.(20);

    // Generate animation script based on text
    const animationScript = await this.generateAnimationScript(request);
    progressCallback?.(40);

    // Create visual elements
    const visualElements = await this.createVisualElements(request);
    progressCallback?.(60);

    // Generate animation data
    const animationData = await this.compileAnimation(animationScript, visualElements);
    progressCallback?.(80);

    // Create thumbnail
    const thumbnailUrl = await this.generateThumbnail(animationData);
    progressCallback?.(90);

    // Save animation file
    const animationUrl = await this.saveAnimation(animationData, request);
    progressCallback?.(100);

    return {
      url: animationUrl,
      thumbnailUrl,
      duration: this.estimateAnimationDuration(request.text),
      metadata: {
        keywords: request.keywords,
        style: request.style,
        difficulty: request.difficulty,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private async generateAnimationScript(request: AnimationRequest): Promise<any> {
    // Simplified animation script generation
    return {
      scenes: [
        {
          duration: 3,
          elements: [
            { type: 'text', content: request.text.substring(0, 50) + '...', position: 'center' },
            { type: 'visual', concept: request.keywords[0] || 'default', animation: 'fadeIn' }
          ]
        }
      ],
      transitions: ['fade'],
      effects: ['smooth']
    };
  }

  private async createVisualElements(request: AnimationRequest): Promise<any> {
    return {
      background: this.generateBackground(request.style),
      characters: request.keywords.slice(0, 2).map(keyword => ({
        type: 'character',
        concept: keyword,
        style: request.style
      })),
      props: request.keywords.slice(2, 4).map(keyword => ({
        type: 'prop',
        concept: keyword,
        style: request.style
      }))
    };
  }

  private async compileAnimation(script: any, elements: any): Promise<any> {
    // Simulate animation compilation
    return {
      format: 'lottie',
      version: '1.0',
      script,
      elements,
      metadata: {
        frames: 60,
        framerate: 30
      }
    };
  }

  private async generateThumbnail(animationData: any): Promise<string> {
    // Simulate thumbnail generation
    const thumbnailId = `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    return `/thumbnails/${thumbnailId}`;
  }

  private async saveAnimation(animationData: any, request: AnimationRequest): Promise<string> {
    // Simulate saving animation file
    const animationId = `animation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    return `/animations/custom/${animationId}`;
  }

  private generateBackground(style: AnimationStyle): string {
    const backgrounds = {
      CARTOON: ['colorful_gradient', 'sky_blue', 'sunny_day'],
      REALISTIC: ['natural_scene', 'classroom', 'laboratory'],
      ABSTRACT: ['geometric_patterns', 'colorful_shapes', 'minimalist']
    };

    const styleBackgrounds = backgrounds[style] || backgrounds.CARTOON;
    return styleBackgrounds[Math.floor(Math.random() * styleBackgrounds.length)];
  }

  private estimateAnimationDuration(text: string): number {
    const wordCount = text.split(/\s+/).length;
    return Math.max(3, Math.min(10, Math.ceil(wordCount / 10)));
  }

  private async generateAsset(sceneId: string, assetData: {
    type: AssetType;
    concept: string;
    style: AnimationStyle;
    method: GenerationMethod;
  }): Promise<GeneratedAsset> {
    // In a real implementation, this would generate or fetch the asset
    const asset = await prisma.generatedAsset.create({
      data: {
        scene_id: sceneId,
        asset_type: assetData.type,
        cloudinary_url: `/assets/${assetData.type.toLowerCase()}_${this.slugify(assetData.concept)}.png`,
        generation_method: assetData.method,
        metadata: {
          concept: assetData.concept,
          style: assetData.style,
          generatedAt: new Date().toISOString()
        }
      }
    });

    return asset;
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
export const animationGenerator = new AnimationGenerator();