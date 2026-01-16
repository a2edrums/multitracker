import React from 'react';
import { Form } from 'react-bootstrap';
import VerticalSlider from '../tracks/VerticalSlider.js';

const EQ = ({ 
  enabled = true,
  lowGain = 0, 
  midGain = 0, 
  highGain = 0,
  onEnabledChange, 
  onLowChange, 
  onMidChange, 
  onHighChange 
}) => {
  return (
    <div className="eq-panel p-2">
      <div className="d-flex flex-column align-items-center">
        <div className="d-flex justify-content-between align-items-center mb-2 w-100">
          <h6 className="mb-0 small">EQ</h6>
          <Form.Check 
            type="switch"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
        </div>
        <div className="d-flex gap-2">
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Low</small>
            <VerticalSlider value={lowGain} onChange={onLowChange} min={-12} max={12} step={0.5} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{lowGain}dB</small>
          </div>
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Mid</small>
            <VerticalSlider value={midGain} onChange={onMidChange} min={-12} max={12} step={0.5} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{midGain}dB</small>
          </div>
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>High</small>
            <VerticalSlider value={highGain} onChange={onHighChange} min={-12} max={12} step={0.5} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{highGain}dB</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EQ;