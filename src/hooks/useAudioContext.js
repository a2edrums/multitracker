import { useState, useEffect, useCallback } from 'react';
import AudioEngine from '../services/AudioEngine.js';

export const useAudioContext = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsUserActivation, setNeedsUserActivation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const initializeAudio = useCallback(async () => {
    console.log('Attempting to initialize audio...');
    try {
      const success = await AudioEngine.initialize();
      console.log('Audio initialization result:', success);
      if (success) {
        setIsInitialized(true);
        setNeedsUserActivation(false);
      } else {
        setNeedsUserActivation(true);
      }
    } catch (error) {
      console.error('Audio initialization failed:', error);
      setNeedsUserActivation(true);
    }
  }, []);

  // Initialize on first user interaction
  useEffect(() => {
    const handleFirstClick = () => {
      if (!isInitialized) {
        initializeAudio();
      }
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    return () => document.removeEventListener('click', handleFirstClick);
  }, [initializeAudio, isInitialized]);

  useEffect(() => {
    let animationFrame;
    if (isPlaying) {
      const updateTime = () => {
        setCurrentTime(AudioEngine.getCurrentTime());
        animationFrame = requestAnimationFrame(updateTime);
      };
      updateTime();
    }
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying]);

  const play = useCallback(async () => {
    if (!isInitialized) {
      await initializeAudio();
    }
    AudioEngine.play();
    setIsPlaying(true);
  }, [isInitialized, initializeAudio]);

  const pause = useCallback(() => {
    AudioEngine.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(async () => {
    if (!isInitialized) {
      await initializeAudio();
    }
    AudioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [isInitialized, initializeAudio]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  return {
    isInitialized,
    needsUserActivation,
    initializeAudio,
    isPlaying,
    currentTime,
    play,
    pause,
    stop,
    togglePlayPause,
    audioEngine: AudioEngine
  };
};