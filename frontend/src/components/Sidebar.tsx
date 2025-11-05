import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DifficultyLevel, AnimationStyle } from '../App';

interface SidebarProps {
  isOpen: boolean;
  difficulty: DifficultyLevel;
  animationStyle: AnimationStyle;
  setDifficulty: (level: DifficultyLevel) => void;
  setAnimationStyle: (style: AnimationStyle) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  difficulty,
  animationStyle,
  setDifficulty,
  setAnimationStyle
}) => {
  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    closed: {
      x: -300,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const difficultyLevels: { value: DifficultyLevel; label: string; description: string; color: string }[] = [
    {
      value: 'ELEMENTARY',
      label: 'Elementary',
      description: 'Simple words, bright colors, slow pace',
      color: 'from-green-400 to-blue-400'
    },
    {
      value: 'MIDDLE',
      label: 'Middle School',
      description: 'Moderate complexity, interactive',
      color: 'from-purple-400 to-pink-400'
    },
    {
      value: 'HIGH',
      label: 'High School',
      description: 'Detailed concepts, professional',
      color: 'from-indigo-400 to-purple-600'
    }
  ];

  const animationStyles: { value: AnimationStyle; label: string; description: string }[] = [
    {
      value: 'CARTOON',
      label: 'Cartoon',
      description: 'Fun and playful animations'
    },
    {
      value: 'REALISTIC',
      label: 'Realistic',
      description: 'Life-like visuals and movements'
    },
    {
      value: 'ABSTRACT',
      label: 'Abstract',
      description: 'Creative and symbolic designs'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          variants={sidebarVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="sidebar fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-40 pt-20 overflow-y-auto"
        >
          <div className="p-6 space-y-8">
            {/* Difficulty Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Difficulty Level
              </h3>
              <div className="space-y-3">
                {difficultyLevels.map((level) => (
                  <motion.button
                    key={level.value}
                    onClick={() => setDifficulty(level.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      difficulty === level.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 dark:text-white">
                        {level.label}
                      </span>
                      {difficulty === level.value && (
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${level.color}`} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                      {level.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Animation Style Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Animation Style
              </h3>
              <div className="space-y-3">
                {animationStyles.map((style) => (
                  <motion.button
                    key={style.value}
                    onClick={() => setAnimationStyle(style.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      animationStyle === style.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 dark:text-white">
                        {style.label}
                      </span>
                      {animationStyle === style.value && (
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                      {style.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Quick Stats
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Stories Created</span>
                  <span className="font-medium text-gray-800 dark:text-white">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Animations Generated</span>
                  <span className="font-medium text-gray-800 dark:text-white">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Views</span>
                  <span className="font-medium text-gray-800 dark:text-white">0</span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Need Help?
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    📖 User Guide
                  </span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    💡 Story Ideas
                  </span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    🎨 Animation Templates
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;