import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { FaPlay, FaStop } from 'react-icons/fa';

const Metronome = ({ 
  bpm = 120, 
  isPlaying = false, 
  onToggle, 
  onBpmChange 
}) => {
  return (
    <div className="metronome-panel d-flex align-items-center gap-2">
      <Button
        variant={isPlaying ? 'success' : 'outline-secondary'}
        size="sm"
        onClick={onToggle}
      >
        {isPlaying ? <FaStop /> : <FaPlay />}
      </Button>
      
      <Form.Control
        type="number"
        size="sm"
        value={bpm}
        onChange={(e) => onBpmChange(parseInt(e.target.value))}
        min={60}
        max={200}
        style={{ width: '70px' }}
      />
      
      <span className="small text-muted">BPM</span>
    </div>
  );
};

export default Metronome;