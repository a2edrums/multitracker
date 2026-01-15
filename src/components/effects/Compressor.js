import React from 'react';
import { Form } from 'react-bootstrap';

const Compressor = ({ enabled, threshold, ratio, attack, release, onEnabledChange, onThresholdChange, onRatioChange, onAttackChange, onReleaseChange }) => {
  return (
    <div className="compressor-controls p-2 bg-dark border-top">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Compressor</h6>
        <Form.Check 
          type="switch"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
      </div>
      <div className="d-flex gap-3 mb-2">
        <div className="flex-fill">
          <Form.Label className="small">Threshold</Form.Label>
          <Form.Range
            min={-100}
            max={0}
            step={1}
            value={threshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{threshold}dB</small>
        </div>
        <div className="flex-fill">
          <Form.Label className="small">Ratio</Form.Label>
          <Form.Range
            min={1}
            max={20}
            step={0.5}
            value={ratio}
            onChange={(e) => onRatioChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{ratio}:1</small>
        </div>
      </div>
      <div className="d-flex gap-3">
        <div className="flex-fill">
          <Form.Label className="small">Attack</Form.Label>
          <Form.Range
            min={0}
            max={1}
            step={0.001}
            value={attack}
            onChange={(e) => onAttackChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{(attack * 1000).toFixed(0)}ms</small>
        </div>
        <div className="flex-fill">
          <Form.Label className="small">Release</Form.Label>
          <Form.Range
            min={0}
            max={1}
            step={0.01}
            value={release}
            onChange={(e) => onReleaseChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{(release * 1000).toFixed(0)}ms</small>
        </div>
      </div>
    </div>
  );
};

export default Compressor;
