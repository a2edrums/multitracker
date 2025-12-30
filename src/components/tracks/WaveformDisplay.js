import React, { useRef, useEffect } from 'react';

const WaveformDisplay = ({ 
  audioBuffer, 
  width = 400, 
  height = 60,
  currentTime = 0,
  duration = 0,
  color = '#0d6efd'
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const actualWidth = rect.width;
    
    // Set canvas size
    canvas.width = actualWidth * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, actualWidth, height);
    
    if (audioBuffer) {
      drawWaveform(ctx, audioBuffer, actualWidth, height, color);
    }
    
    // Draw playhead if playing
    if (currentTime > 0 && duration > 0) {
      drawPlayhead(ctx, actualWidth, height, currentTime, duration);
    }
  }, [audioBuffer, width, height, currentTime, duration, color]);

  const drawWaveform = (ctx, buffer, canvasWidth, canvasHeight, waveColor) => {
    const data = buffer.getChannelData(0); // Use first channel
    const step = Math.ceil(data.length / canvasWidth);
    const amp = canvasHeight / 2;
    
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < canvasWidth; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      const x = i;
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;
      
      if (i === 0) {
        ctx.moveTo(x, yMin);
      } else {
        ctx.lineTo(x, yMin);
      }
      
      if (yMin !== yMax) {
        ctx.lineTo(x, yMax);
      }
    }
    
    ctx.stroke();
    
    // Fill waveform
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = waveColor;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  };

  const drawPlayhead = (ctx, canvasWidth, canvasHeight, time, totalDuration) => {
    const x = (time / totalDuration) * canvasWidth;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ 
        width: '100%', 
        height: `${height}px`,
        backgroundColor: '#2a2a2a',
        border: '1px solid #444'
      }}
    />
  );
};

export default WaveformDisplay;