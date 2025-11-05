import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story, Scene, DifficultyLevel, AnimationStyle } from '../App';
import Timeline from './Timeline';
import { useStoryGeneration } from '../hooks/useStoryGeneration';
import { api } from '../services/api';

interface StoryEditorProps {
  difficulty: DifficultyLevel;
  animationStyle: AnimationStyle;
  currentStory: Story | null;
  setCurrentStory: (story: Story | null) => void;
}

const StoryEditor: React.FC<StoryEditorProps> = ({
  difficulty,
  animationStyle,
  currentStory,
  setCurrentStory
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showPreview, setShowPreview] = useState(false);

  const { processText, generateScenes } = useStoryGeneration();

  // Update text statistics
  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(text.length);

    if (currentStory) {
      setSaveStatus('unsaved');
    }
  }, [text, currentStory]);

  // Auto-save functionality
  useEffect(() => {
    if (saveStatus === 'unsaved' && title && text) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [saveStatus, title, text]);

  const handleAutoSave = async () => {
    if (!title || !text) return;

    setSaveStatus('saving');
    try {
      if (currentStory) {
        const updated = await api.updateStory(currentStory.id, {
          title,
          original_text: text,
          difficulty_level: difficulty,
          animation_style: animationStyle
        });
        setCurrentStory(updated);
      } else {
        const newStory = await api.createStory({
          title,
          original_text: text,
          difficulty_level: difficulty,
          animation_style: animationStyle
        });
        setCurrentStory(newStory);
      }
      setSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('unsaved');
    }
  };

  const handleGenerateStory = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    try {
      // Process text and extract key concepts
      const processedText = processText(text, difficulty);

      // Generate scenes from processed text
      const generatedScenes = await generateScenes(processedText, difficulty, animationStyle);
      setScenes(generatedScenes);
      setShowPreview(true);

      // Auto-save after generation
      if (title) {
        await handleAutoSave();
      }
    } catch (error) {
      console.error('Story generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateNew = () => {
    setTitle('');
    setText('');
    setScenes([]);
    setCurrentStory(null);
    setShowPreview(false);
    setSaveStatus('saved');
  };

  const editorVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'ELEMENTARY': return 'from-green-400 to-blue-400';
      case 'MIDDLE': return 'from-purple-400 to-pink-400';
      case 'HIGH': return 'from-indigo-400 to-purple-600';
      default: return 'from-blue-400 to-purple-400';
    }
  };

  return (
    <motion.div
      variants={editorVariants}
      initial="initial"
      animate="animate"
      className="story-editor h-full"
    >
      <div className="editor-header bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent from-blue-600 to-purple-600">
            Story Creator
          </h1>

          <div className="flex items-center space-x-4">
            <div className="save-status flex items-center space-x-2">
              {saveStatus === 'saved' && (
                <span className="text-green-500 text-sm">✓ Saved</span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-yellow-500 text-sm">Saving...</span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-orange-500 text-sm">● Unsaved</span>
              )}
            </div>

            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              New Story
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Enter your story title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-semibold p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="editor-body grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Input Section */}
        <div className="text-input-section">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Your Story Text
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {wordCount} words • {charCount} characters
              </div>
            </div>

            <textarea
              placeholder="Start writing your educational story here. For example: 'The water cycle begins when the sun heats up water in oceans, lakes, and rivers. The water evaporates and rises into the atmosphere as water vapor...'"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-96 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getDifficultyColor()}`}>
                  {difficulty} Level
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {animationStyle} Style
                </span>
              </div>

              <button
                onClick={handleGenerateStory}
                disabled={!text.trim() || isGenerating}
                className={`px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  text.trim() && !isGenerating
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Visual Story'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="preview-section">
          <AnimatePresence mode="wait">
            {showPreview && scenes.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Story Preview
                </h2>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {scenes.map((scene, index) => (
                    <motion.div
                      key={scene.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Scene {scene.scene_order + 1}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {scene.duration}s
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {scene.text_content}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => window.location.href = `/viewer/${currentStory?.id}`}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
                  >
                    View Full Animation
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    No Preview Yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto">
                    Write your story text and click "Generate Visual Story" to see the animated preview
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline Section */}
      {scenes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="timeline-section mt-6"
        >
          <Timeline
            scenes={scenes}
            setScenes={setScenes}
            difficulty={difficulty}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default StoryEditor;