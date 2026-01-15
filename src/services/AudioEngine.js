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
    const panNode = this.context.createStereoPanner();
    const eqNode = this.context.createGain();
    const chorusNode = this.context.createGain();
    const delayNode = this.context.createGain();
    const reverbNode = this.context.createGain();
    const compressorNode = this.context.createGain();
    const vuGain = this.context.createGain();
    
    const eq = this.effects.createEQ(trackGain, eqNode);
    const chorus = this.effects.createChorus(eqNode, chorusNode);
    const delay = this.effects.createDelay(chorusNode, delayNode);
    const reverb = this.effects.createReverb(delayNode, reverbNode, 0.5, 0);
    const compressor = this.effects.createCompressor(reverbNode, compressorNode);
    compressorNode.connect(panNode);
    panNode.connect(vuGain);
    vuGain.connect(this.masterGain);
    
    const track = {
      id,
      gainNode: trackGain,
      panNode,
      eqNode,
      chorusNode,
      delayNode,
      reverbNode,
      compressorNode,
      vuGain,
      eq,
      chorus,
      delay,
      reverb,
      compressor,
      source: null,
      buffer: null,
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      effects: {
        eqEnabled: true,
        lowGain: 0,
        midGain: 0,
        highGain: 0,
        chorusEnabled: false,
        chorusDepth: 0.5,
        chorusRate: 0.5,
        chorusMix: 0.3,
        delayEnabled: false,
        delayTime: 0.5,
        delayFeedback: 0.3,
        delayMix: 0.3,
        reverbEnabled: false,
        reverbMix: 0.3,
        compressorEnabled: false,
        compressorThreshold: -24,
        compressorRatio: 4,
        compressorAttack: 0.003,
        compressorRelease: 0.25
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
      if (track.chorus?.lfo) {
        track.chorus.lfo.stop();
      }
      track.gainNode.disconnect();
      track.panNode.disconnect();
      track.eqNode.disconnect();
      track.chorusNode.disconnect();
      track.delayNode.disconnect();
      track.reverbNode.disconnect();
      track.compressorNode.disconnect();
      track.vuGain.disconnect();
      this.tracks.delete(id);
    }
  }

  setTrackVolume(id, volume) {
    const track = this.tracks.get(id);
    if (track) {
      track.volume = volume;
      this.updateTrackGain(track);
    }
  }

  updateTrackGain(track) {
    const hasSoloTracks = Array.from(this.tracks.values()).some(t => t.solo);
    let effectiveVolume = track.volume;
    
    if (hasSoloTracks) {
      effectiveVolume = track.solo ? track.volume : 0;
    } else if (track.muted) {
      effectiveVolume = 0;
    }
    
    track.gainNode.gain.setValueAtTime(effectiveVolume, this.context.currentTime);
  }

  setTrackEQ(id, band, gain) {
    const track = this.tracks.get(id);
    if (track && track.eq) {
      track.effects[`${band}Gain`] = gain;
      if (band === 'enabled') {
        track.effects.eqEnabled = gain;
        if (!gain) {
          track.eq.setLowGain(0);
          track.eq.setMidGain(0);
          track.eq.setHighGain(0);
        } else {
          track.eq.setLowGain(track.effects.lowGain);
          track.eq.setMidGain(track.effects.midGain);
          track.eq.setHighGain(track.effects.highGain);
        }
      } else {
        switch(band) {
          case 'low':
            if (track.effects.eqEnabled) track.eq.setLowGain(gain);
            break;
          case 'mid':
            if (track.effects.eqEnabled) track.eq.setMidGain(gain);
            break;
          case 'high':
            if (track.effects.eqEnabled) track.eq.setHighGain(gain);
            break;
          default:
            break;
        }
      }
    }
  }

  setTrackChorus(id, param, value) {
    const track = this.tracks.get(id);
    if (track && track.chorus) {
      track.effects[`chorus${param.charAt(0).toUpperCase() + param.slice(1)}`] = value;
      switch(param) {
        case 'enabled':
          track.chorus.setMix(value ? track.effects.chorusMix : 0);
          break;
        case 'depth':
          track.chorus.setDepth(value);
          break;
        case 'rate':
          track.chorus.setRate(value);
          break;
        case 'mix':
          track.chorus.setMix(track.effects.chorusEnabled ? value : 0);
          break;
        default:
          break;
      }
    }
  }

  setTrackDelay(id, param, value) {
    const track = this.tracks.get(id);
    if (track && track.delay) {
      track.effects[`delay${param.charAt(0).toUpperCase() + param.slice(1)}`] = value;
      switch(param) {
        case 'enabled':
          track.delay.setMix(value ? track.effects.delayMix : 0);
          break;
        case 'time':
          track.delay.setTime(value);
          break;
        case 'feedback':
          track.delay.setFeedback(value);
          break;
        case 'mix':
          track.delay.setMix(track.effects.delayEnabled ? value : 0);
          break;
        default:
          break;
      }
    }
  }

  setTrackReverb(id, param, value) {
    const track = this.tracks.get(id);
    if (track && track.reverb) {
      track.effects[`reverb${param.charAt(0).toUpperCase() + param.slice(1)}`] = value;
      if (param === 'enabled') {
        track.reverb.setWetness(value ? track.effects.reverbMix : 0);
      } else if (param === 'mix') {
        track.reverb.setWetness(track.effects.reverbEnabled ? value : 0);
      }
    }
  }

  setTrackCompressor(id, param, value) {
    const track = this.tracks.get(id);
    if (track && track.compressor) {
      track.effects[`compressor${param.charAt(0).toUpperCase() + param.slice(1)}`] = value;
      switch(param) {
        case 'enabled':
          // Compressor is always in chain, just store state
          break;
        case 'threshold':
          if (track.effects.compressorEnabled) track.compressor.setThreshold(value);
          break;
        case 'ratio':
          if (track.effects.compressorEnabled) track.compressor.setRatio(value);
          break;
        case 'attack':
          if (track.effects.compressorEnabled) track.compressor.setAttack(value);
          break;
        case 'release':
          if (track.effects.compressorEnabled) track.compressor.setRelease(value);
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
    this.tracks.forEach(track => {
      if (track.buffer) {
        this.updateTrackGain(track);
        this.playTrack(track);
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
      try {
        track.source.stop();
      } catch (e) {
        // Source may already be stopped
      }
      track.source = null;
    }
    
    track.source = this.context.createBufferSource();
    track.source.buffer = track.buffer;
    track.source.connect(track.gainNode);
    track.source.start(0, this.currentTime);
  }
}

const audioEngine = new AudioEngine();
export default audioEngine;