import { AUDIO_CONFIG } from '../utils/constants.js';
import AudioEffects from './AudioEffects.js';

class AudioEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.tracks = new Map();
    this.effects = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.startTime = 0;
  }

  async initialize() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
        latencyHint: 'interactive'
      });
      
      this.masterGain = this.context.createGain();
      this.masterVUGain = this.context.createGain(); // For master VU meter
      this.masterGain.connect(this.masterVUGain);
      this.masterVUGain.connect(this.context.destination);
      
      this.effects = new AudioEffects(this.context);
      
      // Resume context if suspended (required for user activation)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      // Verify context is running
      if (this.context.state !== 'running') {
        throw new Error('Audio context failed to start');
      }
      
      console.log('Audio context initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }

  createTrack(id) {
    if (!this.context) {
      console.error('Audio context not initialized');
      return null;
    }
    
    const trackGain = this.context.createGain();
    const eqNode = this.context.createGain();
    const vuGain = this.context.createGain(); // For VU meter
    
    // Create EQ for this track
    const eq = this.effects.createEQ(trackGain, eqNode);
    eqNode.connect(vuGain);
    vuGain.connect(this.masterGain);
    
    const track = {
      id,
      gainNode: trackGain,
      eqNode,
      vuGain, // VU meter tap
      eq,
      source: null,
      buffer: null,
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      effects: {
        lowGain: 0,
        midGain: 0,
        highGain: 0
      }
    };
    
    this.tracks.set(id, track);
    return track;
  }

  removeTrack(id) {
    const track = this.tracks.get(id);
    if (track) {
      if (track.source) {
        track.source.disconnect();
      }
      track.gainNode.disconnect();
      track.eqNode.disconnect();
      track.vuGain.disconnect();
      this.tracks.delete(id);
    }
  }

  setTrackVolume(id, volume) {
    const track = this.tracks.get(id);
    if (track) {
      track.volume = volume;
      track.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    }
  }

  setTrackEQ(id, band, gain) {
    const track = this.tracks.get(id);
    if (track && track.eq) {
      track.effects[`${band}Gain`] = gain;
      switch(band) {
        case 'low':
          track.eq.setLowGain(gain);
          break;
        case 'mid':
          track.eq.setMidGain(gain);
          break;
        case 'high':
          track.eq.setHighGain(gain);
          break;
        default:
          break;
      }
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.context.currentTime);
    }
  }

  getCurrentTime() {
    if (!this.context) return 0;
    if (this.isPlaying) {
      return this.currentTime + (this.context.currentTime - this.startTime);
    }
    return this.currentTime;
  }

  play() {
    if (!this.context || !this.isPlaying) {
      if (!this.context) {
        console.error('Cannot play: audio context not initialized');
        return;
      }
      this.isPlaying = true;
      this.startTime = this.context.currentTime;
      this.playAllTracks();
    }
  }

  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.currentTime = this.getCurrentTime();
      this.stopAllTracks();
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.stopAllTracks();
  }

  playAllTracks() {
    console.log('playAllTracks called, tracks:', this.tracks.size);
    const hasSoloTracks = Array.from(this.tracks.values()).some(track => track.solo);
    console.log('hasSoloTracks:', hasSoloTracks);
    this.tracks.forEach(track => {
      console.log('Track:', track.id, 'buffer:', !!track.buffer, 'muted:', track.muted, 'solo:', track.solo);
      if (track.buffer) {
        const shouldPlay = hasSoloTracks ? track.solo : !track.muted;
        console.log('shouldPlay:', shouldPlay);
        if (shouldPlay) {
          console.log('Playing track:', track.id);
          this.playTrack(track);
        }
      }
    });
  }

  stopAllTracks() {
    this.tracks.forEach(track => {
      if (track.source) {
        track.source.stop();
        track.source = null;
      }
    });
  }

  playTrack(track) {
    if (track.source) {
      track.source.stop();
    }
    
    track.source = this.context.createBufferSource();
    track.source.buffer = track.buffer;
    track.source.connect(track.gainNode);
    track.source.start(0, this.currentTime);
  }
}

const audioEngine = new AudioEngine();
export default audioEngine;