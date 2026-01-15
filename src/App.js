import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
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
  const { isRecording, startRecording, stopRecording, convertBlobToAudioBuffer, recordedBlob, inputNode, recordingBuffer, setRecordedBlob } = useAudioRecording(audioEngine.context);
  const { isMetronomeOn, bpm, setBpm, toggleMetronome } = useMetronome(audioEngine.context);
  const [tracks, setTracks] = useState([]);
  const [recordingTrackId, setRecordingTrackId] = useState(null);
  const [armedTrackId, setArmedTrackId] = useState(null);
  const [projectDuration, setProjectDuration] = useState(60);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [zoom, setZoom] = useState(1);
  const [masterVolume, setMasterVolume] = useState(1);
  const [projects, setProjects] = useState([]);
  const [showProjectSelector, setShowProjectSelector] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');

  // Save project data whenever any studio setting changes
  React.useEffect(() => {
    if (isReady && currentProjectId && tracks.length >= 0) {
      // Load existing project to preserve created timestamp
      db.loadProject(currentProjectId).then(existingProject => {
        const projectData = {
          id: currentProjectId,
          name: currentProjectName || 'Untitled Project',
          tracks: tracks.map(track => ({
            ...track,
            buffer: null // Don't save buffer in project data
          })),
          settings: {
            zoom,
            masterVolume,
            bpm,
            isMetronomeOn,
            projectDuration,
            armedTrackId,
            recordingTrackId
          },
          created: existingProject?.created || Date.now(),
          updated: Date.now()
        };
        db.saveProject(projectData);
      });
    }
  }, [tracks, zoom, masterVolume, bpm, isMetronomeOn, projectDuration, armedTrackId, recordingTrackId, currentProjectName, isReady, db, currentProjectId]);

  // Load last project on startup
  React.useEffect(() => {
    if (isReady) {
      // First load projects list
      db.getAllProjects().then(projectList => {
        setProjects(projectList);
        
        // Try to load last project ID from localStorage
        const lastProjectId = localStorage.getItem('multitracker-last-project');
        if (lastProjectId && projectList.find(p => p.id === lastProjectId)) {
          setCurrentProjectId(lastProjectId);
          setShowProjectSelector(false);
        }
      });
    }
  }, [isReady, db]);

  // Load project data when project is selected
  React.useEffect(() => {
    if (isReady && currentProjectId) {
      db.loadProject(currentProjectId).then(project => {
        if (project) {
          setCurrentProjectName(project.name || '');
          setTracks(project.tracks || []);
          
          // Load project settings
          if (project.settings) {
            setZoom(project.settings.zoom || 1);
            setMasterVolume(project.settings.masterVolume || 1);
            setBpm(project.settings.bpm || 120);
            setProjectDuration(project.settings.projectDuration || 60);
            setArmedTrackId(project.settings.armedTrackId || null);
            setRecordingTrackId(project.settings.recordingTrackId || null);
            
            // Apply master volume to audio engine
            audioEngine.setMasterVolume(project.settings.masterVolume || 1);
          }
          
          // Recreate audio engine tracks with their settings
          if (audioEngine.context && project.tracks) {
            project.tracks.forEach(track => {
              const engineTrack = audioEngine.createTrack(track.id);
              if (engineTrack) {
                // Restore track settings
                audioEngine.setTrackVolume(track.id, track.volume || 1);
                if (track.effects) {
                  audioEngine.setTrackEQ(track.id, 'low', track.effects.lowGain || 0);
                  audioEngine.setTrackEQ(track.id, 'mid', track.effects.midGain || 0);
                  audioEngine.setTrackEQ(track.id, 'high', track.effects.highGain || 0);
                }
                engineTrack.muted = track.muted || false;
                engineTrack.solo = track.solo || false;
                audioEngine.updateTrackGain(engineTrack);
              }
            });
          }
        }
      });
    }
  }, [isReady, db, currentProjectId, audioEngine, setBpm]);

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
    if (isReady && tracks.length > 0) {
      tracks.forEach(async track => {
        if (track.hasAudio && !track.buffer) {
          try {
            const blob = await db.loadAudioBlob(track.id);
            if (blob && convertBlobToAudioBuffer && audioEngine.context) {
              const audioBuffer = await convertBlobToAudioBuffer(blob);
              if (audioBuffer) {
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
                }
                setTracks(prev => prev.map(t => 
                  t.id === track.id ? { ...t, buffer: correctBuffer } : t
                ));
              }
            }
          } catch (error) {
            console.error('Failed to load audio for track:', track.id);
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
    setMasterVolume(volume);
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
      audioEngine.updateTrackGain(track);
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
        audioEngine.updateTrackGain(engineTrack);
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
    if (!isInitialized) {
      await initializeAudio();
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      if (armedTrackId) {
        const success = await startRecording();
        if (success) {
          setRecordingTrackId(armedTrackId);
          play();
        } else {
          console.error('Failed to start recording');
        }
      }
    }
  }, [isRecording, startRecording, stopRecording, isInitialized, initializeAudio, armedTrackId, play]);

  // Handle recorded audio
  React.useEffect(() => {
    if (recordedBlob && recordingTrackId) {
      convertBlobToAudioBuffer(recordedBlob).then(async audioBuffer => {
        if (audioBuffer) {
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
            await db.saveAudioBlob(recordingTrackId, recordedBlob);
            setTracks(prev => prev.map(t => 
              t.id === recordingTrackId ? { ...t, buffer: correctBuffer, hasAudio: true } : t
            ));
          } else {
            console.error('Track not found in audio engine:', recordingTrackId);
          }
        } else {
          console.error('Failed to create audio buffer from blob');
        }
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
    const tracksWithAudio = tracks.filter(track => track.buffer);
    if (tracksWithAudio.length === 0) {
      alert('No audio to export');
      return;
    }
    
    const mixedBuffer = FileService.mixTracks(tracks, audioEngine.context, projectDuration);
    FileService.exportAudioBuffer(mixedBuffer, `${currentProjectName || 'mix'}.wav`);
  }, [tracks, audioEngine.context, projectDuration, currentProjectName]);

  const handleProjectSelect = useCallback(async (projectId) => {
    // Update localStorage and close selector first
    localStorage.setItem('multitracker-last-project', projectId);
    setShowProjectSelector(false);
    
    // Clear audio engine tracks
    audioEngine.tracks.forEach((_, trackId) => {
      audioEngine.removeTrack(trackId);
    });
    
    // Set new project ID (this will trigger the load effect)
    setCurrentProjectId(projectId);
    
    if (!audioEngine.context) {
      await initializeAudio();
    }
  }, [initializeAudio, audioEngine]);

  const handleNewProject = useCallback(async () => {
    const projectId = uuidv4();
    const projectName = newProjectName.trim() || `Project ${projects.length + 1}`;
    const newProject = {
      id: projectId,
      name: projectName,
      tracks: [],
      settings: {
        zoom: 1,
        masterVolume: 1,
        bpm: 120,
        isMetronomeOn: false,
        projectDuration: 60,
        armedTrackId: null,
        recordingTrackId: null
      },
      created: Date.now(),
      updated: Date.now()
    };
    await db.saveProject(newProject);
    
    // Reset all state
    setCurrentProjectId(projectId);
    setCurrentProjectName(projectName);
    localStorage.setItem('multitracker-last-project', projectId);
    setTracks([]);
    setZoom(1);
    setMasterVolume(1);
    setBpm(120);
    setProjectDuration(60);
    setArmedTrackId(null);
    setRecordingTrackId(null);
    setNewProjectName('');
    setShowProjectSelector(false);
    
    if (!audioEngine.context) {
      await initializeAudio();
    } else {
      audioEngine.setMasterVolume(1);
    }
  }, [newProjectName, projects.length, db, initializeAudio, audioEngine, setBpm]);

  const handleOpenProjectSelector = useCallback(async () => {
    // Refresh projects list
    const projectList = await db.getAllProjects();
    setProjects(projectList);
    setShowProjectSelector(true);
  }, [db]);

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
              <div className="d-grid gap-3" style={{ minWidth: '350px' }}>
                <div>
                  <Form.Control
                    type="text"
                    placeholder="Project name (optional)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="mb-2"
                  />
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleNewProject}
                    className="w-100"
                  >
                    Create New Project
                  </Button>
                </div>
                
                {projects.length > 0 && (
                  <>
                    <div className="text-center text-muted">
                      <small>— or —</small>
                    </div>
                    <div>
                      <h6 className="mb-2">Open Existing Project:</h6>
                      {projects.map(project => (
                        <Button
                          key={project.id}
                          variant="outline-secondary"
                          onClick={() => handleProjectSelect(project.id)}
                          className="w-100 mb-2 text-start"
                        >
                          <div>
                            <div>{project.name}</div>
                            <small className="text-muted">
                              {new Date(project.updated).toLocaleDateString()}
                            </small>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </>
                )}
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
            <Button variant="outline-secondary" onClick={handleOpenProjectSelector}>
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
              value={masterVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <Row className="flex-grow-1 g-0">
          <Col className="d-flex flex-column">
            {/* Timeline Area */}
            <div className="d-flex">
              <div style={{ minWidth: '300px' }}></div>
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
                  recordingBuffer={isRecording && recordingTrackId === track.id ? recordingBuffer : null}
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
