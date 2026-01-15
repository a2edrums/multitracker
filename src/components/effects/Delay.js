import React from 'react';
import { Form } from 'react-bootstrap';

const Delay = ({ enabled, time, feedback, mix, onEnabledChange, onTimeChange, onFeedbackChange, onMixChange }) => {
  return (
    <div className="delay-controls p-2 bg-dark border-top">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Delay</h6>
        <Form.Check 
          type="switch"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
      </div>
      <div className="d-flex gap-3">
        <div className="flex-fill">
          <Form.Label className="small">Time</Form.Label>
          <Form.Range
            min={0.01}
            max={2}
            step={0.01}
            value={time}
            onChange={(e) => onTimeChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{time.toFixed(2)}s</small>
        </div>
        <div className="flex-fill">
          <Form.Label className="small">Feedback</Form.Label>
          <Form.Range
            min={0}
            max={0.9}
            step={0.01}
            value={feedback}
            onChange={(e) => onFeedbackChange(parseFloat(e.target.value))}
            disabled={!enabled}
          />
          <small className="text-muted">{feedback.toFixed(2)}</small>
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

export default Delay;
