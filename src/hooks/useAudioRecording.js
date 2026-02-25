import { useState, useCallback, useRef } from 'react';

export const useAudioRecording = (audioContext) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [inputNode, setInputNode] = useState(null);
  const [recordingBuffer, setRecordingBuffer] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const scriptProcessorRef = useRef(null);
  const recordedSamplesRef = useRef([]);
  const monitorGainRef = useRef(null);

  const startMonitoring = useCallback(async () => {
    if (!audioContext) {
      console.error('Audio context not available');
      return false;
    }

    try {
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Test: create a brief test tone to verify audio output works
      const testOsc = audioContext.createOscillator();
      const testGain = audioContext.createGain();
      testOsc.frequency.value = 440;
      testGain.gain.value = 0.1;
      testOsc.connect(testGain);
      testGain.connect(audioContext.destination);
      testOsc.start();
      testOsc.stop(audioContext.currentTime + 0.1);
      
      monitorGainRef.current = gainNode;
      setInputNode(source);
      setIsMonitoring(true);
      
      console.log('Monitoring started');
      console.log('Audio context state:', audioContext.state);
      console.log('Audio context destination:', audioContext.destination);
      console.log('Gain value:', gainNode.gain.value);
      console.log('Source numberOfOutputs:', source.numberOfOutputs);
      console.log('Gain numberOfOutputs:', gainNode.numberOfOutputs);
      console.log('Stream active:', stream.active);
      console.log('Stream tracks:', stream.getTracks().map(t => ({ enabled: t.enabled, muted: t.muted, readyState: t.readyState })));
      return true;
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      return false;
    }
  }, [audioContext]);

  const stopMonitoring = useCallback(() => {
    if (monitorGainRef.current) {
      monitorGainRef.current.disconnect();
      monitorGainRef.current = null;
    }
    if (inputNode) {
      inputNode.disconnect();
    }
    if (streamRef.current && !isRecording) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setInputNode(null);
    setIsMonitoring(false);
  }, [inputNode, isRecording]);

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
      if (streamRef.current && !isMonitoring) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  }, [isRecording, isMonitoring]);

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
    isMonitoring,
    startRecording,
    stopRecording,
    startMonitoring,
    stopMonitoring,
    convertBlobToAudioBuffer,
    setRecordedBlob
  };
};