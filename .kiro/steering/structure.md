# Project Structure

```
src/
├── App.js                  # Root component — all state management lives here
├── index.js                # Entry point, renders App in StrictMode
├── components/
│   ├── common/             # Shared visual components (VUMeter, SpectrumAnalyzer)
│   ├── effects/            # Per-track effect UI panels (EQ, Chorus, Delay, Reverb, Compressor)
│   ├── tracks/             # Track row UI (Track, WaveformDisplay, VerticalSlider)
│   └── transport/          # Playback controls (TransportControls, Timeline, Metronome)
├── hooks/                  # Custom React hooks
│   ├── useAudioContext.js  # AudioEngine lifecycle, play/pause/stop state
│   ├── useAudioRecording.js# MediaRecorder integration, monitoring, blob capture
│   ├── useIndexedDB.js     # DatabaseService initialization wrapper
│   └── useMetronome.js     # Click track scheduling
├── services/               # Non-React business logic (plain classes, singleton instances)
│   ├── AudioEngine.js      # Core audio graph: track creation, routing, effects chain, playback
│   ├── AudioEffects.js     # Web Audio node factories (EQ, reverb, chorus, delay, compressor)
│   ├── DatabaseService.js  # IndexedDB CRUD for projects, audio blobs, settings
│   └── FileService.js      # File import/export, WAV encoding, track mixing
├── utils/                  # Pure helper functions
│   ├── audioUtils.js       # Buffer creation, dB/gain conversion, sample math
│   ├── constants.js        # Audio config, UI config, keyboard shortcuts
│   └── timeUtils.js        # Time formatting, beat/time conversion, quantization
└── styles/
    └── theme.css           # Dark studio theme via CSS custom properties
```

## Architecture Patterns
- **State**: All app state is lifted into `App.js` via `useState`/`useCallback`. No Redux or context providers.
- **Services**: Singleton class instances (`audioEngine`, `databaseService`, `fileService`) handle non-UI logic. Imported directly, not injected.
- **Hooks**: Thin wrappers that connect services to React lifecycle. Each hook owns one concern.
- **Components**: Functional components with props. Effects panels follow a consistent pattern: enable toggle + parameter sliders using `VerticalSlider`.
- **Audio graph**: `AudioEngine.createTrack()` builds a per-track node chain: `GainNode → EQ → Chorus → Delay → Reverb → Compressor → PanNode → VU → MasterGain → Destination`.
- **Persistence**: Projects auto-save to IndexedDB on any state change. Audio blobs stored separately from project metadata.
