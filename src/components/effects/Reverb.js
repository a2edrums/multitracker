import React from 'react';
import { Form } from 'react-bootstrap';
import VerticalSlider from '../tracks/VerticalSlider.js';

const Reverb = ({ enabled, mix, onEnabledChange, onMixChange }) => {
  return (
    <div className="reverb-controls p-2">
      <div className="d-flex flex-column align-items-center">
        <div className="d-flex justify-content-between align-items-center mb-2 w-100">
          <h6 className="mb-0 small">Reverb</h6>
          <Form.Check 
            type="switch"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
        </div>
        <div className="d-flex gap-2">
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Mix</small>
            <VerticalSlider value={mix} onChange={onMixChange} min={0} max={1} step={0.01} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{mix.toFixed(2)}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reverb;
