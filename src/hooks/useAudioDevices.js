import { useState, useEffect, useCallback } from 'react';
import { RECORDING_CONFIG } from '../utils/constants.js';

export const useAudioDevices = () => {
  const [devices, setDevices] = useState([]);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter(d => d.kind === 'audioinput')
        .map(({ deviceId, label, groupId }) => ({ deviceId, label, groupId }));
      setDevices(audioInputs);
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
    }
  }, []);

  useEffect(() => {
    refreshDevices();

    if (!navigator.mediaDevices?.addEventListener) return;

    let timeoutId;
    const handleDeviceChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(refreshDevices, RECORDING_CONFIG.DEVICE_POLL_INTERVAL);
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      clearTimeout(timeoutId);
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  return { devices, refreshDevices };
};
