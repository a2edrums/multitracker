import { useState, useCallback, useRef } from 'react';

export const useAudioRecording = (audioContext) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [inputNode, setInputNode] = useState(null);
  const [recordingBuffer, setRecordingBuffer] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const scriptProcessorRef = useRef(null);
  const recordedSamplesRef = useRef([]);

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
      recordedSamplesRef.current = [];
      
      // Create audio input node for VU meters and live waveform
      if (audioContext) {
        const source = audioContext.createMediaStreamSource(stream);
        setInputNode(source);
        
        // Create script processor for live audio capture
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;
        
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          recordedSamplesRef.current.push(new Float32Array(inputData));
          
          // Create a temporary buffer for visualization
          const totalSamples = recordedSamplesRef.current.reduce((sum, arr) => sum + arr.length, 0);
          const tempBuffer = audioContext.createBuffer(1, totalSamples, audioContext.sampleRate);
          const channelData = tempBuffer.getChannelData(0);
          let offset = 0;
          recordedSamplesRef.current.forEach(chunk => {
            channelData.set(chunk, offset);
            offset += chunk.length;
          });
          setRecordingBuffer(tempBuffer);
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
      }
      
      // Clear previous chunks
      chunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(blob);
        setInputNode(null);
        setRecordingBuffer(null);
        
        // Clean up script processor
        if (scriptProcessorRef.current) {
          scriptProcessorRef.current.disconnect();
          scriptProcessorRef.current = null;
        }
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }, [audioContext]);

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
    if (!blob || !audioContext) return null;
    
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
    inputNode,
    recordingBuffer,
    startRecording,
    stopRecording,
    convertBlobToAudioBuffer,
    setRecordedBlob
  };
};