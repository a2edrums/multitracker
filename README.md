# MultiTracker Studio

A professional-grade, web-based audio multi-tracking studio built with React and Web Audio API. Record, edit, mix, and export audio entirely in your browser with no backend required.

## 🎵 Features

### Core Audio Engine
- **Multi-track recording** from microphone with real-time monitoring
- **Professional transport controls** (Play, Pause, Stop, Record)
- **High-quality audio processing** using Web Audio API
- **Low-latency recording** optimized for real-time performance
- **Automatic audio context initialization** on user interaction

### Track Management
- **Unlimited audio tracks** with individual controls
- **Track arming system** - arm tracks for recording, then hit record
- **Individual volume controls** with real-time adjustment
- **Mute/Solo functionality** for each track
- **Track naming** with automatic saving
- **Visual waveform display** showing actual audio data
- **Real-time playhead** during playback

### Professional Timeline
- **Interactive timeline** with click-to-seek functionality
- **Zoom controls** (0.25x to 8x magnification)
- **Time ruler** with major/minor tick marks
- **Visual playhead cursor** synchronized with audio
- **Dynamic duration** based on longest track

### Built-in Effects
- **3-band parametric EQ** per track
  - Low shelf filter (80Hz)
  - Mid peaking filter (1kHz) 
  - High shelf filter (8kHz)
- **Real-time parameter adjustment** with ±12dB range
- **Visual EQ controls** with collapsible panels

### Metronome & Timing
- **Built-in metronome** with adjustable BPM (60-200)
- **Click track generation** using precise audio scheduling
- **Visual metronome controls** in transport bar
- **Independent operation** from playback

### File Management
- **Audio file import** (WAV, MP3, OGG, WebM formats)
- **Drag-and-drop ready** file selection
- **WAV export** of individual tracks
- **Automatic project saving** to IndexedDB
- **Persistent storage** of all track data and audio

### Professional UI
- **Dark theme** optimized for studio environments
- **Bootstrap-based** responsive design
- **Professional layout** with organized control sections
- **Visual feedback** for all operations
- **Keyboard shortcuts** ready architecture

## 🚀 Getting Started

### Prerequisites
- Modern web browser with Web Audio API support
- Microphone access for recording
- Speakers/headphones for playback

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd multitracker

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Usage

1. **Add Tracks**: Click "Add Track" to create new audio tracks
2. **Import Audio**: Use "Import" to load existing audio files
3. **Record Audio**: 
   - Click the microphone button on a track to arm it
   - Click the record button in transport controls to start recording
4. **Mix**: Adjust volume, use mute/solo, and apply EQ effects
5. **Timeline**: Use zoom controls and click timeline to navigate
6. **Export**: Save your work using the "Export" button

## 🛠️ Technical Architecture

### Core Technologies
- **React 19.2.3** - Modern UI framework
- **Web Audio API** - Professional audio processing
- **IndexedDB** - Local data persistence
- **Bootstrap 5** - UI components and styling
- **Canvas API** - Waveform visualization

### Audio Processing
- **AudioContext** management with automatic initialization
- **Real-time audio routing** through gain nodes
- **Biquad filters** for EQ processing
- **MediaRecorder API** for microphone recording
- **AudioBuffer** management for playback

### Data Persistence
- **Project metadata** stored in IndexedDB projects store
- **Audio recordings** stored as blobs in audioBlobs store
- **Settings persistence** for user preferences
- **Automatic saving** on all track modifications

### Performance Optimizations
- **Canvas rendering** with device pixel ratio support
- **Efficient waveform drawing** with data decimation
- **Memory management** for audio buffers
- **Responsive UI updates** with React hooks

## 🎛️ Professional Workflow

### Recording Workflow
1. Add tracks for your instruments/vocals
2. Arm the track you want to record to (red microphone button)
3. Set up your levels and monitoring
4. Hit the main Record button to start recording
5. Use Stop button to end recording or playback

### Mixing Workflow
1. Import or record your audio tracks
2. Use individual track volume controls for balance
3. Apply EQ to shape the sound of each track
4. Use mute/solo to isolate tracks during mixing
5. Export your final mix

## 🔧 Browser Compatibility

- **Chrome/Edge**: Full support with optimal performance
- **Firefox**: Good support with minor limitations
- **Safari**: Basic support, some iOS limitations
- **Mobile**: Limited due to Web Audio API constraints

## 📊 Performance Targets

- **Audio Latency**: < 10ms for recording
- **UI Rendering**: 60fps timeline and waveforms
- **Memory Usage**: < 100MB for typical projects
- **Track Support**: 16+ simultaneous tracks
- **File Size**: ~80KB gzipped bundle

## 🔒 Privacy & Security

- **100% client-side** - no data sent to servers
- **Local storage only** - all data stays on your device
- **Microphone permission** - requested only when needed
- **No tracking** - completely private audio production

## 🎯 Future Roadmap

- **Advanced effects** (reverb, delay, compressor)
- **MIDI support** for virtual instruments
- **Audio editing tools** (cut, copy, paste, fade)
- **Plugin architecture** for third-party effects
- **Collaboration features** for sharing projects
- **Advanced mixing** (sends, returns, buses)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**MultiTracker Studio** - Professional audio production in your browser 🎵
