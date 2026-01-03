import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaPlus, FaFileImport, FaDownload, FaFolderOpen } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { useAudioContext } from './hooks/useAudioContext.js';
import { useIndexedDB } from './hooks/useIndexedDB.js';
import { useAudioRecording } from './hooks/useAudioRecording.js';
import { useMetronome } from './hooks/useMetronome.js';
import TransportControls from './components/transport/TransportControls.js';
import Timeline from './components/transport/Timeline.js';
import Track from './components/tracks/Track.js';
import VUMeter from './components/common/VUMeter.js';
import SpectrumAnalyzer from './components/common/SpectrumAnalyzer.js';
import FileService from './services/FileService.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';

function App() {
  const { isInitialized, needsUserActivation, initializeAudio, isPlaying, currentTime, play, pause, stop, audioEngine } = useAudioContext();
  const { isReady, db } = useIndexedDB();
  const { isRecording, startRecording, stopRecording, convertBlobToAudioBuffer, recordedBlob, inputNode, setRecordedBlob } = useAudioRecording(audioEngine.context);
  const { isMetronomeOn, bpm, setBpm, toggleMetronome } = useMetronome(audioEngine.context);
  const [tracks, setTracks] = useState([]);
  const [recordingTrackId, setRecordingTrackId] = useState(null);
  const [armedTrackId, setArmedTrackId] = useState(null);
  const [projectDuration, setProjectDuration] = useState(60);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [projects, setProjects] = useState([]);
  const [showProjectSelector, setShowProjectSelector] = useState(true);

  // Save tracks to IndexedDB whenever tracks change
  React.useEffect(() => {
    if (isReady && tracks.length > 0) {
      const projectData = {
        id: currentProjectId,
        name: 'Current Project',
        tracks: tracks.map(track => ({
          ...track,
          buffer: null // Don't save buffer in project data
        })),
        created: Date.now(),
        updated: Date.now()
      };
      db.saveProject(projectData);
    }
  }, [tracks, isReady, db, currentProjectId]);

  // Load projects list on startup
  React.useEffect(() => {
    if (isReady) {
      db.getAllProjects().then(projectList => {
        setProjects(projectList);
      });
    }
  }, [isReady, db]);

  // Load tracks from IndexedDB when project is selected
  React.useEffect(() => {
    if (isReady && currentProjectId) {
      db.loadProject(currentProjectId).then(project => {
        if (project && project.tracks) {
          console.log('Loaded project tracks:', project.tracks);
          setTracks(project.tracks);
          // Recreate audio engine tracks - but only if audio engine is initialized
          if (audioEngine.context) {
            project.tracks.forEach(track => {
              audioEngine.createTrack(track.id);
            });
          }
        }
      });
    }
  }, [isReady, db, currentProjectId, audioEngine]);

  // Create audio engine tracks when audio context becomes available
  React.useEffect(() => {
    if (audioEngine.context && tracks.length > 0) {
      tracks.forEach(track => {
        if (!audioEngine.tracks.has(track.id)) {
          audioEngine.createTrack(track.id);
        }
      });
    }
  }, [audioEngine.context, tracks, audioEngine]);

  // Load audio blobs for existing tracks
  React.useEffect(() => {
    if (isReady) {
      console.log('Loading audio for tracks:', tracks.filter(t => t.hasAudio && !t.buffer));
      tracks.forEach(async track => {
        if (track.hasAudio && !track.buffer) {
          console.log('Loading audio for track:', track.id);
          try {
            const blob = await db.loadAudioBlob(track.id);
            console.log('Loaded blob for track:', track.id, blob ? blob.size : 'null');
            if (blob && convertBlobToAudioBuffer) {
              const audioBuffer = await convertBlobToAudioBuffer(blob);
              console.log('Converted to audio buffer:', track.id, audioBuffer ? audioBuffer.duration : 'null');
              if (audioBuffer) {
                // Create new buffer with the correct audio context
                const correctBuffer = audioEngine.context.createBuffer(
                  audioBuffer.numberOfChannels,
                  audioBuffer.length,
                  audioBuffer.sampleRate
                );
                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                  correctBuffer.copyToChannel(audioBuffer.getChannelData(channel), channel);
                }
                
                const engineTrack = audioEngine.tracks.get(track.id);
                if (engineTrack) {
                  engineTrack.buffer = correctBuffer;
                  console.log('Set buffer on engine track:', track.id);
                }
                setTracks(prev => prev.map(t => 
                  t.id === track.id ? { ...t, buffer: correctBuffer } : t
                ));
                console.log('Updated track with audio buffer:', track.id);
              }
            }
          } catch (error) {
            console.error('Failed to load audio for track:', track.id, error);
          }
        }
      });
    }
  }, [tracks, isReady, db, audioEngine, convertBlobToAudioBuffer]);

  // Update project duration based on longest track
  React.useEffect(() => {
    const maxDuration = Math.max(60, ...tracks.map(track => 
      track.buffer ? track.buffer.duration : 0
    ));
    setProjectDuration(maxDuration);
  }, [tracks]);

  // Sync React track buffers to AudioEngine tracks
  React.useEffect(() => {
    tracks.forEach(track => {
      if (track.buffer) {
        const engineTrack = audioEngine.tracks.get(track.id);
        if (engineTrack && !engineTrack.buffer) {
          engineTrack.buffer = track.buffer;
          console.log('Synced buffer to engine track:', track.id);
        }
      }
    });
  }, [tracks, audioEngine]);

  const addTrack = useCallback(async () => {
    // Initialize audio if needed
    if (!audioEngine.context) {
      const success = await audioEngine.initialize();
      if (!success) {
        console.error('Failed to initialize audio');
        return;
      }
    }
    
    const trackId = uuidv4();
    const newTrack = {
      id: trackId,
      name: `Track ${tracks.length + 1}`,
      volume: 1,
      muted: false,
      solo: false,
      buffer: null,
      effects: {
        lowGain: 0,
        midGain: 0,
        highGain: 0
      }
    };
    
    const engineTrack = audioEngine.createTrack(trackId);
    if (engineTrack) {
      setTracks(prev => [...prev, newTrack]);
    }
  }, [tracks.length, audioEngine]);

  const deleteTrack = useCallback(async (trackId) => {
    audioEngine.removeTrack(trackId);
    // Remove audio blob from IndexedDB
    await db.db?.delete('audioBlobs', trackId);
    setTracks(prev => prev.filter(track => track.id !== trackId));
  }, [audioEngine, db]);

  const handleVolumeChange = useCallback((volume) => {
    audioEngine.setMasterVolume(volume);
  }, [audioEngine]);

  const handleTrackVolumeChange = useCallback((trackId, volume) => {
    audioEngine.setTrackVolume(trackId, volume);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
  }, [audioEngine]);

  const handleTrackNameChange = useCallback((trackId, name) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, name } : track
    ));
  }, []);

  const handleMute = useCallback((trackId) => {
    const track = audioEngine.tracks.get(trackId);
    if (track) {
      track.muted = !track.muted;
    }
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  }, [audioEngine]);

  const handleSolo = useCallback((trackId) => {
    const newSoloState = !tracks.find(t => t.id === trackId)?.solo;
    tracks.forEach(track => {
      const engineTrack = audioEngine.tracks.get(track.id);
      if (engineTrack) {
        engineTrack.solo = track.id === trackId ? newSoloState : false;
      }
    });
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, solo: !track.solo } : { ...track, solo: false }
    ));
  }, [tracks, audioEngine]);

  const handleEQChange = useCallback((trackId, band, gain) => {
    audioEngine.setTrackEQ(trackId, band, gain);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? {
        ...track,
        effects: {
          ...track.effects,
          [`${band}Gain`]: gain
        }
      } : track
    ));
  }, [audioEngine]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 2, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 2, 0.25));
  }, []);

  const handleTrackArm = useCallback((trackId) => {
    setArmedTrackId(prev => prev === trackId ? null : trackId);
  }, []);

  const handleStop = useCallback(() => {
    if (isRecording) {
      stopRecording();
      // Don't clear recordingTrackId here - let the audio processing useEffect handle it
    }
    stop();
  }, [isRecording, stopRecording, stop]);

  const handleRecord = useCallback(async () => {
    console.log('Record button clicked, isRecording:', isRecording, 'armedTrackId:', armedTrackId);
    if (!isInitialized) {
      await initializeAudio();
    }
    
    if (isRecording) {
      console.log('Stopping recording');
      stopRecording();
      // Don't clear recordingTrackId here - let the audio processing useEffect handle it
    } else {
      if (armedTrackId) {
        console.log('Starting recording on track:', armedTrackId);
        const success = await startRecording();
        if (success) {
          setRecordingTrackId(armedTrackId);
          console.log('Recording started successfully');
        } else {
          console.error('Failed to start recording');
        }
      } else {
        console.log('No track armed for recording');
      }
    }
  }, [isRecording, startRecording, stopRecording, isInitialized, initializeAudio, armedTrackId]);

  // Handle recorded audio
  React.useEffect(() => {
    if (recordedBlob && recordingTrackId) {
      console.log('Processing recorded audio for track:', recordingTrackId, 'blob size:', recordedBlob.size);
      convertBlobToAudioBuffer(recordedBlob).then(async audioBuffer => {
        if (audioBuffer) {
          console.log('Audio buffer created, duration:', audioBuffer.duration, 'channels:', audioBuffer.numberOfChannels);
          // Create new buffer with the correct audio context
          const correctBuffer = audioEngine.context.createBuffer(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
          );
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            correctBuffer.copyToChannel(audioBuffer.getChannelData(channel), channel);
          }
          
          const track = audioEngine.tracks.get(recordingTrackId);
          if (track) {
            track.buffer = correctBuffer;
            // Save audio blob to IndexedDB
            await db.saveAudioBlob(recordingTrackId, recordedBlob);
            setTracks(prev => prev.map(t => 
              t.id === recordingTrackId ? { ...t, buffer: correctBuffer, hasAudio: true } : t
            ));
            console.log('Track updated with audio buffer');
          } else {
            console.error('Track not found in audio engine:', recordingTrackId);
          }
        } else {
          console.error('Failed to create audio buffer from blob');
        }
        // Clear the recorded blob and recording track ID after processing
        setRecordedBlob(null);
        setRecordingTrackId(null);
      }).catch(error => {
        console.error('Error processing recorded audio:', error);
        setRecordedBlob(null);
        setRecordingTrackId(null);
      });
    }
  }, [recordedBlob, recordingTrackId, audioEngine, convertBlobToAudioBuffer, db, setRecordedBlob]);

  const handleFileImport = useCallback(() => {
    const input = FileService.createFileInput(async (file) => {
      try {
        const audioBuffer = await FileService.importAudioFile(file, audioEngine.context);
        const trackId = uuidv4();
        const newTrack = {
          id: trackId,
          name: file.name.replace(/\.[^/.]+$/, ""),
          volume: 1,
          muted: false,
          solo: false,
          buffer: audioBuffer,
          hasAudio: true
        };
        
        const engineTrack = audioEngine.createTrack(trackId);
        engineTrack.buffer = audioBuffer;
        // Save imported audio to IndexedDB
        const blob = new Blob([await audioBuffer.getChannelData(0).buffer], { type: 'audio/wav' });
        await db.saveAudioBlob(trackId, blob);
        setTracks(prev => [...prev, newTrack]);
      } catch (error) {
        alert(`Failed to import file: ${error.message}`);
      }
    });
    input.click();
  }, [audioEngine, db]);

  const handleExport = useCallback(() => {
    // For now, just export the first track with audio
    const trackWithAudio = tracks.find(track => track.buffer);
    if (trackWithAudio) {
      FileService.exportAudioBuffer(trackWithAudio.buffer, `${trackWithAudio.name}.wav`);
    } else {
      alert('No audio to export');
    }
  }, [tracks]);

  const handleProjectSelect = useCallback(async (projectId) => {
    setCurrentProjectId(projectId);
    setShowProjectSelector(false);
    await initializeAudio();
  }, [initializeAudio]);

  const handleNewProject = useCallback(async () => {
    const projectId = uuidv4();
    const newProject = {
      id: projectId,
      name: `Project ${projects.length + 1}`,
      tracks: [],
      created: Date.now(),
      updated: Date.now()
    };
    await db.saveProject(newProject);
    setCurrentProjectId(projectId);
    setShowProjectSelector(false);
    await initializeAudio();
  }, [projects.length, db, initializeAudio]);

  if (needsUserActivation) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <h3 className="mb-3">🎵 MultiTracker Studio</h3>
          <p className="mb-4">Click to initialize audio system</p>
          <Button 
            variant="primary" 
            size="lg"
            onClick={initializeAudio}
          >
            Start Studio
          </Button>
        </div>
      </div>
    );
  }

  if (!isReady || showProjectSelector) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          {!isReady ? (
            <>
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Initializing Database...</p>
            </>
          ) : (
            <>
              <h3 className="mb-4">🎵 MultiTracker Studio</h3>
              <h5 className="mb-4">Select a Project</h5>
              <div className="d-grid gap-2" style={{ minWidth: '300px' }}>
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleNewProject}
                >
                  Create New Project
                </Button>
                {projects.map(project => (
                  <Button
                    key={project.id}
                    variant="outline-secondary"
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    {project.name}
                    <small className="d-block text-muted">
                      {new Date(project.updated).toLocaleDateString()}
                    </small>
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="App vh-100 d-flex flex-column">
      <Container fluid className="flex-grow-1 d-flex flex-column p-0">
        {/* Toolbar */}
        <div className="studio-panel p-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <h4 className="mb-0" style={{ color: '#a77e4d' }}>MultiTrack Studio</h4>
            <Button variant="outline-primary" onClick={addTrack}>
              <FaPlus className="me-1" /> Add Track
            </Button>
            <Button variant="outline-secondary" onClick={handleFileImport}>
              <FaFileImport className="me-1" /> Import
            </Button>
            <Button variant="outline-secondary" onClick={handleExport}>
              <FaDownload className="me-1" /> Export
            </Button>
            <Button variant="outline-secondary" onClick={() => setShowProjectSelector(true)}>
              <FaFolderOpen className="me-1" /> Projects
            </Button>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <div className="master-spectrum">
              <SpectrumAnalyzer 
                key={`master-spectrum-${tracks.length}`}
                audioNode={audioEngine?.masterVUGain}
                width={120}
                height={40}
                bars={16}
              />
            </div>
            <div className="master-vu">
              <VUMeter 
                key={`master-vu-${tracks.length}`}
                audioNode={audioEngine?.masterVUGain}
                width={10}
                height={40}
              />
            </div>
            <label className="form-label mb-0">Master Volume:</label>
            <input 
              type="range" 
              className="form-range" 
              style={{ width: '100px' }}
              min={0}
              max={1}
              step={0.01}
              defaultValue={1}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <Row className="flex-grow-1 g-0">
          <Col className="d-flex flex-column">
            {/* Timeline Area */}
            <div className="d-flex">
              <div style={{ minWidth: '268px' }}></div>
              <div className="flex-grow-1 ms-3">
                <Timeline 
                  currentTime={currentTime}
                  duration={projectDuration}
                  zoom={zoom}
                  onSeek={(time) => {
                    audioEngine.currentTime = time;
                  }}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  isPlaying={isPlaying}
                />
              </div>
              <div style={{ width: '20px' }}></div>
            </div>
            
            {/* Tracks Area */}
            <div className="tracks-container flex-grow-1 overflow-auto p-2" style={{ marginTop: '10px' }}>
              {tracks.map(track => (
                <Track
                  key={track.id}
                  track={track}
                  onVolumeChange={handleTrackVolumeChange}
                  onNameChange={handleTrackNameChange}
                  onMute={handleMute}
                  onSolo={handleSolo}
                  onDelete={deleteTrack}
                  onRecord={handleTrackArm}
                  onEQChange={handleEQChange}
                  isRecording={isRecording && recordingTrackId === track.id}
                  isArmed={armedTrackId === track.id}
                  currentTime={currentTime}
                  audioEngine={audioEngine}
                  inputNode={isRecording && recordingTrackId === track.id ? inputNode : null}
                  zoom={zoom}
                  projectDuration={projectDuration}
                />
              ))}
              
              {tracks.length === 0 && (
                <div className="text-center text-muted mt-5">
                  <h4>Welcome to MultiTracker</h4>
                  <p>Add a track to get started or import an audio file</p>
                </div>
              )}
            </div>
          </Col>
        </Row>
        
        {/* Transport Controls */}
        <TransportControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          onPlay={play}
          onPause={pause}
          onStop={handleStop}
          onRecord={handleRecord}
          isRecording={isRecording}
          bpm={bpm}
          isMetronomeOn={isMetronomeOn}
          onMetronomeToggle={toggleMetronome}
          onBpmChange={setBpm}
        />
      </Container>
    </div>
  );
}

export default App;
