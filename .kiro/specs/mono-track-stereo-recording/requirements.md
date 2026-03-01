# Requirements Document

## Introduction

This feature converts MultiTracker Studio tracks from implicit stereo to explicit mono, adds per-track audio input selection, and enables simultaneous dual-track recording where one track captures the left channel and another captures the right channel of a stereo input device. This allows users to record stereo sources (e.g., a stereo microphone or audio interface) as two independent mono tracks with full per-track mixing control.

## Glossary

- **Audio_Engine**: The core audio graph service (`AudioEngine.js`) responsible for track creation, routing, effects chain management, and playback.
- **Track**: A single mono audio channel in the project, with its own gain, pan, effects chain, and waveform display.
- **Input_Selector**: A UI control on each track that allows the user to choose which audio input device and channel assignment to use for recording.
- **Channel_Splitter**: A Web Audio API `ChannelSplitterNode` used to separate a stereo input stream into individual left and right mono channels.
- **Recording_Engine**: The recording subsystem (`useAudioRecording.js`) responsible for capturing audio from input devices and writing it to track buffers.
- **Stereo_Recording_Mode**: A recording mode where two armed tracks record simultaneously, one capturing the left channel and the other capturing the right channel of a single stereo input.
- **Armed_Track**: A track that has been selected for recording by the user, indicated by the record button being active.

## Requirements

### Requirement 1: Mono Track Audio Format

**User Story:** As a music producer, I want each track to be mono, so that I have precise control over stereo placement using the pan knob.

#### Acceptance Criteria

1. THE Audio_Engine SHALL create each new track with a single mono audio channel.
2. WHEN a stereo audio file (2 channels) is imported, THE system SHALL create two mono tracks — one containing the left channel panned fully left (-1) and one containing the right channel panned fully right (+1).
3. WHEN an audio file with more than 2 channels is imported, THE Audio_Engine SHALL downmix the audio to mono before storing it in a single track buffer.
4. WHEN a mono audio file (1 channel) is imported, THE system SHALL create a single track with the audio buffer unchanged.
5. WHEN a recording is captured, THE Recording_Engine SHALL store the recorded audio as a single mono channel in the Track buffer.
6. THE Audio_Engine SHALL route each mono Track through the existing effects chain (GainNode, EQ, Chorus, Delay, Reverb, Compressor) before reaching the StereoPanner node.

### Requirement 2: Per-Track Pan Control

**User Story:** As a music producer, I want to set the stereo pan position for each mono track, so that I can place instruments across the stereo field.

#### Acceptance Criteria

1. THE Track SHALL display a pan control ranging from -1 (full left) to +1 (full right) with a default value of 0 (center).
2. WHEN the user adjusts the pan control, THE Audio_Engine SHALL update the StereoPanner node value for that Track in real time.
3. THE Audio_Engine SHALL persist the pan value as part of the Track state when the project is saved.

### Requirement 3: Audio Input Device Selection

**User Story:** As a music producer, I want to select which audio input device to use for each track, so that I can record from different microphones or audio interfaces.

#### Acceptance Criteria

1. THE Input_Selector SHALL enumerate all available audio input devices using the MediaDevices API and display them in a dropdown on each Track.
2. WHEN the user selects an audio input device from the Input_Selector, THE Track SHALL store the selected device ID as part of its configuration.
3. WHEN a new audio input device is connected or disconnected, THE Input_Selector SHALL update the list of available devices within 2 seconds.
4. IF the previously selected audio input device is no longer available, THEN THE Input_Selector SHALL fall back to the system default audio input device and display a visual indicator that the selection has changed.
5. THE Input_Selector SHALL allow the user to choose a channel assignment of "Mono", "Left", or "Right" for the selected input device.

### Requirement 4: Simultaneous Dual-Track Stereo Recording

**User Story:** As a music producer, I want to record two tracks simultaneously from the left and right channels of a stereo input, so that I can capture stereo sources as independent mono tracks.

#### Acceptance Criteria

1. THE Recording_Engine SHALL allow the user to arm up to 2 tracks for simultaneous recording.
2. WHEN two tracks are armed with one assigned to "Left" and the other assigned to "Right" on the same input device, THE Recording_Engine SHALL request a stereo audio stream from that device.
3. WHEN recording starts in Stereo_Recording_Mode, THE Channel_Splitter SHALL split the stereo input stream into separate left and right mono signals.
4. WHILE recording in Stereo_Recording_Mode, THE Recording_Engine SHALL write the left channel audio data to the Track assigned as "Left" and the right channel audio data to the Track assigned as "Right" simultaneously.
5. WHEN recording stops, THE Recording_Engine SHALL finalize both Track buffers and release the audio input stream.
6. WHILE recording in Stereo_Recording_Mode, THE Track SHALL display a live waveform and VU meter for its respective channel.
7. IF the user arms more than 2 tracks for recording, THEN THE Recording_Engine SHALL display an error message indicating that a maximum of 2 simultaneous recording tracks are supported.

### Requirement 5: Single Track Mono Recording

**User Story:** As a music producer, I want to record a single mono track from any input device, so that I can capture a mono source without needing to set up stereo recording.

#### Acceptance Criteria

1. WHEN a single Track is armed with a "Mono" channel assignment, THE Recording_Engine SHALL request a mono audio stream from the selected input device.
2. WHEN recording starts with a single armed Track, THE Recording_Engine SHALL capture audio and write it to that Track as a mono buffer.
3. WHILE recording a single Track, THE Track SHALL display a live waveform and VU meter reflecting the incoming mono signal.

### Requirement 6: Track Arming

**User Story:** As a music producer, I want to arm specific tracks for recording, so that I can control which tracks will capture audio when I press record.

#### Acceptance Criteria

1. THE Track SHALL provide a record-arm button that toggles the armed state independently of the transport record button.
2. WHEN the user clicks the record-arm button, THE Track SHALL visually indicate the armed state with a red highlight.
3. WHEN the transport record button is pressed, THE Recording_Engine SHALL begin recording only on Armed_Tracks.
4. IF no tracks are armed when the transport record button is pressed, THEN THE Recording_Engine SHALL display a message prompting the user to arm at least one track.
5. WHEN recording stops, THE Armed_Tracks SHALL remain in the armed state until the user explicitly disarms them.
