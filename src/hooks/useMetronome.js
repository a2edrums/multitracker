import { useState, useCallback, useRef, useEffect } from 'react';

export const useMetronome = (audioContext) => {
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [bpm, setBpm] = useState(120);
  const intervalRef = useRef(null);
  const nextClickTime = useRef(0);

  const createClickSound = useCallback(() => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [audioContext]);

  const scheduleClick = useCallback(() => {
    const beatInterval = 60 / bpm;
    const currentTime = audioContext.currentTime;
    
    if (nextClickTime.current <= currentTime) {
      createClickSound();
      nextClickTime.current = currentTime + beatInterval;
    }
  }, [audioContext, bpm, createClickSound]);

  useEffect(() => {
    if (isMetronomeOn && audioContext) {
      nextClickTime.current = audioContext.currentTime;
      intervalRef.current = setInterval(scheduleClick, 25); // Check every 25ms
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMetronomeOn, audioContext, scheduleClick]);

  const toggleMetronome = useCallback(() => {
    setIsMetronomeOn(prev => !prev);
  }, []);

  return {
    isMetronomeOn,
    bpm,
    setBpm,
    toggleMetronome
  };
};