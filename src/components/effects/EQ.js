import React from 'react';
import { Form } from 'react-bootstrap';

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
    <div className="eq-panel studio-panel p-2 mb-0">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">EQ</h6>
        <Form.Check 
          type="switch"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
      </div>
      <div className="d-flex gap-3">
        <div className="flex-fill">
          <Form.Label className="small">Low</Form.Label>
          <Form.Range
            min={-12}
            max={12}
            step={0.5}
            value={lowGain}
            onChange={(e) => onLowChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{lowGain}dB</small>
        </div>
        <div className="flex-fill">
          <Form.Label className="small">Mid</Form.Label>
          <Form.Range
            min={-12}
            max={12}
            step={0.5}
            value={midGain}
            onChange={(e) => onMidChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{midGain}dB</small>
        </div>
        <div className="flex-fill">
          <Form.Label className="small">High</Form.Label>
          <Form.Range
            min={-12}
            max={12}
            step={0.5}
            value={highGain}
            onChange={(e) => onHighChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{highGain}dB</small>
        </div>
      </div>
    </div>
  );
};

export default EQ;