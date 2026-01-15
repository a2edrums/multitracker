import React from 'react';
import { Form } from 'react-bootstrap';

const Chorus = ({ enabled, depth, rate, mix, onEnabledChange, onDepthChange, onRateChange, onMixChange }) => {
  return (
    <div className="chorus-controls p-2 bg-dark border-top">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Chorus</h6>
        <Form.Check 
          type="switch"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
      </div>
      <div className="d-flex gap-3">
        <div className="flex-fill">
          <Form.Label className="small">Depth</Form.Label>
          <Form.Range
            min={0}
            max={1}
            step={0.01}
            value={depth}
            onChange={(e) => onDepthChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{depth.toFixed(2)}</small>
        </div>
        <div className="flex-fill">
          <Form.Label className="small">Rate</Form.Label>
          <Form.Range
            min={0.1}
            max={5}
            step={0.1}
            value={rate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{rate.toFixed(1)}Hz</small>
        </div>
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

export default Chorus;
