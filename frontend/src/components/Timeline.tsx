import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Scene, DifficultyLevel } from '../App';

interface TimelineProps {
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  difficulty: DifficultyLevel;
}

const Timeline: React.FC<TimelineProps> = ({ scenes, setScenes, difficulty }) => {
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handleReorder = (newScenes: Scene[]) => {
    const reorderedScenes = newScenes.map((scene, index) => ({
      ...scene,
      scene_order: index
    }));
    setScenes(reorderedScenes);
  };

  const handleSceneDurationChange = (sceneId: string, newDuration: number) => {
    setScenes(scenes.map(scene =>
      scene.id === sceneId ? { ...scene, duration: newDuration } : scene
    ));
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes(scenes.filter(scene => scene.id !== sceneId));
    if (selectedScene === sceneId) {
      setSelectedScene(null);
    }
  };

  const getTotalDuration = () => {
    return scenes.reduce((total, scene) => total + scene.duration, 0);
  };

  const getScenePosition = (sceneIndex: number) => {
    const previousDurations = scenes.slice(0, sceneIndex).reduce((total, scene) => total + scene.duration, 0);
    return (previousDurations / getTotalDuration()) * 100;
  };

  const getSceneWidth = (scene: Scene) => {
    return (scene.duration / getTotalDuration()) * 100;
  };

  const timelineVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'ELEMENTARY': return 'bg-green-500';
      case 'MIDDLE': return 'bg-purple-500';
      case 'HIGH': return 'bg-indigo-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <motion.div
      variants={timelineVariants}
      initial="initial"
      animate="animate"
      className="timeline bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <div className="timeline-header flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Story Timeline
        </h2>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Duration: {getTotalDuration()}s
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="timeline-bar mb-8">
        <div className="relative h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Progress indicator */}
          {isPlaying && (
            <motion.div
              className="absolute top-0 left-0 h-full bg-blue-500/20"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: getTotalDuration(), ease: "linear" }}
            />
          )}

          {/* Scene markers */}
          <div className="absolute top-0 left-0 w-full h-full flex">
            {scenes.map((scene, index) => (
              <motion.div
                key={scene.id}
                className={`h-full ${getDifficultyColor()} bg-opacity-60 border-r border-white/50 cursor-pointer relative group`}
                style={{
                  width: `${getSceneWidth(scene)}%`,
                  left: index === 0 ? 0 : `${getScenePosition(index)}%`
                }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedScene(scene.id)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Scene {index + 1}
                  </span>
                </div>

                {/* Scene number indicator */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className={`w-6 h-6 ${getDifficultyColor()} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                    {index + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Current time indicator */}
          {isPlaying && (
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500"
              initial={{ left: "0%" }}
              animate={{ left: "100%" }}
              transition={{ duration: getTotalDuration(), ease: "linear" }}
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
            </motion.div>
          )}
        </div>

        {/* Time markers */}
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>0:00</span>
          <span>{Math.floor(getTotalDuration() / 60)}:{(getTotalDuration() % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Scene List */}
      <div className="scenes-list">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
          Scene Details
        </h3>

        {scenes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No scenes yet. Generate your story to create scenes.</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={scenes}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {scenes.map((scene, index) => (
              <Reorder.Item
                key={scene.id}
                value={scene}
                className={`scene-item p-4 rounded-lg border-2 cursor-move transition-all ${
                  selectedScene === scene.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                whileDrag={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 ${getDifficultyColor()} rounded-lg flex items-center justify-center text-white text-sm font-medium`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white">
                        Scene {index + 1}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {scene.text_content}
                    </p>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                          Duration:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={scene.duration}
                          onChange={(e) => handleSceneDurationChange(scene.id, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">s</span>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {scene.visual_elements ? (
                          <span className="text-green-500">● Visuals Ready</span>
                        ) : (
                          <span className="text-yellow-500">○ Processing</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedScene(scene.id === selectedScene ? null : scene.id)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </motion.div>
  );
};

export default Timeline;