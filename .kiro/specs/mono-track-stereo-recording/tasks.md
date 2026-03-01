# Implementation Plan: Mono Track & Stereo Recording

## Overview

Bottom-up implementation converting MultiTracker Studio to mono tracks with per-track pan, input device selection, track arming, and simultaneous dual-track stereo recording. Starts with core audio utilities and engine changes, then recording engine refactor, then UI, then wiring in App.js.

## Tasks

- [x] 1. Add constants and utility foundations
  - [x] 1.1 Add `RECORDING_CONFIG` to `src/utils/constants.js`
    - Add `MAX_ARMED_TRACKS: 2`, `DEFAULT_CHANNEL_ASSIGNMENT: 'mono'`, `DEVICE_POLL_INTERVAL: 2000`
    - _Requirements: 4.1, 4.7, 3.5_
  - [x] 1.2 Update `createAudioBuffer` in `src/utils/audioUtils.js` to default to 1 channel
    - Change default `numberOfChannels` from 2 to 1
    - _Requirements: 1.1_

- [x] 2. Implement AudioEngine mono and pan methods
  - [x] 2.1 Add `splitStereoToMonoPair(audioBuffer)` method to `src/services/AudioEngine.js`
    - Takes a 2-channel AudioBuffer, returns `[leftBuffer, rightBuffer]` each with 1 channel
    - _Requirements: 1.2_
  - [x] 2.2 Add `downmixToMono(audioBuffer)` method to `src/services/AudioEngine.js`
    - Takes an N-channel AudioBuffer (N > 2), returns a 1-channel buffer with averaged samples
    - Passthrough for 1-channel buffers
    - _Requirements: 1.3, 1.4_
  - [x] 2.3 Add `setTrackPan(id, value)` method to `src/services/AudioEngine.js`
    - Sets `track.panNode.pan.setValueAtTime(value, currentTime)` and updates `track.pan`
    - _Requirements: 2.2_
  - [x] 2.4 Update `createTrack(id)` in `src/services/AudioEngine.js` to include `inputDeviceId`, `channelAssignment`, and `pan` defaults
    - Add `inputDeviceId: null`, `channelAssignment: 'mono'`, ensure `pan: 0` is set
    - _Requirements: 1.1, 3.2, 3.5_
  - [ ]* 2.5 Write property test for `splitStereoToMonoPair` in `src/services/AudioEngine.test.js`
    - **Property 2: Stereo import splits into two mono tracks**
    - Generate random 2-channel buffers, verify left output === channel 0, right output === channel 1
    - **Validates: Requirements 1.2**
  - [ ]* 2.6 Write property test for `downmixToMono` in `src/services/AudioEngine.test.js`
    - **Property 3: Downmix preserves audio energy for 3+ channel files**
    - Generate random multi-channel buffers (3-8 channels), verify each output sample equals the mean of input samples
    - **Validates: Requirements 1.3**
  - [ ]* 2.7 Write property test for `setTrackPan` in `src/services/AudioEngine.test.js`
    - **Property 4: Pan value round-trip through StereoPanner**
    - Generate random pan values in [-1, +1], call setTrackPan, verify panNode.pan.value matches
    - **Validates: Requirements 2.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update FileService for mono import and pan-aware export
  - [x] 4.1 Refactor `importAudioFile` in `src/services/FileService.js` to return array of track descriptors
    - 1-channel: return `[{ buffer, pan: 0, nameSuffix: '' }]`
    - 2-channel: call `audioEngine.splitStereoToMonoPair()`, return `[{ buffer: left, pan: -1, nameSuffix: ' (L)' }, { buffer: right, pan: 1, nameSuffix: ' (R)' }]`
    - 3+ channels: call `audioEngine.downmixToMono()`, return `[{ buffer, pan: 0, nameSuffix: '' }]`
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 4.2 Update `mixTracks` in `src/services/FileService.js` to use equal-power pan law on mono buffers
    - Read `track.buffer.getChannelData(0)` (always mono), apply `leftGain = cos((pan+1)*π/4)`, `rightGain = sin((pan+1)*π/4)`
    - _Requirements: 1.6, 2.2_
  - [ ]* 4.3 Write property test for mono export pan law in `src/services/AudioEngine.test.js`
    - **Property 10: Mono export pan law correctness**
    - Generate random mono samples and pan values, verify `leftGain² + rightGain² ≈ 1` (energy preservation) and gains match equal-power formula
    - **Validates: Requirements 1.6, 2.2**
  - [ ]* 4.4 Write property test for mono buffer invariant in `src/services/AudioEngine.test.js`
    - **Property 1: Mono buffer invariant**
    - Generate random audio buffers (1-4 channels), process through import/downmix, assert `buffer.numberOfChannels === 1`
    - **Validates: Requirements 1.1, 1.5, 5.2**

