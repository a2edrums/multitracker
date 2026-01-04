# Modular Amp Simulation Implementation Plan

## Overview
Implement a modular amp simulation system starting with Ampeg SVT, designed for easy addition of future amp models. Focus on extensible architecture and plugin-style amp modules.

## Phase 1: Core Amp Framework (Priority 1)

### 1.1 Create Base Amp Engine
**File:** `src/services/AmpSimulation.js`
- Abstract `BaseAmp` class with standard interface
- Common signal chain: Input → Preamp → Tone Stack → Power Amp → Output
- Standard methods: `process()`, `setParameter()`, `bypass()`, `getParameters()`
- Plugin registration system for amp models

### 1.2 Create Amp Registry
**File:** `src/services/AmpRegistry.js`
- Central registry for all amp models
- Dynamic amp loading and instantiation
- Amp metadata (name, type, parameters, presets)
- Factory pattern for amp creation

### 1.3 Integrate into AudioEngine
**File:** `src/services/AudioEngine.js`
- Modify `createTrack()` to include modular amp slot
- Signal flow: `trackGain → ampSim → eqNode → vuGain → masterGain`
- Methods: `setTrackAmp(id, ampModel)`, `setAmpParameter(id, param, value)`
- Proper cleanup and amp switching

## Phase 2: Ampeg SVT Implementation (Priority 2)

### 2.1 Create SVT Amp Module
**File:** `src/services/amps/AmegSVT.js`
- Extend `BaseAmp` class
- SVT-specific signal chain and tube modeling
- Parameters: gain, bass, mid, treble, ultraLow, ultraHigh
- Authentic SVT frequency response and saturation curves

### 2.2 SVT Audio Characteristics
**File:** `src/utils/amps/svtCharacteristics.js`
- SVT preamp tube curves (12AX7)
- SVT power tube compression (6550)
- SVT tone stack circuit modeling
- Frequency response data and filter coefficients

### 2.3 Register SVT in System
**File:** `src/services/amps/index.js`
- Export all available amp modules
- Auto-registration with AmpRegistry
- Amp metadata and default settings

## Phase 3: Modular UI System (Priority 3)

### 3.1 Create Base Amp Controls
**File:** `src/components/effects/AmpControls.js`
- Generic amp control container
- Dynamic parameter rendering based on amp metadata
- Amp selector dropdown
- Bypass toggle and visual indicators

### 3.2 Create SVT-Specific UI
**File:** `src/components/effects/amps/SVTControls.js`
- Custom SVT front panel layout
- SVT-style knobs and graphics
- Specialized parameter grouping
- Optional: can fall back to generic controls

### 3.3 Update Track Component
**File:** `src/components/tracks/Track.js`
- Add amp controls section
- Pass amp change handlers
- Show current amp model indicator

## Phase 4: State Management (Priority 4)

### 4.1 Update App.js State
**File:** `src/App.js`
- Add amp state: `ampModel`, `ampEnabled`, `ampParameters`
- Create `handleAmpChange()` and `handleAmpParameterChange()`
- Default amp settings for new tracks

### 4.2 Database Integration
**File:** `src/services/DatabaseService.js`
- Store amp settings with track data
- Version migration for existing projects
- Amp parameter serialization/deserialization

## Architecture Details

### Modular Amp Interface
```javascript
class BaseAmp {
  constructor(context) {}
  getMetadata() {} // name, parameters, presets
  initialize() {} // create audio nodes
  process(input, output) {} // audio processing
  setParameter(name, value) {} // parameter control
  bypass(enabled) {} // bypass toggle
  destroy() {} // cleanup
}
```

### Amp Registry Pattern
```javascript
// Auto-registration
AmpRegistry.register('ampeg-svt', AmegSVT);
AmpRegistry.register('fender-bassman', FenderBassman); // future

// Dynamic creation
const amp = AmpRegistry.create('ampeg-svt', audioContext);
```

### Signal Chain Architecture
```
Input → [Selected Amp Module] → EQ → Volume → Master
         ↓
    Preamp → Tone → Power (amp-specific)
```

### File Structure
```
src/
├── services/
│   ├── AmpSimulation.js (base framework)
│   ├── AmpRegistry.js (amp management)
│   └── amps/
│       ├── index.js (amp exports)
│       ├── AmegSVT.js (SVT implementation)
│       └── BaseAmp.js (abstract base class)
├── components/effects/
│   ├── AmpControls.js (generic UI)
│   └── amps/
│       └── SVTControls.js (SVT-specific UI)
└── utils/amps/
    └── svtCharacteristics.js (SVT data)
```

### Key Benefits of Modular Design
- **Extensible**: Easy to add new amp models
- **Maintainable**: Each amp is self-contained
- **Testable**: Individual amp modules can be tested
- **Flexible**: Mix and match amps per track
- **Performance**: Load only needed amp models

### Future Amp Addition Process
1. Create new amp class extending `BaseAmp`
2. Implement amp-specific audio processing
3. Add amp characteristics data
4. Register in amp index
5. Optional: Create custom UI component
6. Test and deploy

### Success Criteria
- ✅ Modular amp architecture
- ✅ Authentic Ampeg SVT simulation
- ✅ Easy future amp additions
- ✅ Real-time parameter control
- ✅ Professional audio quality
- ✅ Persistent amp settings

## Execution Order
1. Create BaseAmp abstract class and AmpRegistry
2. Implement AmpSimulation service with modular support
3. Create AmegSVT amp module with authentic modeling
4. Integrate modular amp system into AudioEngine
5. Create generic AmpControls UI component
6. Implement SVT-specific UI controls
7. Update Track component for amp integration
8. Add amp state management in App.js
9. Implement amp settings persistence
10. Test modular system and SVT quality

This modular approach ensures the Ampeg SVT implementation is production-ready while providing a solid foundation for adding Marshall, Fender, and other amp models in future phases.