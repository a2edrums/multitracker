import React from 'react';
import { Form } from 'react-bootstrap';

const Reverb = ({ enabled, mix, onEnabledChange, onMixChange }) => {
  return (
    <div className="reverb-controls p-2 bg-dark border-top">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Reverb</h6>
        <Form.Check 
          type="switch"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
      </div>
      <div className="d-flex gap-3">
        <div className="flex-fill">
          <Form.Label className="small">Mix</Form.Label>
          <Form.Range
            min={0}
            max={1}
            step={0.01}
            value={mix}
            onChange={(e) => onMixChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{mix.toFixed(2)}</small>
        </div>
      </div>
    </div>
  );
};

export default Reverb;
