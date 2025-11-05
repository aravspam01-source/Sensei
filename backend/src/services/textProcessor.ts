import { DifficultyLevel, AnimationStyle } from '@prisma/client';

export interface ProcessedText {
  paragraphs: string[];
  sentences: string[];
  keywords: string[];
  concepts: string[];
  difficulty: DifficultyLevel;
  estimatedScenes: number;
  educationalTopic?: string;
  readingLevel: {
    score: number;
    level: 'elementary' | 'middle' | 'high' | 'college';
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
  };
}

export interface SceneData {
  text_content: string;
  visual_elements: {
    keywords: string[];
    template?: string;
    animationStyle: AnimationStyle;
    difficulty: DifficultyLevel;
    visualElements: string[];
    colorScheme?: string[];
  };
  animation_data: {
    lottieUrl?: string;
    duration: number;
    transitions: string;
    effects: string[];
  };
  duration: number;
}

export class TextProcessor {
  // Educational keyword libraries by difficulty level
  private educationalKeywords = {
    ELEMENTARY: [
      'sun', 'moon', 'star', 'water', 'plant', 'animal', 'tree', 'flower', 'rain', 'cloud',
      'earth', 'sky', 'ocean', 'mountain', 'river', 'forest', 'garden', 'school', 'home',
      'family', 'friend', 'happy', 'sad', 'big', 'small', 'fast', 'slow', 'hot', 'cold',
      'grow', 'eat', 'sleep', 'play', 'learn', 'read', 'write', 'count', 'add', 'subtract',
      'circle', 'square', 'triangle', 'red', 'blue', 'green', 'yellow', 'black', 'white'
    ],
    MIDDLE: [
      'photosynthesis', 'evaporation', 'condensation', 'precipitation', 'ecosystem', 'habitat',
      'organism', 'cell', 'molecule', 'energy', 'force', 'gravity', 'motion', 'chemical',
      'reaction', 'experiment', 'hypothesis', 'data', 'analysis', 'ancient', 'civilization',
      'government', 'economy', 'culture', 'geography', 'history', 'literature', 'mathematics',
      'algebra', 'geometry', 'fraction', 'decimal', 'percentage', 'equation', 'variable',
      'democracy', 'constitution', 'revolution', 'industry', 'agriculture', 'environment'
    ],
    HIGH: [
      'mitochondria', 'chloroplast', 'dna', 'evolution', 'quantum', 'relativity', 'calculus',
      'derivative', 'integral', 'philosophy', 'democracy', 'constitution', 'industrialization',
      'globalization', 'sustainability', 'renewable', 'technology', 'engineering', 'algorithm',
      'artificial intelligence', 'neural network', 'quantum computing', 'nanotechnology',
      'biochemistry', 'thermodynamics', 'electromagnetism', 'kinematics', 'thermodynamics',
      'stoichiometry', 'bioengineering', 'genetics', 'epidemiology', 'macroeconomics'
    ]
  };

  // Pre-made animation templates for common educational concepts
  private premadeTemplates = [
    {
      keywords: ['water cycle', 'evaporation', 'condensation', 'precipitation'],
      template: 'water_cycle',
      duration: 8,
      visualElements: ['sun', 'ocean', 'clouds', 'rain'],
      category: 'science'
    },
    {
      keywords: ['photosynthesis', 'plant', 'sunlight', 'chlorophyll'],
      template: 'photosynthesis',
      duration: 6,
      visualElements: ['sun', 'plant', 'leaves', 'carbon_dioxide', 'oxygen'],
      category: 'science'
    },
    {
      keywords: ['solar system', 'planets', 'sun', 'orbit'],
      template: 'solar_system',
      duration: 10,
      visualElements: ['sun', 'planets', 'orbits', 'stars'],
      category: 'science'
    },
    {
      keywords: ['cell', 'mitochondria', 'nucleus', 'organelles'],
      template: 'cell_structure',
      duration: 7,
      visualElements: ['cell_membrane', 'nucleus', 'mitochondria', 'ribosomes'],
      category: 'science'
    },
    {
      keywords: ['volcano', 'eruption', 'lava', 'magma'],
      template: 'volcanic_eruption',
      duration: 6,
      visualElements: ['volcano', 'lava', 'smoke', 'rocks'],
      category: 'science'
    },
    {
      keywords: ['fraction', 'division', 'numerator', 'denominator'],
      template: 'fraction_visualization',
      duration: 5,
      visualElements: ['pie_chart', 'numerator', 'denominator', 'division'],
      category: 'mathematics'
    },
    {
      keywords: ['ancient egypt', 'pyramid', 'pharaoh', 'nile'],
      template: 'ancient_egypt',
      duration: 8,
      visualElements: ['pyramid', 'pharaoh', 'nile_river', 'hieroglyphics'],
      category: 'history'
    },
    {
      keywords: ['grammar', 'sentence', 'noun', 'verb'],
      template: 'grammar_lesson',
      duration: 6,
      visualElements: ['sentence_structure', 'noun', 'verb', 'adjective'],
      category: 'language'
    }
  ];

