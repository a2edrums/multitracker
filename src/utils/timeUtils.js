export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const beatsToTime = (beats, bpm) => (beats * 60) / bpm;

export const timeToBeats = (time, bpm) => (time * bpm) / 60;

export const quantizeTime = (time, bpm, subdivision = 16) => {
  const beatTime = 60 / bpm;
  const subdivisionTime = beatTime / (subdivision / 4);
  return Math.round(time / subdivisionTime) * subdivisionTime;
};