- [x] 5. Create `useAudioDevices` hook and refactor `useAudioRecording`
  - [x] 5.1 Create `src/hooks/useAudioDevices.js` hook
    - Enumerate audio input devices on mount via `navigator.mediaDevices.enumerateDevices()`
    - Listen to `devicechange` event, re-enumerate within 2 seconds
    - Return `{ devices, refreshDevices }` where each device has `{ deviceId, label, groupId }`
    - _Requirements: 3.1, 3.3_
  - [x] 5.2 Refactor `useAudioRecording` in `src/hooks/useAudioRecording.js` for multi-track recording
    - Change `startRecording(armedTracks, audioContext)` to accept array of `{ id, inputDeviceId, channelAssignment }` descriptors
    - Manage `recordingStreams` Map (deviceId → MediaStream) to avoid duplicate getUserMedia calls
    - Manage `perTrackProcessors` Map (trackId → { processor, chunks }) for per-track ScriptProcessorNode capture
    - For stereo mode (one Left + one Right on same device): request stereo stream, use ChannelSplitterNode to route channel 0 to Left track processor and channel 1 to Right track processor
    - For mono mode (single track, Mono assignment): request mono stream, connect directly to processor
    - Change `stopRecording()` to return `Map<trackId, AudioBuffer>` with finalized mono buffers
    - Add `getRecordingNodeForTrack(trackId)` for VU meter / waveform source during recording
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 1.5_
  - [ ]* 5.3 Write property test for stereo channel split in `src/hooks/useAudioRecording.test.js`
    - **Property 7: Stereo channel split correctness**
    - Generate random 2-channel Float32Arrays, simulate channel split, assert left track data === channel 0 and right track data === channel 1
    - **Validates: Requirements 4.4**
  - [ ]* 5.4 Write property test for recording targets only armed tracks in `src/hooks/useAudioRecording.test.js`
    - **Property 8: Recording targets only armed tracks**
    - Generate random track sets with mixed armed/unarmed states, simulate recording start, assert only armed tracks receive data
    - **Validates: Requirements 6.3**
  - [ ]* 5.5 Write property test for armed state survives recording stop in `src/hooks/useAudioRecording.test.js`
    - **Property 9: Armed state survives recording stop**
    - Generate random armed track sets, simulate start then stop, assert all previously armed tracks remain armed
    - **Validates: Requirements 6.5**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update Track UI component
  - [x] 7.1 Add input device dropdown to `src/components/tracks/Track.js`
    - Add `Form.Select` populated from `availableDevices` prop
    - Add new props: `availableDevices`, `onInputDeviceChange(trackId, deviceId)`
    - Show warning icon (react-icons) when selected device is unavailable
    - _Requirements: 3.1, 3.4_
  - [x] 7.2 Add channel assignment selector to `src/components/tracks/Track.js`
    - Add Mono / Left / Right radio group or button group next to device dropdown
    - Add new props: `onChannelAssignmentChange(trackId, assignment)`
    - _Requirements: 3.5_
  - [x] 7.3 Update arm button in `src/components/tracks/Track.js`
    - Rename `onRecord` prop to `onArm` for arming semantics
    - Show red highlight when `isArmed` is true
    - _Requirements: 6.1, 6.2_

- [x] 8. Update TransportControls for armed track validation
  - [x] 8.1 Update `src/components/transport/TransportControls.js`
    - Add `armedTrackCount` prop, show badge or disable record when 0
    - Add `onRecordError(message)` prop for error display
    - Check `armedTrackIds.size > 0` before starting recording
    - Display "Arm at least one track to record" when no tracks armed
    - _Requirements: 6.3, 6.4_

- [x] 9. Wire everything together in App.js
  - [x] 9.1 Update track state model in `src/App.js`
    - Add `isArmed`, `inputDeviceId`, `channelAssignment` fields to each track in `tracks` state
    - Replace `armedTrackId` (string|null) with `armedTrackIds` (Set, max size 2)
    - Add `recordingError` state for error messages
    - _Requirements: 1.1, 3.2, 6.1_
  - [x] 9.2 Add `handleTrackArm(trackId)` callback in `src/App.js`
    - Toggle track in `armedTrackIds`, enforce max 2 limit
    - Show error message when trying to arm a 3rd track
    - _Requirements: 4.1, 4.7, 6.1_
  - [x] 9.3 Add `handleInputDeviceChange` and `handleChannelAssignmentChange` callbacks in `src/App.js`
    - Update track config in state, validate device availability on devicechange
    - Fall back to default device if selected device disappears
    - _Requirements: 3.2, 3.4, 3.5_
  - [x] 9.4 Refactor `handleRecord` in `src/App.js` for multi-track recording flow
    - Validate armed tracks, determine mono vs stereo mode
    - Pass armed track descriptors to `startRecording`
    - On stop, process `Map<trackId, AudioBuffer>` and assign mono buffers to each track
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 6.3_
  - [x] 9.5 Refactor `handleImportAudio` in `src/App.js` for mono import
    - Process array returned by `importAudioFile`
    - For stereo files: create two tracks named `"filename (L)"` and `"filename (R)"` with pan -1 and +1
    - For mono/3+ channel files: create single track as before
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 9.6 Integrate `useAudioDevices` hook in `src/App.js`
    - Pass `devices` to Track components as `availableDevices`
    - _Requirements: 3.1, 3.3_
  - [ ]* 9.7 Write property test for armed track count enforcement in `src/App.test.js`
    - **Property 6: Armed track count never exceeds maximum**
    - Generate random sequences of arm/disarm operations on N tracks, replay them, assert armed count ≤ 2 at every step
    - **Validates: Requirements 4.1, 4.7**

- [x] 10. Persistence round-trip validation
  - [x] 10.1 Ensure new track fields persist in `src/services/DatabaseService.js`
    - Verify `pan`, `isArmed`, `inputDeviceId`, `channelAssignment` are saved and loaded with project
    - No schema migration needed — fields are part of the track object
    - _Requirements: 2.3, 3.2_
  - [ ]* 10.2 Write property test for track configuration persistence in `src/services/DatabaseService.test.js`
    - **Property 5: Track configuration persistence round-trip**
    - Generate random track configs (pan in [-1,+1], random deviceId strings, channelAssignment in {mono, left, right}), save project, load project, assert all fields match
    - **Validates: Requirements 2.3, 3.2**

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` library, colocated with source files per project convention
- Checkpoints ensure incremental validation
- The design uses JavaScript — all code examples and implementations use JS (no TypeScript)
