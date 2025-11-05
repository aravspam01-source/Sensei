import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LottiePlayer } from '@lottiefiles/react-lottie-player';
import { DifficultyLevel, AnimationStyle, Scene } from '../App';
import { useAnimation } from '../hooks/useAnimation';

interface StoryViewerProps {
  difficulty: DifficultyLevel;
  animationStyle: AnimationStyle;
  storyId?: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  difficulty,
  animationStyle,
  storyId
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.7);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const playerRef = useRef<LottiePlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playScene, pauseScene, stopScene } = useAnimation();

  // Load story data
  useEffect(() => {
    if (storyId) {
      loadStory(storyId);
    }
  }, [storyId]);

  // Handle scene transitions
  useEffect(() => {
    if (isPlaying && currentSceneIndex < scenes.length) {
      const currentScene = scenes[currentSceneIndex];
      const timer = setTimeout(() => {
        if (currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex(currentSceneIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, (currentScene.duration * 1000) / playbackSpeed);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentSceneIndex, scenes, playbackSpeed]);

  const loadStory = async (id: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await api.getStory(id);
      // setScenes(response.scenes);

      // Mock data for now
      const mockScenes: Scene[] = [
        {
          id: '1',
          story_id: id,
          scene_order: 0,
          text_content: 'The water cycle begins when the sun heats up water in oceans, lakes, and rivers.',
          duration: 5
        },
        {
          id: '2',
          story_id: id,
          scene_order: 1,
          text_content: 'The water evaporates and rises into the atmosphere as water vapor.',
          duration: 4
        },
        {
          id: '3',
          story_id: id,
          scene_order: 2,
          text_content: 'As the water vapor cools, it condenses to form clouds.',
          duration: 4
        }
      ];
      setScenes(mockScenes);
    } catch (error) {
      console.error('Failed to load story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (playerRef.current) {
      playerRef.current.play();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSceneIndex(0);
    setCurrentTime(0);
    if (playerRef.current) {
      playerRef.current.stop();
    }
  };

  const handlePrevious = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    }
  };

  const handleSceneClick = (index: number) => {
    setCurrentSceneIndex(index);
    setIsPlaying(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const viewerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  };

  const sceneVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      transition: { duration: 0.4, ease: "easeIn" }
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

  if (isLoading) {
    return (
      <motion.div
        variants={viewerVariants}
        initial="initial"
        animate="animate"
        className="story-viewer h-full flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your story...</p>
        </div>
      </motion.div>
    );
  }

  const currentScene = scenes[currentSceneIndex];

  return (
    <motion.div
      ref={containerRef}
      variants={viewerVariants}
      initial="initial"
      animate="animate"
      className={`story-viewer h-full bg-black ${isFullscreen ? 'fixed inset-0 z-50' : 'relative rounded-lg overflow-hidden'}`}
    >
      {/* Main Animation Area */}
      <div className="relative h-full flex flex-col">
        {/* Animation Display */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-gray-800">
          <AnimatePresence mode="wait">
            {currentScene && (
              <motion.div
                key={currentScene.id}
                variants={sceneVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Placeholder for Lottie animation */}
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 animate-pulse"></div>
                    <h3 className="text-2xl font-bold mb-2">Scene {currentSceneIndex + 1}</h3>
                    <p className="text-lg opacity-80 max-w-2xl mx-auto px-6">
                      {currentScene.text_content}
                    </p>
                  </div>
                </div>

                {/* TODO: Add actual Lottie player when animations are available */}
                {/* <LottiePlayer
                  ref={playerRef}
                  autoplay={false}
                  loop={false}
                  src={currentScene.animation_data?.lottieUrl}
                  style={{ width: '100%', height: '100%' }}
                /> */}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtitles */}
          {showSubtitles && currentScene && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-20 left-0 right-0 text-center"
            >
              <div className="inline-block bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg max-w-4xl">
                <p className="text-white text-lg font-medium">
                  {currentScene.text_content}
                </p>
              </div>
            </motion.div>
          )}

          {/* Scene Overlay Info */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
            <span className={`px-2 py-1 rounded text-xs font-medium text-white bg-gradient-to-r ${getDifficultyColor()}`}>
              {difficulty}
            </span>
            <span className="ml-2 text-white text-sm">
              Scene {currentSceneIndex + 1} of {scenes.length}
            </span>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          {/* Timeline */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneClick(index)}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index === currentSceneIndex
                      ? 'bg-blue-500'
                      : index < currentSceneIndex
                      ? 'bg-gray-600'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{Math.floor(currentTime)}s</span>
              <span>{scenes.reduce((total, scene) => total + scene.duration, 0)}s</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Playback Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentSceneIndex === 0}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.445 14.832A1 1 0 0010 14v-4l5.445 3.632A1 1 0 0017 13V7a1 1 0 00-1.555-.832L10 9.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                  </svg>
                </button>

                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleStop}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentSceneIndex === scenes.length - 1}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L8 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 008 6v2.798L4.555 5.168z" />
                  </svg>
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Speed Control */}
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">Speed:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Subtitles Toggle */}
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={`p-2 rounded-full transition-colors ${
                  showSubtitles
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L10 8.94l3.47-3.47a.75.75 0 111.06 1.06L11.06 10l3.47 3.47a.75.75 0 11-1.06 1.06L10 11.06l-3.47 3.47a.75.75 0 01-1.06-1.06L8.94 10 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryViewer;