class FileService {
  constructor() {
    this.supportedFormats = ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm'];
  }

  async importAudioFile(file, audioContext) {
    if (!this.isValidAudioFile(file)) {
      throw new Error('Unsupported file format');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      throw new Error(`Failed to import audio file: ${error.message}`);
    }
  }

  isValidAudioFile(file) {
    return this.supportedFormats.some(format => 
      file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|ogg|webm)$/i)
    );
  }

  mixTracks(tracks, audioContext, duration) {
    const sampleRate = audioContext.sampleRate;
    const length = Math.ceil(duration * sampleRate);
    const mixedBuffer = audioContext.createBuffer(2, length, sampleRate);
    const leftChannel = mixedBuffer.getChannelData(0);
    const rightChannel = mixedBuffer.getChannelData(1);

    tracks.forEach(track => {
      if (track.buffer && !track.muted) {
        const hasSolo = tracks.some(t => t.solo);
        if (hasSolo && !track.solo) return;

        const volume = track.volume || 1;
        const sourceLeft = track.buffer.getChannelData(0);
        const sourceRight = track.buffer.numberOfChannels > 1 ? track.buffer.getChannelData(1) : sourceLeft;

        for (let i = 0; i < Math.min(track.buffer.length, length); i++) {
          leftChannel[i] += sourceLeft[i] * volume;
          rightChannel[i] += sourceRight[i] * volume;
        }
      }
    });

    return mixedBuffer;
  }

  async exportAudioBuffer(audioBuffer, filename = 'export.wav') {
    try {
      const wavBlob = this.audioBufferToWav(audioBuffer);
      this.downloadBlob(wavBlob, filename);
    } catch (error) {
      throw new Error(`Failed to export audio: ${error.message}`);
    }
  }

  audioBufferToWav(audioBuffer) {
    const length = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  createFileInput(onFileSelect) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.multiple = false;
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        onFileSelect(file);
      }
    };
    return input;
  }
}

const fileService = new FileService();
export default fileService;