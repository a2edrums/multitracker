import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { FaPlus, FaFileImport, FaDownload, FaFolderOpen } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { useAudioContext } from './hooks/useAudioContext.js';
import { useIndexedDB } from './hooks/useIndexedDB.js';
import { useAudioRecording } from './hooks/useAudioRecording.js';
import { useAudioDevices } from './hooks/useAudioDevices.js';
import { useMetronome } from './hooks/useMetronome.js';
import TransportControls from './components/transport/TransportControls.js';
import Timeline from './components/transport/Timeline.js';
import Track from './components/tracks/Track.js';
import VUMeter from './components/common/VUMeter.js';
import SpectrumAnalyzer from './components/common/SpectrumAnalyzer.js';
import FileService from './services/FileService.js';
import { RECORDING_CONFIG } from './utils/constants.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';

function App() {
  const { isInitialized, needsUserActivation, initializeAudio, isPlaying, currentTime, play, pause, stop, audioEngine } = useAudioContext();
  const { isReady, db } = useIndexedDB();
  const { isRecording, startRecording, stopRecording, convertBlobToAudioBuffer, recordingBuffer, isMonitoring, startMonitoring, stopMonitoring, getRecordingNodeForTrack } = useAudioRecording(audioEngine.context);
  const { isMetronomeOn, bpm, setBpm, toggleMetronome } = useMetronome(audioEngine.context);
  const { devices } = useAudioDevices();
  const [tracks, setTracks] = useState([]);
  const [recordingTrackId, setRecordingTrackId] = useState(null);
  const [recordingError, setRecordingError] = useState(null);
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
            recordingTrackId
          },
          created: existingProject?.created || Date.now(),
          updated: Date.now()
        };
        db.saveProject(projectData);
      });
    }
  }, [tracks, zoom, masterVolume, bpm, isMetronomeOn, projectDuration, recordingTrackId, currentProjectName, isReady, db, currentProjectId]);

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
      pan: 0,
      muted: false,
      solo: false,
      buffer: null,
      hasAudio: false,
      isArmed: false,
      inputDeviceId: null,
      channelAssignment: RECORDING_CONFIG.DEFAULT_CHANNEL_ASSIGNMENT,
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

  const handleChorusChange = useCallback((trackId, param, value) => {
    audioEngine.setTrackChorus(trackId, param, value);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? {
        ...track,
        effects: {
          ...track.effects,
          [`chorus${param.charAt(0).toUpperCase() + param.slice(1)}`]: value
        }
      } : track
    ));
  }, [audioEngine]);

  const handleDelayChange = useCallback((trackId, param, value) => {
    audioEngine.setTrackDelay(trackId, param, value);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? {
        ...track,
        effects: {
          ...track.effects,
          [`delay${param.charAt(0).toUpperCase() + param.slice(1)}`]: value
        }
      } : track
    ));
  }, [audioEngine]);

  const handleReverbChange = useCallback((trackId, param, value) => {
    audioEngine.setTrackReverb(trackId, param, value);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? {
        ...track,
        effects: {
          ...track.effects,
          [`reverb${param.charAt(0).toUpperCase() + param.slice(1)}`]: value
        }
      } : track
    ));
  }, [audioEngine]);

  const handleCompressorChange = useCallback((trackId, param, value) => {
    audioEngine.setTrackCompressor(trackId, param, value);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? {
        ...track,
        effects: {
          ...track.effects,
          [`compressor${param.charAt(0).toUpperCase() + param.slice(1)}`]: value
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
    setTracks(prev => {
      const track = prev.find(t => t.id === trackId);
      if (!track) return prev;

      // If already armed, disarm it
      if (track.isArmed) {
        setRecordingError(null);
        return prev.map(t => t.id === trackId ? { ...t, isArmed: false } : t);
      }

      // Check max armed limit
      const armedCount = prev.filter(t => t.isArmed).length;
      if (armedCount >= RECORDING_CONFIG.MAX_ARMED_TRACKS) {
        setRecordingError(`Maximum ${RECORDING_CONFIG.MAX_ARMED_TRACKS} tracks can be armed simultaneously.`);
        return prev;
      }

      setRecordingError(null);
      return prev.map(t => t.id === trackId ? { ...t, isArmed: true } : t);
    });
  }, []);

  const handleInputDeviceChange = useCallback((trackId, deviceId) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, inputDeviceId: deviceId } : t
    ));
  }, []);

  const handleChannelAssignmentChange = useCallback((trackId, assignment) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, channelAssignment: assignment } : t
    ));
  }, []);

  const handlePanChange = useCallback((trackId, value) => {
    audioEngine.setTrackPan(trackId, value);
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, pan: value } : t
    ));
  }, [audioEngine]);

  const handleMonitorToggle = useCallback(async () => {
    if (!isInitialized) {
      await initializeAudio();
    }
    
    if (isMonitoring) {
      stopMonitoring();
    } else {
      await startMonitoring();
    }
  }, [isMonitoring, startMonitoring, stopMonitoring, isInitialized, initializeAudio]);

  const handleStop = useCallback(async () => {
    if (isRecording) {
      const bufferMap = await stopRecording();
      // Process recorded buffers on stop as well
      if (bufferMap && bufferMap.size > 0) {
        for (const [trackId, buffer] of bufferMap) {
          const engineTrack = audioEngine.tracks.get(trackId);
          if (engineTrack) {
            engineTrack.buffer = buffer;
            const channelData = buffer.getChannelData(0);
            const blob = new Blob([channelData.buffer], { type: 'audio/wav' });
            await db.saveAudioBlob(trackId, blob);
          }
        }
        setTracks(prev => prev.map(t => {
          const buf = bufferMap.get(t.id);
          return buf ? { ...t, buffer: buf, hasAudio: true } : t;
        }));
      }
      setRecordingTrackId(null);
    }
    stop();
  }, [isRecording, stopRecording, stop, audioEngine, db]);

  const handleRecord = useCallback(async () => {
    if (!isInitialized) {
      await initializeAudio();
    }
    
    if (isRecording) {
      const bufferMap = await stopRecording();
      // Process Map<trackId, AudioBuffer> — assign mono buffers to each track
      if (bufferMap && bufferMap.size > 0) {
        for (const [trackId, buffer] of bufferMap) {
          const engineTrack = audioEngine.tracks.get(trackId);
          if (engineTrack) {
            engineTrack.buffer = buffer;
            // Save audio blob to IndexedDB
            const channelData = buffer.getChannelData(0);
            const blob = new Blob([channelData.buffer], { type: 'audio/wav' });
            await db.saveAudioBlob(trackId, blob);
          }
        }
        setTracks(prev => prev.map(t => {
          const buf = bufferMap.get(t.id);
          return buf ? { ...t, buffer: buf, hasAudio: true } : t;
        }));
      }
      setRecordingTrackId(null);
    } else {
      // Get armed tracks
      const armedTracks = tracks.filter(t => t.isArmed);
      if (armedTracks.length === 0) {
        setRecordingError('Arm at least one track to record');
        return;
      }

      // Build descriptors for the recording engine
      const descriptors = armedTracks.map(t => ({
        id: t.id,
        inputDeviceId: t.inputDeviceId,
        channelAssignment: t.channelAssignment
      }));

      const success = await startRecording(descriptors);
      if (success) {
        setRecordingTrackId('multi');
        setRecordingError(null);
        play();
      } else {
        setRecordingError('Failed to start recording');
      }
    }
  }, [isRecording, startRecording, stopRecording, isInitialized, initializeAudio, tracks, play, audioEngine, db]);

  const handleFileImport = useCallback(() => {
    const input = FileService.createFileInput(async (file) => {
      try {
        const trackDescriptors = await FileService.importAudioFile(file, audioEngine.context);
        const baseName = file.name.replace(/\.[^/.]+$/, "");

        const newTracks = [];
        for (const descriptor of trackDescriptors) {
          const trackId = uuidv4();
          const trackName = `${baseName}${descriptor.nameSuffix || ''}`;
          const newTrack = {
            id: trackId,
            name: trackName,
            volume: 1,
            pan: descriptor.pan,
            muted: false,
            solo: false,
            buffer: descriptor.buffer,
            hasAudio: true,
            isArmed: false,
            inputDeviceId: null,
            channelAssignment: RECORDING_CONFIG.DEFAULT_CHANNEL_ASSIGNMENT,
            effects: {
              lowGain: 0,
              midGain: 0,
              highGain: 0
            }
          };

          const engineTrack = audioEngine.createTrack(trackId);
          engineTrack.buffer = descriptor.buffer;
          audioEngine.setTrackPan(trackId, descriptor.pan);

          // Save imported audio to IndexedDB
          const channelData = descriptor.buffer.getChannelData(0);
          const blob = new Blob([channelData.buffer], { type: 'audio/wav' });
          await db.saveAudioBlob(trackId, blob);

          newTracks.push(newTrack);
        }

        setTracks(prev => [...prev, ...newTracks]);
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
                  onPanChange={handlePanChange}
                  onNameChange={handleTrackNameChange}
                  onMute={handleMute}
                  onSolo={handleSolo}
                  onDelete={deleteTrack}
                  onArm={handleTrackArm}
                  onEQChange={handleEQChange}
                  onChorusChange={handleChorusChange}
                  onDelayChange={handleDelayChange}
                  onReverbChange={handleReverbChange}
                  onCompressorChange={handleCompressorChange}
                  isRecording={isRecording && track.isArmed}
                  isArmed={track.isArmed}
                  currentTime={currentTime}
                  audioEngine={audioEngine}
                  inputNode={isRecording && track.isArmed ? getRecordingNodeForTrack(track.id) : null}
                  recordingBuffer={isRecording && track.isArmed ? recordingBuffer : null}
                  zoom={zoom}
                  projectDuration={projectDuration}
                  availableDevices={devices}
                  inputDeviceId={track.inputDeviceId}
                  channelAssignment={track.channelAssignment}
                  onInputDeviceChange={handleInputDeviceChange}
                  onChannelAssignmentChange={handleChannelAssignmentChange}
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
          isMonitoring={isMonitoring}
          onMonitorToggle={handleMonitorToggle}
          armedTrackCount={tracks.filter(t => t.isArmed).length}
          onRecordError={setRecordingError}
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
