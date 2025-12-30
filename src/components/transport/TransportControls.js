import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FaPlay, FaPause, FaStop, FaCircle } from 'react-icons/fa';
import { formatTime } from '../../utils/timeUtils.js';
import Metronome from './Metronome.js';

const TransportControls = ({ 
  isPlaying, 
  currentTime, 
  onPlay, 
  onPause, 
  onStop, 
  onRecord,
  isRecording = false,
  // Metronome props
  bpm = 120,
  isMetronomeOn = false,
  onMetronomeToggle,
  onBpmChange
}) => {
  return (
    <div className="studio-transport d-flex align-items-center justify-content-between">
      <ButtonGroup>
        <Button
          variant="outline-light"
          className="studio-button btn-record"
          onClick={onRecord}
          disabled={isPlaying}
        >
          <FaCircle className={isRecording ? 'text-danger' : ''} />
        </Button>
        
        <Button
          variant="outline-light"
          className="studio-button btn-play"
          onClick={isPlaying ? onPause : onPlay}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </Button>
        
        <Button
          variant="outline-light"
          className="studio-button"
          onClick={onStop}
        >
          <FaStop />
        </Button>
      </ButtonGroup>
      
      <div className="time-display">
        <span className="h5 mb-0">{formatTime(currentTime)}</span>
      </div>
      
      <Metronome
        bpm={bpm}
        isPlaying={isMetronomeOn}
        onToggle={onMetronomeToggle}
        onBpmChange={onBpmChange}
      />
    </div>
  );
};

export default TransportControls;