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
}

export default AudioEffects;