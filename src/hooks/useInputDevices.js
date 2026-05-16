import { useState, useEffect, useCallback } from 'react';

export const useInputDevices = () => {
  const [devices, setDevices] = useState([]);

  const refreshDevices = useCallback(async () => {
    try {
      // Request permission first so labels are populated
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter(d => d.kind === 'audioinput'));
    } catch {
      setDevices([]);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  return { devices, refreshDevices };
};
