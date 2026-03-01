import { useState, useCallback, useRef } from 'react';

export const useAudioRecording = (audioContext) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [inputNode, setInputNode] = useState(null);
  const [recordingBuffer, setRecordingBuffer] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const streamRef = useRef(null);
  const monitorGainRef = useRef(null);

  // Multi-track recording refs
  const recordingStreamsRef = useRef(new Map());    // deviceId → MediaStream
  const perTrackProcessorsRef = useRef(new Map());  // trackId → { processor, chunks, source }
  const perTrackInputNodesRef = useRef(new Map());  // trackId → AudioNode (for VU meters)

  const startMonitoring = useCallback(async () => {
    if (!audioContext) {
      console.error('Audio context not available');
      return false;
    }

    try {
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

      monitorGainRef.current = gainNode;
      setInputNode(source);
      setIsMonitoring(true);

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

  /**
   * Get or create a MediaStream for a given device.
   * Reuses existing streams to avoid duplicate getUserMedia calls.
   * @param {string|null} deviceId - The device ID to request
   * @param {boolean} stereo - Whether to request a stereo stream
   * @returns {Promise<MediaStream>}
   */
  const getOrCreateStream = useCallback(async (deviceId, stereo) => {
    const key = deviceId || 'default';
    const existing = recordingStreamsRef.current.get(key);
    if (existing && existing.active) {
      return existing;
    }

    const constraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        ...(stereo ? { channelCount: 2 } : { channelCount: 1 }),
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    recordingStreamsRef.current.set(key, stream);
    return stream;
  }, []);

  /**
   * Create a ScriptProcessorNode that captures Float32Array chunks for a track.
   * @param {AudioNode} sourceNode - The audio node to capture from
   * @returns {{ processor: ScriptProcessorNode, chunks: Float32Array[] }}
   */
  const createTrackProcessor = useCallback((sourceNode) => {
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const chunks = [];

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(inputData));
    };

    sourceNode.connect(processor);
    processor.connect(audioContext.destination);

    return { processor, chunks };
  }, [audioContext]);

  /**
   * Determine if the armed tracks form a stereo pair (one Left + one Right on the same device).
   * @param {Array<{id, inputDeviceId, channelAssignment}>} armedTracks
   * @returns {{ isStereo: boolean, leftTrack?: object, rightTrack?: object }}
   */
  const detectStereoMode = useCallback((armedTracks) => {
    if (armedTracks.length !== 2) return { isStereo: false };

    const leftTrack = armedTracks.find(t => t.channelAssignment === 'left');
    const rightTrack = armedTracks.find(t => t.channelAssignment === 'right');

    if (leftTrack && rightTrack &&
        (leftTrack.inputDeviceId || 'default') === (rightTrack.inputDeviceId || 'default')) {
      return { isStereo: true, leftTrack, rightTrack };
    }

    return { isStereo: false };
  }, []);

  /**
   * Clean up all recording resources (streams, processors, nodes).
   */
  const cleanupRecordingResources = useCallback(() => {
    // Disconnect and clean up per-track processors
    perTrackProcessorsRef.current.forEach(({ processor }) => {
      try { processor.disconnect(); } catch (e) { /* already disconnected */ }
    });
    perTrackProcessorsRef.current = new Map();

    // Disconnect per-track input nodes
    perTrackInputNodesRef.current.forEach((node) => {
      try { node.disconnect(); } catch (e) { /* already disconnected */ }
    });
    perTrackInputNodesRef.current = new Map();

    // Stop and release all streams
    recordingStreamsRef.current.forEach((stream) => {
      stream.getTracks().forEach(track => track.stop());
    });
    recordingStreamsRef.current = new Map();
  }, []);

  /**
   * Start recording on armed tracks.
   * @param {Array<{id, inputDeviceId, channelAssignment}>} armedTracks
   * @returns {Promise<boolean>} true if recording started successfully
   */
  const startRecording = useCallback(async (armedTracks) => {
    if (!audioContext || !armedTracks || armedTracks.length === 0) {
      console.error('Cannot start recording: no audio context or no armed tracks');
      return false;
    }

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Clear previous state
      recordingStreamsRef.current = new Map();
      perTrackProcessorsRef.current = new Map();
      perTrackInputNodesRef.current = new Map();

      const stereoInfo = detectStereoMode(armedTracks);

      if (stereoInfo.isStereo) {
        // Stereo mode: request stereo stream, split channels
        const { leftTrack, rightTrack } = stereoInfo;
        const stream = await getOrCreateStream(leftTrack.inputDeviceId, true);
        const source = audioContext.createMediaStreamSource(stream);

        const splitter = audioContext.createChannelSplitter(2);
        source.connect(splitter);

        // Left channel (channel 0) → left track processor
        const leftGain = audioContext.createGain();
        leftGain.gain.value = 1.0;
        splitter.connect(leftGain, 0);
        perTrackInputNodesRef.current.set(leftTrack.id, leftGain);
        const leftProc = createTrackProcessor(leftGain);
        perTrackProcessorsRef.current.set(leftTrack.id, leftProc);

        // Right channel (channel 1) → right track processor
        const rightGain = audioContext.createGain();
        rightGain.gain.value = 1.0;
        splitter.connect(rightGain, 1);
        perTrackInputNodesRef.current.set(rightTrack.id, rightGain);
        const rightProc = createTrackProcessor(rightGain);
        perTrackProcessorsRef.current.set(rightTrack.id, rightProc);
      } else {
        // Mono mode: each track gets its own mono stream and processor
        for (const track of armedTracks) {
          const stream = await getOrCreateStream(track.inputDeviceId, false);
          const source = audioContext.createMediaStreamSource(stream);

          const gainNode = audioContext.createGain();
          gainNode.gain.value = 1.0;
          source.connect(gainNode);

          perTrackInputNodesRef.current.set(track.id, gainNode);
          const proc = createTrackProcessor(gainNode);
          perTrackProcessorsRef.current.set(track.id, proc);
        }
      }

      setIsRecording(true);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      // Clean up any partial state
      cleanupRecordingResources();
      return false;
    }
  }, [audioContext, detectStereoMode, getOrCreateStream, createTrackProcessor, cleanupRecordingResources]);

  /**
   * Stop recording and return finalized mono AudioBuffers for each track.
   * @returns {Promise<Map<string, AudioBuffer>>} Map of trackId → mono AudioBuffer
   */
  const stopRecording = useCallback(async () => {
    if (!isRecording) return new Map();

    const results = new Map();
    const sampleRate = audioContext ? audioContext.sampleRate : 44100;

    // Finalize each track's captured chunks into a mono AudioBuffer
    perTrackProcessorsRef.current.forEach(({ chunks }, trackId) => {
      const totalSamples = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

      if (totalSamples > 0 && audioContext) {
        const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
        const channelData = buffer.getChannelData(0);
        let offset = 0;
        for (const chunk of chunks) {
          channelData.set(chunk, offset);
          offset += chunk.length;
        }
        results.set(trackId, buffer);
      }
    });

    // Clean up all recording resources
    cleanupRecordingResources();

    setIsRecording(false);
    setRecordingBuffer(null);

    return results;
  }, [isRecording, audioContext, cleanupRecordingResources]);

  /**
   * Get the AudioNode feeding a specific track's capture chain.
   * Used for VU meter and waveform display during recording.
   * @param {string} trackId
   * @returns {AudioNode|null}
   */
  const getRecordingNodeForTrack = useCallback((trackId) => {
    return perTrackInputNodesRef.current.get(trackId) || null;
  }, []);

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
    setRecordedBlob,
    getRecordingNodeForTrack,
  };
};
