import React from 'react';
import { motion } from 'framer-motion';
import type { DifficultyLevel, AnimationStyle } from '../App';

interface DifficultySelectorProps {
  difficulty: DifficultyLevel;
  animationStyle: AnimationStyle;
  setDifficulty: (level: DifficultyLevel) => void;
  setAnimationStyle: (style: AnimationStyle) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  animationStyle,
  setDifficulty,
  setAnimationStyle
}) => {
  const settingsVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const difficultyOptions = [
    {
      value: 'ELEMENTARY' as DifficultyLevel,
      title: 'Elementary School',
      age: 'Ages 6-11',
      description: 'Simple vocabulary, bright colors, larger text, and slower animations perfect for young learners.',
      features: [
        'Simple words and sentences',
        'Bright, engaging colors',
        'Larger, readable text',
        'Slower animation pace',
        'Interactive elements',
        'Fun sound effects'
      ],
      color: 'from-green-400 to-blue-400',
      icon: '🎈'
    },
    {
      value: 'MIDDLE' as DifficultyLevel,
      title: 'Middle School',
      age: 'Ages 12-14',
      description: 'Moderate complexity with more detailed concepts and interactive elements for growing minds.',
      features: [
        'Moderate vocabulary',
        'Balanced visual complexity',
        'Interactive learning elements',
        'Moderate animation speed',
        'Educational quizzes',
        'Real-world examples'
      ],
      color: 'from-purple-400 to-pink-400',
      icon: '🎯'
    },
    {
      value: 'HIGH' as DifficultyLevel,
      title: 'High School',
      age: 'Ages 15-18',
      description: 'Advanced concepts with professional animations and detailed explanations for sophisticated learners.',
      features: [
        'Advanced vocabulary',
        'Detailed concepts',
        'Professional animations',
        'Faster information pace',
        'Scientific accuracy',
        'Career connections'
      ],
      color: 'from-indigo-400 to-purple-600',
      icon: '🎓'
    }
  ];

  const animationStyles = [
    {
      value: 'CARTOON' as AnimationStyle,
      title: 'Cartoon Style',
      description: 'Fun, playful animations with bright colors and exaggerated movements that engage young learners.',
      preview: '🎨'
    },
    {
      value: 'REALISTIC' as AnimationStyle,
      title: 'Realistic Style',
      description: 'Life-like visuals and natural movements that help students connect with real-world concepts.',
      preview: '🌍'
    },
    {
      value: 'ABSTRACT' as AnimationStyle,
      title: 'Abstract Style',
      description: 'Creative and symbolic representations that encourage creative thinking and conceptual understanding.',
      preview: '🎭'
    }
  ];

  return (
    <motion.div
      variants={settingsVariants}
      initial="initial"
      animate="animate"
      className="difficulty-selector p-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Choose Your Learning Level
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select the difficulty level and animation style that best matches your learning needs
          </p>
        </div>

        {/* Difficulty Level Selection */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
            Difficulty Level
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {difficultyOptions.map((option) => (
              <motion.div
                key={option.value}
                onClick={() => setDifficulty(option.value)}
                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  difficulty === option.value
                    ? 'border-blue-500 shadow-xl transform scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
                }`}
                whileHover={{ scale: difficulty === option.value ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {difficulty === option.value && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className={`text-5xl mb-3 bg-gradient-to-br ${option.color} bg-clip-text text-transparent`}>
                    {option.icon}
                  </div>
                  <h3 className={`text-xl font-bold bg-gradient-to-r ${option.color} bg-clip-text text-transparent`}>
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {option.age}
                  </p>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                  {option.description}
                </p>

                <ul className="space-y-2">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Animation Style Selection */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
            Animation Style
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {animationStyles.map((style) => (
              <motion.div
                key={style.value}
                onClick={() => setAnimationStyle(style.value)}
                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  animationStyle === style.value
                    ? 'border-purple-500 shadow-xl transform scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
                }`}
                whileHover={{ scale: animationStyle === style.value ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {animationStyle === style.value && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{style.preview}</div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {style.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-center">
                  {style.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mt-12 text-center">
          <motion.button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Creating Stories
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default DifficultySelector;