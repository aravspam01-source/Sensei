import { useState, useCallback } from 'react';
import { Scene, DifficultyLevel, AnimationStyle } from '../App';
import { api } from '../services/api';

interface ProcessedText {
  paragraphs: string[];
  sentences: string[];
  keywords: string[];
  concepts: string[];
  difficulty: DifficultyLevel;
  estimatedScenes: number;
}

interface UseStoryGenerationReturn {
  processText: (text: string, difficulty: DifficultyLevel) => ProcessedText;
  generateScenes: (processedText: ProcessedText, difficulty: DifficultyLevel, animationStyle: AnimationStyle) => Promise<Scene[]>;
  isProcessing: boolean;
  error: string | null;
}

export const useStoryGeneration = (): UseStoryGenerationReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common educational keywords by difficulty level
  const educationalKeywords = {
    ELEMENTARY: [
      'sun', 'moon', 'star', 'water', 'plant', 'animal', 'tree', 'flower', 'rain', 'cloud',
      'earth', 'sky', 'ocean', 'mountain', 'river', 'forest', 'garden', 'school', 'home',
      'family', 'friend', 'happy', 'sad', 'big', 'small', 'fast', 'slow', 'hot', 'cold'
    ],
    MIDDLE: [
      'photosynthesis', 'evaporation', 'condensation', 'precipitation', 'ecosystem', 'habitat',
      'organism', 'cell', 'molecule', 'energy', 'force', 'gravity', 'motion', 'chemical',
      'reaction', 'experiment', 'hypothesis', 'data', 'analysis', 'ancient', 'civilization',
      'government', 'economy', 'culture', 'geography', 'history', 'literature', 'mathematics'
    ],
    HIGH: [
      'mitochondria', 'chloroplast', 'dna', 'evolution', 'quantum', 'relativity', 'calculus',
      'derivative', 'integral', 'philosophy', 'democracy', 'constitution', 'industrialization',
      'globalization', 'sustainability', 'renewable', 'technology', 'engineering', 'algorithm',
      'artificial intelligence', 'neural network', 'quantum computing', 'nanotechnology'
    ]
  };

  // Pre-made animation templates for common educational concepts
  const premadeAnimations = [
    {
      keywords: ['water cycle', 'evaporation', 'condensation', 'precipitation'],
      type: 'water_cycle',
      duration: 8,
      visualElements: ['sun', 'ocean', 'clouds', 'rain']
    },
    {
      keywords: ['photosynthesis', 'plant', 'sunlight', 'chlorophyll'],
      type: 'photosynthesis',
      duration: 6,
      visualElements: ['sun', 'plant', 'leaves', 'carbon_dioxide', 'oxygen']
    },
    {
      keywords: ['solar system', 'planets', 'sun', 'orbit'],
      type: 'solar_system',
      duration: 10,
      visualElements: ['sun', 'planets', 'orbits', 'stars']
    },
    {
      keywords: ['cell', 'mitochondria', 'nucleus', 'organelles'],
      type: 'cell_structure',
      duration: 7,
      visualElements: ['cell_membrane', 'nucleus', 'mitochondria', 'ribosomes']
    },
    {
      keywords: ['volcano', 'eruption', 'lava', 'magma'],
      type: 'volcanic_eruption',
      duration: 6,
      visualElements: ['volcano', 'lava', 'smoke', 'rocks']
    }
  ];

  // Text segmentation and processing
  const processText = useCallback((text: string, difficulty: DifficultyLevel): ProcessedText => {
    // Split text into paragraphs
    const paragraphs = text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Split text into sentences
    const sentences = text
      .match(/[^.!?]+[.!?]+/g) || [text]
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Extract keywords based on difficulty level
    const difficultyWords = educationalKeywords[difficulty] || educationalKeywords.ELEMENTARY;
    const words = text.toLowerCase().split(/\s+/);
    const keywords = words
      .filter(word => word.length > 3)
      .filter(word => difficultyWords.includes(word) ||
        ['process', 'system', 'cycle', 'change', 'grow', 'develop', 'create', 'transform'].includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Limit to top 10 keywords

    // Extract concepts (noun phrases and important terms)
    const concepts = extractConcepts(text, difficulty);

    // Estimate number of scenes needed
    const avgSceneLength = difficulty === 'ELEMENTARY' ? 60 : difficulty === 'MIDDLE' ? 80 : 100;
    const estimatedScenes = Math.max(1, Math.ceil(text.length / avgSceneLength));

    return {
      paragraphs,
      sentences,
      keywords,
      concepts,
      difficulty,
      estimatedScenes
    };
  }, []);

  // Extract concepts using simple NLP patterns
  const extractConcepts = (text: string, difficulty: DifficultyLevel): string[] => {
    // Simple patterns for concept extraction
    const patterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
      /\b(?:process|cycle|system|method|technique)\s+of\s+\w+/gi, // Process concepts
      /\b\w+(?:\s+\w+){0,2}\s+(?:cell|organism|element|compound|reaction)\b/gi, // Scientific concepts
    ];

    const concepts = new Set<string>();

    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const clean = match.toLowerCase().trim();
        if (clean.length > 5 && clean.length < 50) {
          concepts.add(clean);
        }
      });
    });

    // Add keywords as concepts too
    educationalKeywords[difficulty].forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        concepts.add(keyword);
      }
    });

    return Array.from(concepts).slice(0, 8);
  };

  // Generate scenes from processed text
  const generateScenes = useCallback(async (
    processedText: ProcessedText,
    difficulty: DifficultyLevel,
    animationStyle: AnimationStyle
  ): Promise<Scene[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      const scenes: Scene[] = [];
      const { paragraphs, sentences, keywords, concepts, estimatedScenes } = processedText;

      // Determine scene segmentation strategy
      let sceneTexts: string[];

      if (paragraphs.length >= estimatedScenes) {
        // Use paragraphs as scene boundaries
        sceneTexts = paragraphs.slice(0, estimatedScenes);
      } else if (sentences.length >= estimatedScenes * 2) {
        // Group sentences into scenes
        const sentencesPerScene = Math.ceil(sentences.length / estimatedScenes);
        sceneTexts = [];
        for (let i = 0; i < sentences.length; i += sentencesPerScene) {
          sceneTexts.push(sentences.slice(i, i + sentencesPerScene).join(' '));
        }
      } else {
        // Split long sentences or use whole text
        if (sentences.length === 1 && sentences[0].length > 200) {
          // Split long sentence
          const chunks = sentences[0].match(/[^.,!?]+[.,!?]+/g) || [sentences[0]];
          sceneTexts = chunks.slice(0, estimatedScenes);
        } else {
          sceneTexts = sentences.slice(0, estimatedScenes);
        }
      }

      // Create scene objects
      for (let i = 0; i < sceneTexts.length; i++) {
        const sceneText = sceneTexts[i];
        const sceneKeywords = extractSceneKeywords(sceneText, keywords, concepts);
        const matchedTemplate = findMatchingTemplate(sceneText, sceneKeywords);

        const scene: Scene = {
          id: `scene_${Date.now()}_${i}`,
          story_id: '', // Will be set by the parent component
          scene_order: i,
          text_content: sceneText,
          visual_elements: {
            keywords: sceneKeywords,
            template: matchedTemplate?.type || 'custom',
            animationStyle,
            difficulty,
            visualElements: matchedTemplate?.visualElements || generateVisualElements(sceneKeywords, difficulty)
          },
          animation_data: {
            lottieUrl: '', // Will be populated by animation service
            duration: calculateSceneDuration(sceneText, difficulty),
            transitions: ['fade', 'slide', 'zoom'][i % 3],
            effects: generateSceneEffects(sceneKeywords, difficulty)
          },
          duration: calculateSceneDuration(sceneText, difficulty)
        };

        scenes.push(scene);
      }

      // Call AI generation service for custom animations
      await generateCustomAnimations(scenes, difficulty, animationStyle);

      return scenes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate scenes';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Extract keywords specific to a scene
  const extractSceneKeywords = (sceneText: string, globalKeywords: string[], concepts: string[]): string[] => {
    const sceneWords = sceneText.toLowerCase().split(/\s+/);
    const sceneKeywords = globalKeywords.filter(keyword =>
      sceneWords.some(word => word.includes(keyword) || keyword.includes(word))
    );

    // Add concepts that appear in this scene
    const sceneConcepts = concepts.filter(concept =>
      sceneText.toLowerCase().includes(concept)
    );

    return [...new Set([...sceneKeywords, ...sceneConcepts])].slice(0, 5);
  };

  // Find matching pre-made animation template
  const findMatchingTemplate = (sceneText: string, keywords: string[]) => {
    const lowerText = sceneText.toLowerCase();

    for (const template of premadeAnimations) {
      const matchCount = template.keywords.filter(keyword =>
        lowerText.includes(keyword) || keywords.includes(keyword)
      ).length;

      if (matchCount >= 2) {
        return template;
      }
    }

    return null;
  };

  // Generate visual elements for custom animations
  const generateVisualElements = (keywords: string[], difficulty: DifficultyLevel): string[] => {
    const elementLibrary = {
      ELEMENTARY: {
        science: ['beaker', 'magnifying glass', 'rainbow', 'bubble', 'star'],
        nature: ['tree', 'flower', 'sun', 'cloud', 'river'],
        animals: ['butterfly', 'bird', 'fish', 'rabbit', 'bear'],
        objects: ['book', 'pencil', 'house', 'car', 'ball']
      },
      MIDDLE: {
        science: ['microscope', 'telescope', 'atom', 'molecule', 'graph'],
        nature: ['ecosystem', 'food chain', 'habitat', 'climate', 'environment'],
        technology: ['computer', 'robot', 'circuit', 'gear', 'engine'],
        society: ['city', 'building', 'bridge', 'map', 'globe']
      },
      HIGH: {
        science: ['dna helix', 'cell structure', 'chemical equation', 'physics diagram', 'laboratory'],
        mathematics: ['graph', 'formula', 'geometry', 'calculus', 'algorithm'],
        technology: ['circuit board', 'code', 'network', 'database', 'interface'],
        abstract: ['concept', 'theory', 'model', 'simulation', 'data visualization']
      }
    };

    const elements = elementLibrary[difficulty];
    const selectedElements: string[] = [];

    // Select elements based on keywords
    keywords.forEach(keyword => {
      if (keyword.includes('water') || keyword.includes('rain')) selectedElements.push('rain', 'river');
      if (keyword.includes('plant') || keyword.includes('tree')) selectedElements.push('tree', 'leaf');
      if (keyword.includes('sun') || keyword.includes('light')) selectedElements.push('sun');
      if (keyword.includes('animal') || keyword.includes('bird')) selectedElements.push('bird');
      if (keyword.includes('science') || keyword.includes('experiment')) selectedElements.push('beaker', 'microscope');
    });

    // Fill with random elements if needed
    const allElements = Object.values(elements).flat();
    while (selectedElements.length < 3) {
      const randomElement = allElements[Math.floor(Math.random() * allElements.length)];
      if (!selectedElements.includes(randomElement)) {
        selectedElements.push(randomElement);
      }
    }

    return selectedElements.slice(0, 4);
  };

  // Calculate scene duration based on text length and difficulty
  const calculateSceneDuration = (text: string, difficulty: DifficultyLevel): number => {
    const baseDuration = difficulty === 'ELEMENTARY' ? 6 : difficulty === 'MIDDLE' ? 5 : 4;
    const wordCount = text.split(/\s+/).length;

    // Add 0.5 seconds per word, but cap at reasonable limits
    const wordDuration = Math.min(wordCount * 0.5, 8);

    return Math.max(baseDuration, Math.min(baseDuration + wordDuration, 15));
  };

  // Generate scene effects based on content
  const generateSceneEffects = (keywords: string[], difficulty: DifficultyLevel): string[] => {
    const effects = ['fade'];

    if (keywords.includes('water') || keywords.includes('rain')) effects.push('ripple');
    if (keywords.includes('sun') || keywords.includes('light')) effects.push('glow');
    if (keywords.includes('wind') || keywords.includes('air')) effects.push('sway');
    if (keywords.includes('fire') || keywords.includes('heat')) effects.push('flicker');
    if (keywords.includes('grow') || keywords.includes('plant')) effects.push('grow');
    if (difficulty !== 'ELEMENTARY') {
      if (keywords.includes('science') || keywords.includes('experiment')) effects.push('particles');
      if (keywords.includes('technology') || keywords.includes('computer')) effects.push('digital');
    }

    return effects.slice(0, 3);
  };

  // Generate custom animations using AI service
  const generateCustomAnimations = async (scenes: Scene[], difficulty: DifficultyLevel, animationStyle: AnimationStyle) => {
    // This would integrate with Runway ML or similar service
    // For now, we'll simulate the process

    for (const scene of scenes) {
      if (scene.visual_elements?.template === 'custom') {
        try {
          // TODO: Replace with actual AI generation call
          // const animationData = await api.generateAnimation({
          //   text: scene.text_content,
          //   keywords: scene.visual_elements.keywords,
          //   style: animationStyle,
          //   difficulty
          // });
          // scene.animation_data.lottieUrl = animationData.url;

          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Mock animation URL
          scene.animation_data.lottieUrl = `/animations/${scene.id}.json`;
        } catch (error) {
          console.warn('Failed to generate custom animation for scene:', scene.id);
          // Fallback to simple animation
          scene.animation_data.lottieUrl = `/animations/fallback.json`;
        }
      }
    }
  };

  return {
    processText,
    generateScenes,
    isProcessing,
    error
  };
};