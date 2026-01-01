import React, { useRef, useEffect } from 'react';

const WaveformDisplay = ({ 
  audioBuffer, 
  width = 400, 
  height = 60,
  currentTime = 0,
  duration = 0,
  zoom = 1,
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
      drawPlayhead(ctx, actualWidth, height, currentTime, duration, zoom);
    }
  }, [audioBuffer, width, height, currentTime, duration, color, zoom]);

  const drawWaveform = (ctx, buffer, canvasWidth, canvasHeight, waveColor) => {
    const data = buffer.getChannelData(0); // Use first channel
    const sampleRate = buffer.sampleRate;
    const bufferDuration = buffer.length / sampleRate;
    
    // Calculate visible duration based on zoom
    const visibleDuration = duration / zoom;
    
    // Calculate how much of the canvas width this audio should occupy
    const audioWidthRatio = bufferDuration / visibleDuration;
    const audioPixelWidth = canvasWidth * audioWidthRatio;
    
    // Only draw if the audio is visible in the current view
    if (audioPixelWidth < 1) return;
    
    const samplesPerPixel = data.length / audioPixelWidth;
    const amp = canvasHeight / 2;
    
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < audioPixelWidth && i < canvasWidth; i++) {
      let min = 1.0;
      let max = -1.0;
      
      const startSample = Math.floor(i * samplesPerPixel);
      const endSample = Math.floor((i + 1) * samplesPerPixel);
      
      for (let j = startSample; j < endSample && j < data.length; j++) {
        const datum = data[j];
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

  const drawPlayhead = (ctx, canvasWidth, canvasHeight, time, totalDuration, zoomLevel = 1) => {
    const visibleDuration = totalDuration / zoomLevel;
    const x = (time / visibleDuration) * canvasWidth;
    
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