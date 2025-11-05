import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import 'react-router-dom';

// Components
import StoryEditor from './components/StoryEditor';
import StoryViewer from './components/StoryViewer';
import DifficultySelector from './components/DifficultySelector';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Types
export type DifficultyLevel = 'ELEMENTARY' | 'MIDDLE' | 'HIGH';
export type AnimationStyle = 'CARTOON' | 'REALISTIC' | 'ABSTRACT';

export interface Story {
  id: string;
  title: string;
  original_text: string;
  difficulty_level: DifficultyLevel;
  animation_style: AnimationStyle;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  story_id: string;
  scene_order: number;
  text_content: string;
  visual_elements?: any;
  animation_data?: any;
  duration: number;
}

function App() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('ELEMENTARY');
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('CARTOON');
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const appVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    exit: { opacity: 0 }
  };

  return (
    <Router>
      <div className={`app ${isDarkMode ? 'dark' : 'light'} difficulty-${difficulty.toLowerCase()}`}>
        <Header
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="app-body">
          <Sidebar
            isOpen={sidebarOpen}
            difficulty={difficulty}
            animationStyle={animationStyle}
            setDifficulty={setDifficulty}
            setAnimationStyle={setAnimationStyle}
          />

          <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                variants={appVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="route-container"
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/editor" replace />} />
                  <Route
                    path="/editor"
                    element={
                      <StoryEditor
                        difficulty={difficulty}
                        animationStyle={animationStyle}
                        currentStory={currentStory}
                        setCurrentStory={setCurrentStory}
                      />
                    }
                  />
                  <Route
                    path="/viewer/:storyId"
                    element={
                      <StoryViewer
                        difficulty={difficulty}
                        animationStyle={animationStyle}
                      />
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <DifficultySelector
                        difficulty={difficulty}
                        animationStyle={animationStyle}
                        setDifficulty={setDifficulty}
                        setAnimationStyle={setAnimationStyle}
                      />
                    }
                  />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
