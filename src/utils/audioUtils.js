export const createAudioBuffer = (audioContext, length, sampleRate = 44100) => {
  return audioContext.createBuffer(2, length, sampleRate);
};

export const decodeAudioFile = async (audioContext, arrayBuffer) => {
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    throw new Error(`Failed to decode audio: ${error.message}`);
  }
};

export const timeToSamples = (time, sampleRate) => Math.floor(time * sampleRate);

export const samplesToTime = (samples, sampleRate) => samples / sampleRate;

export const bpmToInterval = (bpm) => 60 / bpm;

export const dbToGain = (db) => Math.pow(10, db / 20);

export const gainToDb = (gain) => 20 * Math.log10(Math.max(gain, 0.00001));