  // Process raw text and extract meaningful components
  async processText(text: string, difficulty: DifficultyLevel): Promise<ProcessedText> {
    // Clean and normalize text
    const cleanText = this.cleanText(text);

    // Split into paragraphs
    const paragraphs = this.extractParagraphs(cleanText);

    // Split into sentences
    const sentences = this.extractSentences(cleanText);

    // Extract keywords based on difficulty level
    const keywords = this.extractKeywords(cleanText, difficulty);

    // Extract educational concepts
    const concepts = this.extractConcepts(cleanText, difficulty);

    // Estimate reading level
    const readingLevel = this.calculateReadingLevel(cleanText);

    // Identify educational topic
    const educationalTopic = this.identifyEducationalTopic(concepts, keywords);

    // Estimate number of scenes needed
    const estimatedScenes = this.estimateSceneCount(cleanText, difficulty);

    return {
      paragraphs,
      sentences,
      keywords,
      concepts,
      difficulty,
      estimatedScenes,
      educationalTopic,
      readingLevel
    };
  }

  // Generate scenes from processed text
  async generateScenes(
    processedText: ProcessedText,
    difficulty: DifficultyLevel,
    animationStyle: AnimationStyle
  ): Promise<SceneData[]> {
    const { paragraphs, sentences, keywords, concepts } = processedText;
    const scenes: SceneData[] = [];

    // Determine scene segmentation strategy
    let sceneTexts: string[] = this.segmentTextIntoScenes(
      processedText,
      difficulty
    );

    // Generate scene data for each segment
    for (let i = 0; i < sceneTexts.length; i++) {
      const sceneText = sceneTexts[i];
      const sceneKeywords = this.extractSceneKeywords(sceneText, keywords, concepts);
      const matchedTemplate = this.findMatchingTemplate(sceneText, sceneKeywords);

      const sceneData: SceneData = {
        text_content: sceneText,
        visual_elements: {
          keywords: sceneKeywords,
          template: matchedTemplate?.template,
          animationStyle,
          difficulty,
          visualElements: matchedTemplate?.visualElements ||
            this.generateVisualElements(sceneKeywords, difficulty),
          colorScheme: this.generateColorScheme(animationStyle, difficulty)
        },
        animation_data: {
          duration: this.calculateSceneDuration(sceneText, difficulty),
          transitions: this.selectTransition(i, sceneTexts.length),
          effects: this.generateSceneEffects(sceneKeywords, difficulty)
        },
        duration: this.calculateSceneDuration(sceneText, difficulty)
      };

      scenes.push(sceneData);
    }

    return scenes;
  }

