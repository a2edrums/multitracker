import React, { useState } from 'react';
import { Button, Form, Collapse } from 'react-bootstrap';
import { FaVolumeUp, FaMicrophone, FaTrash, FaSlidersH } from 'react-icons/fa';
import WaveformDisplay from './WaveformDisplay.js';
import VUMeter from '../common/VUMeter.js';
import EQ from '../effects/EQ.js';

const Track = ({ 
  track, 
  onVolumeChange, 
  onNameChange,
  onMute, 
  onSolo, 
  onDelete,
  onRecord,
  onEQChange,
  isRecording = false,
  isArmed = false,
  currentTime = 0,
  audioEngine,
  inputNode,
  recordingBuffer,
  zoom = 1,
  projectDuration = 60
}) => {
  const [showEQ, setShowEQ] = useState(false);
  
  const vuAudioNode = React.useMemo(() => {
    return inputNode || audioEngine?.tracks?.get(track.id)?.vuGain;
  }, [inputNode, audioEngine, track.id]);
  
  return (
    <div className="studio-track">
      <div className="d-flex align-items-stretch p-2">
        <div className="track-controls d-flex" style={{ minWidth: '200px' }}>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-2">
              <Button
                variant={isArmed ? 'danger' : isRecording ? 'danger' : 'outline-danger'}
                size="sm"
                className="me-2"
                onClick={() => onRecord(track.id)}
              >
                <FaMicrophone className={isArmed || isRecording ? 'text-white' : ''} />
              </Button>
              
              <div className="track-name flex-grow-1">
                <Form.Control
                  type="text"
                  size="sm"
                  defaultValue={track.name || `Track ${track.id}`}
                  className="bg-dark text-light border-secondary"
                  onBlur={(e) => onNameChange(track.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="volume-control d-flex align-items-center mb-2">
              <FaVolumeUp className="me-2" />
              <Form.Range
                min={0}
                max={1}
                step={0.01}
                value={track.volume || 1}
                onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                style={{ width: '100px' }}
              />
            </div>
            
            <div className="d-flex gap-1">
              <Button
                variant={track.muted ? 'warning' : 'outline-secondary'}
                size="sm"
                onClick={() => onMute(track.id)}
              >
                M
              </Button>
              
              <Button
                variant={track.solo ? 'success' : 'outline-secondary'}
                size="sm"
                onClick={() => onSolo(track.id)}
              >
                S
              </Button>
              
              <Button
                variant={showEQ ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setShowEQ(!showEQ)}
              >
                <FaSlidersH />
              </Button>
              
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete(track.id)}
              >
                <FaTrash />
              </Button>
            </div>
          </div>
          
          <div className="vu-meter ms-2">
            <VUMeter 
              key={`${track.id}-${isRecording ? 'recording' : 'playback'}`}
              audioNode={vuAudioNode}
              width={10}
              height={100}
            />
          </div>
        </div>
        
        <div className="track-content flex-grow-1 ms-2" style={{ height: '100px' }}>
          {isRecording ? (
            <div className="flex-grow-1" style={{ height: '100px' }}>
              <WaveformDisplay 
                audioBuffer={recordingBuffer}
                width={600}
                height={100}
                currentTime={currentTime}
                duration={projectDuration}
                zoom={zoom}
                color="#dc3545"
              />
            </div>
          ) : (track.buffer && track.hasAudio) || track.buffer ? (
            <div className="flex-grow-1" style={{ height: '100px' }}>
              <WaveformDisplay 
                audioBuffer={track.buffer}
                width={600}
                height={100}
                currentTime={currentTime}
                duration={projectDuration}
                zoom={zoom}
                color="#0d6efd"
              />
            </div>
          ) : (
            <div className="empty-track d-flex align-items-center justify-content-center h-100 text-muted" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
              Empty Track
            </div>
          )}
        </div>
      </div>
      
      <Collapse in={showEQ}>
        <div>
          <EQ
            lowGain={track.effects?.lowGain || 0}
            midGain={track.effects?.midGain || 0}
            highGain={track.effects?.highGain || 0}
            onLowChange={(gain) => onEQChange(track.id, 'low', gain)}
            onMidChange={(gain) => onEQChange(track.id, 'mid', gain)}
            onHighChange={(gain) => onEQChange(track.id, 'high', gain)}
          />
        </div>
      </Collapse>
    </div>
  );
};

export default Track;