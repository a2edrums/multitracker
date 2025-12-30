import { useState, useCallback, useRef } from 'react';

export const useAudioRecording = (audioContext) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  }, [isRecording]);

  const convertBlobToAudioBuffer = useCallback(async (blob) => {
    if (!audioContext || !blob) return null;
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Failed to convert blob to audio buffer:', error);
      return null;
    }
  }, [audioContext]);

  return {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    convertBlobToAudioBuffer
  };
};