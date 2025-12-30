import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const EQ = ({ 
  lowGain = 0, 
  midGain = 0, 
  highGain = 0, 
  onLowChange, 
  onMidChange, 
  onHighChange 
}) => {
  return (
    <div className="eq-panel studio-panel p-2 mb-2">
      <h6 className="mb-2">EQ</h6>
      <Row className="g-2">
        <Col xs={4}>
          <Form.Label className="small">Low</Form.Label>
          <Form.Range
            min={-12}
            max={12}
            step={0.5}
            value={lowGain}
            onChange={(e) => onLowChange(parseFloat(e.target.value))}
          />
          <div className="text-center small">{lowGain}dB</div>
        </Col>
        <Col xs={4}>
          <Form.Label className="small">Mid</Form.Label>
          <Form.Range
            min={-12}
            max={12}
            step={0.5}
            value={midGain}
            onChange={(e) => onMidChange(parseFloat(e.target.value))}
          />
          <div className="text-center small">{midGain}dB</div>
        </Col>
        <Col xs={4}>
          <Form.Label className="small">High</Form.Label>
          <Form.Range
            min={-12}
            max={12}
            step={0.5}
            value={highGain}
            onChange={(e) => onHighChange(parseFloat(e.target.value))}
          />
          <div className="text-center small">{highGain}dB</div>
        </Col>
      </Row>
    </div>
  );
};

export default EQ;