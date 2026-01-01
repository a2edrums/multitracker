import { useState, useCallback, useRef } from 'react';

export const useAudioRecording = (audioContext) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [inputNode, setInputNode] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

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
      
      // Create audio input node for VU meters
      if (audioContext) {
        const source = audioContext.createMediaStreamSource(stream);
        setInputNode(source);
      }
      
      // Clear previous chunks
      chunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Created blob, size:', blob.size);
        setRecordedBlob(blob);
        setInputNode(null);
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('MediaRecorder started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }, [audioContext]);

  const stopRecording = useCallback(() => {
    console.log('stopRecording called, isRecording:', isRecording);
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping MediaRecorder');
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  }, [isRecording]);

  const convertBlobToAudioBuffer = useCallback(async (blob) => {
    if (!blob) return null;
    
    // Create audio context if it doesn't exist
    let context = audioContext;
    if (!context) {
      try {
        context = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error('Failed to create audio context for blob conversion:', error);
        return null;
      }
    }
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      return await context.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Failed to convert blob to audio buffer:', error);
      return null;
    }
  }, [audioContext]);

  return {
    isRecording,
    recordedBlob,
    inputNode,
    startRecording,
    stopRecording,
    convertBlobToAudioBuffer,
    setRecordedBlob
  };
};