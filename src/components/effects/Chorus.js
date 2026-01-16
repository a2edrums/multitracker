import React from 'react';
import { Form } from 'react-bootstrap';
import VerticalSlider from '../tracks/VerticalSlider.js';

const Chorus = ({ enabled, depth, rate, mix, onEnabledChange, onDepthChange, onRateChange, onMixChange }) => {
  return (
    <div className="chorus-controls p-2">
      <div className="d-flex flex-column align-items-center">
        <div className="d-flex justify-content-between align-items-center mb-2 w-100">
          <h6 className="mb-0 small">Chorus</h6>
          <Form.Check 
            type="switch"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
        </div>
        <div className="d-flex gap-2">
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Depth</small>
            <VerticalSlider value={depth} onChange={onDepthChange} min={0} max={1} step={0.01} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{depth.toFixed(2)}</small>
          </div>
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Rate</small>
            <VerticalSlider value={rate} onChange={onRateChange} min={0.1} max={5} step={0.1} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{rate.toFixed(1)}Hz</small>
          </div>
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

export default Chorus;