  // Clean and normalize input text
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .replace(/[^\w\s.,!?;:'"-]/g, '') // Remove special characters except punctuation
      .trim();
  }

  // Extract paragraphs from text
  private extractParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  // Extract sentences from text
  private extractSentences(text: string): string[] {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentenceRegex) || [text];

    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => s.length > 10); // Filter out very short fragments
  }

  // Extract keywords based on difficulty level
  private extractKeywords(text: string, difficulty: DifficultyLevel): string[] {
    const difficultyWords = this.educationalKeywords[difficulty] || this.educationalKeywords.ELEMENTARY;
    const words = text.toLowerCase().split(/\s+/);

    // Find educational keywords
    const keywords = words
      .filter(word => word.length > 3)
      .filter(word =>
        difficultyWords.includes(word) ||
        this.isEducationalTerm(word) ||
        this.isProcessWord(word)
      )
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 15); // Limit to top 15 keywords

    return keywords;
  }

  // Extract educational concepts
  private extractConcepts(text: string, difficulty: DifficultyLevel): string[] {
    const concepts = new Set<string>();

    // Extract proper nouns and multi-word terms
    const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    properNouns.forEach(noun => {
      const clean = noun.toLowerCase().trim();
      if (clean.length > 5 && clean.length < 50) {
        concepts.add(clean);
      }
    });

    // Extract process concepts
    const processPatterns = [
      /\b(?:process|cycle|system|method|technique)\s+of\s+\w+/gi,
      /\b\w+(?:\s+\w+){0,2}\s+(?:formation|creation|development|process)\b/gi,
      /\b(?:how|what|when|where|why)\s+\w+(?:\s+\w+){0,3}\b/gi
    ];

    processPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const clean = match.toLowerCase().trim();
        if (clean.length > 8 && clean.length < 60) {
          concepts.add(clean);
        }
      });
    });

    // Add difficulty-specific concepts
    const difficultyConcepts = this.educationalKeywords[difficulty] || [];
    difficultyConcepts.forEach(concept => {
      if (text.toLowerCase().includes(concept)) {
        concepts.add(concept);
      }
    });

    return Array.from(concepts).slice(0, 10);
  }

  // Calculate reading level using simplified metrics
  private calculateReadingLevel(text: string) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((total, word) => {
      return total + this.countSyllables(word);
    }, 0) / words.length;

    // Simplified Flesch Reading Ease score
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    let level: 'elementary' | 'middle' | 'high' | 'college';
    if (score >= 90) level = 'elementary';
    else if (score >= 70) level = 'middle';
    else if (score >= 50) level = 'high';
    else level = 'college';

    return {
      score: Math.round(score),
      level,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10
    };
  }

  // Count syllables in a word (simplified)
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e') && count > 1) {
      count--;
    }

    return Math.max(1, count);
  }

  // Identify the main educational topic
  private identifyEducationalTopic(concepts: string[], keywords: string[]): string | undefined {
    const topicPatterns = {
      'Science': ['cell', 'plant', 'animal', 'water', 'energy', 'force', 'chemical', 'molecule', 'organism'],
      'Mathematics': ['number', 'calculate', 'equation', 'fraction', 'geometry', 'algebra', 'graph', 'pattern'],
      'History': ['ancient', 'war', 'king', 'queen', 'empire', 'civilization', 'revolution', 'government'],
      'Geography': ['country', 'continent', 'ocean', 'mountain', 'river', 'climate', 'population', 'culture'],
      'Literature': ['story', 'character', 'plot', 'theme', 'author', 'book', 'poem', 'novel'],
      'Technology': ['computer', 'internet', 'software', 'hardware', 'digital', 'electronic', 'robot']
    };

    const topicScores: { [key: string]: number } = {};

    Object.entries(topicPatterns).forEach(([topic, terms]) => {
      const score = terms.reduce((total, term) => {
        return total +
          concepts.filter(c => c.includes(term)).length +
          keywords.filter(k => k.includes(term)).length;
      }, 0);
      topicScores[topic] = score;
    });

    const bestTopic = Object.entries(topicScores)
      .sort(([, a], [, b]) => b - a)[0];

    return bestTopic && bestTopic[1] > 0 ? bestTopic[0] : undefined;
  }

  // Estimate number of scenes needed
  private estimateSceneCount(text: string, difficulty: DifficultyLevel): number {
    const avgSceneLength = {
      ELEMENTARY: 60,   // characters per scene
      MIDDLE: 80,
      HIGH: 100
    };

    const targetLength = avgSceneLength[difficulty] || 80;
    return Math.max(1, Math.ceil(text.length / targetLength));
  }

  // Segment text into scenes
  private segmentTextIntoScenes(processedText: ProcessedText, difficulty: DifficultyLevel): string[] {
    const { paragraphs, sentences, estimatedScenes } = processedText;

    // Strategy 1: Use paragraphs as scene boundaries
    if (paragraphs.length >= estimatedScenes) {
      return paragraphs.slice(0, estimatedScenes);
    }

    // Strategy 2: Group sentences into scenes
    if (sentences.length >= estimatedScenes * 2) {
      const sentencesPerScene = Math.ceil(sentences.length / estimatedScenes);
      const scenes: string[] = [];

      for (let i = 0; i < sentences.length; i += sentencesPerScene) {
        scenes.push(sentences.slice(i, i + sentencesPerScene).join(' '));
      }

      return scenes.slice(0, estimatedScenes);
    }

    // Strategy 3: Split long content or use as-is
    if (sentences.length === 1 && sentences[0].length > 200) {
      // Split very long sentences
      const chunks = sentences[0].match(/[^.,!?]+[.,!?]+/g) || [sentences[0]];
      return chunks.slice(0, estimatedScenes);
    }

    return sentences.slice(0, estimatedScenes);
  }

  // Extract keywords specific to a scene
  private extractSceneKeywords(sceneText: string, globalKeywords: string[], concepts: string[]): string[] {
    const sceneWords = sceneText.toLowerCase().split(/\s+/);
    const sceneKeywords = globalKeywords.filter(keyword =>
      sceneWords.some(word => word.includes(keyword) || keyword.includes(word))
    );

    // Add concepts that appear in this scene
    const sceneConcepts = concepts.filter(concept =>
      sceneText.toLowerCase().includes(concept)
    );

    return [...new Set([...sceneKeywords, ...sceneConcepts])].slice(0, 5);
  }

  // Find matching pre-made template
  private findMatchingTemplate(sceneText: string, keywords: string[]) {
    const lowerText = sceneText.toLowerCase();

    for (const template of this.premadeTemplates) {
      const matchCount = template.keywords.filter(keyword =>
        lowerText.includes(keyword) || keywords.includes(keyword)
      ).length;

      if (matchCount >= 2) {
        return template;
      }
    }

    return null;
  }

  // Generate visual elements for custom animations
  private generateVisualElements(keywords: string[], difficulty: DifficultyLevel): string[] {
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
        science: ['dna helix', 'cell structure', 'chemical equation', 'physics diagram'],
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
  }

  // Generate color scheme based on style and difficulty
  private generateColorScheme(style: AnimationStyle, difficulty: DifficultyLevel): string[] {
    const schemes = {
      CARTOON: {
        ELEMENTARY: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
        MIDDLE: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#5CDB95', '#F4A261'],
        HIGH: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51']
      },
      REALISTIC: {
        ELEMENTARY: ['#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#FFB6C1'],
        MIDDLE: ['#4682B4', '#556B2F', '#8B4513', '#2F4F4F', '#DC143C'],
        HIGH: ['#1E3A8A', '#064E3B', '#7C2D12', '#1F2937', '#991B1B']
      },
      ABSTRACT: {
        ELEMENTARY: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
        MIDDLE: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
        HIGH: ['#240046', '#3C096C', '#5A189A', '#7209B7', '#9D4EDD']
      }
    };

    return schemes[style]?.[difficulty] || schemes.CARTOON.ELEMENTARY;
  }

  // Calculate scene duration
  private calculateSceneDuration(text: string, difficulty: DifficultyLevel): number {
    const baseDuration = {
      ELEMENTARY: 6,
      MIDDLE: 5,
      HIGH: 4
    };

    const wordCount = text.split(/\s+/).length;
    const wordDuration = Math.min(wordCount * 0.4, 8);

    return Math.max(
      baseDuration[difficulty] || 5,
      Math.min(baseDuration[difficulty] + wordDuration, 15)
    );
  }

  // Select transition type
  private selectTransition(sceneIndex: number, totalScenes: number): string {
    const transitions = ['fade', 'slide', 'zoom', 'dissolve', 'wipe'];
    return transitions[sceneIndex % transitions.length];
  }

  // Generate scene effects
  private generateSceneEffects(keywords: string[], difficulty: DifficultyLevel): string[] {
    const effects = ['fade'];

    if (keywords.some(k => k.includes('water') || k.includes('rain'))) effects.push('ripple');
    if (keywords.some(k => k.includes('sun') || k.includes('light'))) effects.push('glow');
    if (keywords.some(k => k.includes('wind') || k.includes('air'))) effects.push('sway');
    if (keywords.some(k => k.includes('fire') || k.includes('heat'))) effects.push('flicker');
    if (keywords.some(k => k.includes('grow') || k.includes('plant'))) effects.push('grow');

    if (difficulty !== 'ELEMENTARY') {
      if (keywords.some(k => k.includes('science') || k.includes('experiment'))) effects.push('particles');
      if (keywords.some(k => k.includes('technology') || k.includes('computer'))) effects.push('digital');
    }

    return effects.slice(0, 3);
  }

  // Check if word is an educational term
  private isEducationalTerm(word: string): boolean {
    const educationalTerms = [
      'process', 'system', 'cycle', 'function', 'structure', 'pattern',
      'relationship', 'cause', 'effect', 'theory', 'principle', 'concept',
      'method', 'technique', 'formula', 'equation', 'algorithm', 'model'
    ];

    return educationalTerms.includes(word.toLowerCase());
  }

  // Check if word is related to processes
  private isProcessWord(word: string): boolean {
    const processWords = [
      'change', 'transform', 'convert', 'develop', 'grow', 'evolve',
      'adapt', 'respond', 'react', 'produce', 'create', 'generate',
      'absorb', 'release', 'store', 'transfer', 'transmit', 'receive'
    ];

    return processWords.includes(word.toLowerCase());
  }
}

// Export singleton instance
export const textProcessor = new TextProcessor();