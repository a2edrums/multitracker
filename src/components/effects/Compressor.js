import React from 'react';
import { Form } from 'react-bootstrap';
import VerticalSlider from '../tracks/VerticalSlider.js';

const Compressor = ({ enabled, threshold, ratio, attack, release, onEnabledChange, onThresholdChange, onRatioChange, onAttackChange, onReleaseChange }) => {
  return (
    <div className="compressor-controls p-2">
      <div className="d-flex flex-column align-items-center">
        <div className="d-flex justify-content-between align-items-center mb-2 w-100">
          <h6 className="mb-0 small">Comp</h6>
          <Form.Check 
            type="switch"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
        </div>
        <div className="d-flex gap-2">
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Thrs</small>
            <VerticalSlider value={threshold} onChange={onThresholdChange} min={-100} max={0} step={1} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{threshold}dB</small>
          </div>
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Ratio</small>
            <VerticalSlider value={ratio} onChange={onRatioChange} min={1} max={20} step={0.5} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{ratio}:1</small>
          </div>
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Atk</small>
            <VerticalSlider value={attack} onChange={onAttackChange} min={0} max={1} step={0.001} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{(attack * 1000).toFixed(0)}ms</small>
          </div>
          <div className="d-flex flex-column align-items-center">
            <small className="mb-1" style={{ fontSize: '10px' }}>Rel</small>
            <VerticalSlider value={release} onChange={onReleaseChange} min={0} max={1} step={0.01} disabled={!enabled} />
            <small className="text-muted" style={{ fontSize: '10px' }}>{(release * 1000).toFixed(0)}ms</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compressor;
