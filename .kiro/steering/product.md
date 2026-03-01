# MultiTracker Studio

A browser-based multi-track audio recording and mixing studio. No backend — everything runs client-side using the Web Audio API and IndexedDB for persistence.

## Core Capabilities
- Multi-track recording from microphone with real-time monitoring
- Transport controls (play, pause, stop, record) with timeline navigation
- Per-track volume, pan, mute/solo, and effects chain (EQ, chorus, delay, reverb, compressor)
- Audio file import (WAV, MP3, OGG, WebM) and WAV export of mixed output
- Project management with automatic saving to IndexedDB
- Canvas-based waveform display, VU meters, and spectrum analyzer
- Built-in metronome with adjustable BPM

## Key Constraints
- 100% client-side — no server communication for audio data
- Audio context requires user gesture to initialize (browser policy)
- Targets modern browsers with Web Audio API support (Chrome/Edge preferred)
