import { useState, useEffect, useRef, useCallback } from 'react';
import { LottiePlayer } from '@lottiefiles/react-lottie-player';
import { Scene } from '../App';

interface AnimationState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
  hasError: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
}

interface UseAnimationOptions {
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  onComplete?: () => void;
  onFrame?: (frame: number) => void;
}

interface UseAnimationReturn {
  playerRef: React.RefObject<LottiePlayer>;
  state: AnimationState;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  loadAnimation: (url: string, options?: UseAnimationOptions) => Promise<void>;
  playScene: (scene: Scene, options?: UseAnimationOptions) => Promise<void>;
  pauseScene: () => void;
  stopScene: () => void;
  preloadAnimations: (scenes: Scene[]) => Promise<void>;
}

export const useAnimation = (defaultOptions?: UseAnimationOptions): UseAnimationReturn => {
  const playerRef = useRef<LottiePlayer>(null);
  const [state, setState] = useState<AnimationState>({
    isPlaying: false,
    isPaused: false,
    isLoaded: false,
    hasError: false,
    currentTime: 0,
    duration: 0,
    playbackSpeed: defaultOptions?.speed || 1
  });

  const [currentOptions, setCurrentOptions] = useState<UseAnimationOptions>(defaultOptions || {});

  // Update state when player events occur
  const updateState = useCallback((updates: Partial<AnimationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Play animation
  const play = useCallback(() => {
    if (playerRef.current && state.isLoaded) {
      try {
        playerRef.current.play();
        updateState({
          isPlaying: true,
          isPaused: false
        });
      } catch (error) {
        console.error('Error playing animation:', error);
        updateState({ hasError: true });
      }
    }
  }, [state.isLoaded, updateState]);

  // Pause animation
  const pause = useCallback(() => {
    if (playerRef.current && state.isPlaying) {
      try {
        playerRef.current.pause();
        updateState({
          isPlaying: false,
          isPaused: true
        });
      } catch (error) {
        console.error('Error pausing animation:', error);
        updateState({ hasError: true });
      }
    }
  }, [state.isPlaying, updateState]);

  // Stop animation
  const stop = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.stop();
        updateState({
          isPlaying: false,
          isPaused: false,
          currentTime: 0
        });
      } catch (error) {
        console.error('Error stopping animation:', error);
        updateState({ hasError: true });
      }
    }
  }, [updateState]);

  // Seek to specific time
  const seek = useCallback((time: number) => {
    if (playerRef.current && state.isLoaded) {
      try {
        const frame = Math.floor((time / state.duration) * playerRef.current.getLottie().totalFrames);
        playerRef.current.seek(frame);
        updateState({ currentTime: time });
      } catch (error) {
        console.error('Error seeking animation:', error);
        updateState({ hasError: true });
      }
    }
  }, [state.duration, state.isLoaded, updateState]);

  // Set playback speed
  const setSpeed = useCallback((speed: number) => {
    if (playerRef.current) {
      try {
        playerRef.current.setSpeed(speed);
        updateState({ playbackSpeed: speed });
      } catch (error) {
        console.error('Error setting animation speed:', error);
        updateState({ hasError: true });
      }
    }
  }, [updateState]);

  // Load animation from URL
  const loadAnimation = useCallback(async (url: string, options?: UseAnimationOptions) => {
    if (!playerRef.current) {
      console.warn('Player reference not available');
      return;
    }

    updateState({
      isLoaded: false,
      hasError: false,
      isPlaying: false,
      isPaused: false
    });

    setCurrentOptions(options || {});

    try {
      // Reset player
      playerRef.current.stop();

      // Load new animation
      await new Promise<void>((resolve, reject) => {
        if (playerRef.current) {
          playerRef.current.load(url);

          // Set up event listeners
          playerRef.current.addEventListener('load', () => {
            updateState({
              isLoaded: true,
              hasError: false
            });

            // Get animation duration
            const lottieInstance = playerRef.current?.getLottie();
            if (lottieInstance) {
              const totalFrames = lottieInstance.totalFrames;
              const frameRate = lottieInstance.frameRate;
              const duration = totalFrames / frameRate;
              updateState({ duration });
            }

            // Auto-play if requested
            if (options?.autoPlay) {
              setTimeout(() => play(), 100);
            }

            resolve();
          });

          playerRef.current.addEventListener('error', (error) => {
            console.error('Animation load error:', error);
            updateState({ hasError: true });
            reject(error);
          });

          // Set up completion callback
          if (options?.onComplete) {
            playerRef.current.addEventListener('complete', options.onComplete);
          }

          // Set up frame callback
          if (options?.onFrame) {
            playerRef.current.addEventListener('frame', (event: any) => {
              options.onFrame?.(event.frame);
            });
          }
        } else {
          reject(new Error('Player reference not available'));
        }
      });
    } catch (error) {
      console.error('Failed to load animation:', error);
      updateState({ hasError: true });
      throw error;
    }
  }, [play, updateState]);

  // Play a specific scene
  const playScene = useCallback(async (scene: Scene, options?: UseAnimationOptions) => {
    const animationUrl = scene.animation_data?.lottieUrl;

    if (!animationUrl) {
      console.warn('No animation URL found for scene:', scene.id);
      return;
    }

    try {
      await loadAnimation(animationUrl, {
        autoPlay: true,
        loop: false,
        speed: 1,
        ...options
      });

      updateState({ currentTime: 0 });
    } catch (error) {
      console.error('Failed to play scene:', scene.id, error);
      updateState({ hasError: true });
    }
  }, [loadAnimation, updateState]);

  // Pause current scene
  const pauseScene = useCallback(() => {
    pause();
  }, [pause]);

  // Stop current scene
  const stopScene = useCallback(() => {
    stop();
  }, [stop]);

  // Preload multiple animations
  const preloadAnimations = useCallback(async (scenes: Scene[]) => {
    const preloadPromises = scenes
      .filter(scene => scene.animation_data?.lottieUrl)
      .map(async (scene) => {
        try {
          // Create a temporary player to preload the animation
          const tempPlayer = document.createElement('div');
          tempPlayer.style.display = 'none';
          document.body.appendChild(tempPlayer);

          // Preload by fetching the animation data
          const response = await fetch(scene.animation_data!.lottieUrl);
          if (!response.ok) {
            throw new Error(`Failed to preload animation: ${response.statusText}`);
          }

          // Clean up
          document.body.removeChild(tempPlayer);

          return { sceneId: scene.id, success: true };
        } catch (error) {
          console.warn(`Failed to preload animation for scene ${scene.id}:`, error);
          return { sceneId: scene.id, success: false, error };
        }
      });

    const results = await Promise.allSettled(preloadPromises);

    const successCount = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length;

    console.log(`Preloaded ${successCount}/${scenes.length} animations`);
  }, []);

  // Handle component cleanup
  useEffect(() => {
    return () => {
      // Stop animation when component unmounts
      if (playerRef.current && state.isPlaying) {
        try {
          playerRef.current.stop();
        } catch (error) {
          console.warn('Error stopping animation on cleanup:', error);
        }
      }
    };
  }, [state.isPlaying]);

  // Monitor playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isPlaying && state.duration > 0) {
      interval = setInterval(() => {
        if (playerRef.current) {
          try {
            const lottieInstance = playerRef.current.getLottie();
            if (lottieInstance) {
              const currentFrame = lottieInstance.currentFrame;
              const totalFrames = lottieInstance.totalFrames;
              const currentTime = (currentFrame / totalFrames) * state.duration;

              updateState({ currentTime });

              // Check if animation has completed
              if (currentFrame >= totalFrames - 1 && !currentOptions.loop) {
                updateState({
                  isPlaying: false,
                  isPaused: false
                });

                currentOptions.onComplete?.();
              }
            }
          } catch (error) {
            console.error('Error monitoring animation progress:', error);
          }
        }
      }, 100); // Update every 100ms
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isPlaying, state.duration, currentOptions, updateState]);

  return {
    playerRef,
    state,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    loadAnimation,
    playScene,
    pauseScene,
    stopScene,
    preloadAnimations
  };
};