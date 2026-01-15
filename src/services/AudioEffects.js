class AudioEffects {
  constructor(audioContext) {
    this.context = audioContext;
  }

  createEQ(inputNode, outputNode) {
    const lowShelf = this.context.createBiquadFilter();
    const midPeaking = this.context.createBiquadFilter();
    const highShelf = this.context.createBiquadFilter();

    // Low shelf filter (80Hz)
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.setValueAtTime(80, this.context.currentTime);
    lowShelf.gain.setValueAtTime(0, this.context.currentTime);

    // Mid peaking filter (1kHz)
    midPeaking.type = 'peaking';
    midPeaking.frequency.setValueAtTime(1000, this.context.currentTime);
    midPeaking.Q.setValueAtTime(1, this.context.currentTime);
    midPeaking.gain.setValueAtTime(0, this.context.currentTime);

    // High shelf filter (8kHz)
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(8000, this.context.currentTime);
    highShelf.gain.setValueAtTime(0, this.context.currentTime);

    // Chain the filters
    inputNode.connect(lowShelf);
    lowShelf.connect(midPeaking);
    midPeaking.connect(highShelf);
    highShelf.connect(outputNode);

    return {
      lowShelf,
      midPeaking,
      highShelf,
      setLowGain: (gain) => lowShelf.gain.setValueAtTime(gain, this.context.currentTime),
      setMidGain: (gain) => midPeaking.gain.setValueAtTime(gain, this.context.currentTime),
      setHighGain: (gain) => highShelf.gain.setValueAtTime(gain, this.context.currentTime)
    };
  }

  createReverb(inputNode, outputNode, roomSize = 0.5, wetness = 0.3) {
    const convolver = this.context.createConvolver();
    const wetGain = this.context.createGain();
    const dryGain = this.context.createGain();
    const outputGain = this.context.createGain();

    // Create impulse response
    const impulseBuffer = this.createReverbImpulse(roomSize);
    convolver.buffer = impulseBuffer;

    // Set up routing
    inputNode.connect(dryGain);
    inputNode.connect(convolver);
    convolver.connect(wetGain);
    
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);
    outputGain.connect(outputNode);

    // Set initial values
    wetGain.gain.setValueAtTime(wetness, this.context.currentTime);
    dryGain.gain.setValueAtTime(1 - wetness, this.context.currentTime);

    return {
      setWetness: (wet) => {
        wetGain.gain.setValueAtTime(wet, this.context.currentTime);
        dryGain.gain.setValueAtTime(1 - wet, this.context.currentTime);
      }
    };
  }

  createReverbImpulse(roomSize) {
    const length = this.context.sampleRate * roomSize * 4;
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    return impulse;
  }

  createChorus(inputNode, outputNode) {
    const delayNode = this.context.createDelay();
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    const wetGain = this.context.createGain();
    const dryGain = this.context.createGain();
    const outputGain = this.context.createGain();

    delayNode.delayTime.value = 0.02;
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 0.005;

    lfo.connect(lfoGain);
    lfoGain.connect(delayNode.delayTime);

    inputNode.connect(dryGain);
    inputNode.connect(delayNode);
    delayNode.connect(wetGain);
    
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);
    outputGain.connect(outputNode);

    dryGain.gain.setValueAtTime(1, this.context.currentTime);
    wetGain.gain.setValueAtTime(0, this.context.currentTime);

    lfo.start();

    return {
      lfo,
      delayNode,
      wetGain,
      dryGain,
      setDepth: (depth) => {
        lfoGain.gain.setValueAtTime(depth * 0.01, this.context.currentTime);
      },
      setRate: (rate) => {
        lfo.frequency.setValueAtTime(rate, this.context.currentTime);
      },
      setMix: (mix) => {
        wetGain.gain.setValueAtTime(mix, this.context.currentTime);
        dryGain.gain.setValueAtTime(1 - mix, this.context.currentTime);
      }
    };
  }

  createDelay(inputNode, outputNode) {
    const delayNode = this.context.createDelay(2.0);
    const feedbackGain = this.context.createGain();
    const wetGain = this.context.createGain();
    const dryGain = this.context.createGain();
    const outputGain = this.context.createGain();

    delayNode.delayTime.value = 0.5;
    feedbackGain.gain.value = 0.3;

    inputNode.connect(dryGain);
    inputNode.connect(delayNode);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(wetGain);
    
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);
    outputGain.connect(outputNode);

    dryGain.gain.setValueAtTime(1, this.context.currentTime);
    wetGain.gain.setValueAtTime(0, this.context.currentTime);

    return {
      delayNode,
      feedbackGain,
      wetGain,
      dryGain,
      setTime: (time) => {
        delayNode.delayTime.setValueAtTime(time, this.context.currentTime);
      },
      setFeedback: (feedback) => {
        feedbackGain.gain.setValueAtTime(feedback, this.context.currentTime);
      },
      setMix: (mix) => {
        wetGain.gain.setValueAtTime(mix, this.context.currentTime);
        dryGain.gain.setValueAtTime(1 - mix, this.context.currentTime);
      }
    };
  }

  createCompressor(inputNode, outputNode) {
    const compressor = this.context.createDynamicsCompressor();
    
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    inputNode.connect(compressor);
    compressor.connect(outputNode);

    return {
      compressor,
      setThreshold: (threshold) => {
        compressor.threshold.setValueAtTime(threshold, this.context.currentTime);
      },
      setRatio: (ratio) => {
        compressor.ratio.setValueAtTime(ratio, this.context.currentTime);
      },
      setAttack: (attack) => {
        compressor.attack.setValueAtTime(attack, this.context.currentTime);
      },
      setRelease: (release) => {
        compressor.release.setValueAtTime(release, this.context.currentTime);
      }
    };
  }
}

export default AudioEffects;