import React, { useRef, useEffect } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { formatTime } from '../../utils/timeUtils.js';

const Timeline = ({ 
  currentTime = 0, 
  duration = 60, 
  zoom = 1, 
  onSeek,
  onZoomIn,
  onZoomOut,
  isPlaying = false 
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = 40 * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, rect.width, 40);
    
    // Draw time ruler
    drawTimeRuler(ctx, rect.width, duration, zoom);
    
    // Draw playhead
    if (currentTime >= 0) {
      drawPlayhead(ctx, rect.width, currentTime, duration);
    }
  }, [currentTime, duration, zoom]);

  const drawTimeRuler = (ctx, width, totalDuration, zoomLevel) => {
    const pixelsPerSecond = (width / totalDuration) * zoomLevel;
    const majorInterval = pixelsPerSecond >= 100 ? 1 : pixelsPerSecond >= 50 ? 2 : 5;
    
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#b0b0b0';
    ctx.font = '10px monospace';
    
    for (let time = 0; time <= totalDuration; time += majorInterval) {
      const x = (time / totalDuration) * width;
      
      // Only draw if there's enough space from previous label
      const shouldDrawLabel = time === 0 || x > 60; // 60px minimum spacing
      
      // Major tick
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 40);
      ctx.stroke();
      
      // Time label with spacing check
      if (shouldDrawLabel) {
        ctx.fillText(formatTime(time), x + 2, 15);
      }
      
      // Minor ticks
      if (majorInterval > 1) {
        for (let minor = 1; minor < majorInterval; minor++) {
          const minorTime = time + minor;
          if (minorTime <= totalDuration) {
            const minorX = (minorTime / totalDuration) * width;
            ctx.beginPath();
            ctx.moveTo(minorX, 30);
            ctx.lineTo(minorX, 40);
            ctx.stroke();
          }
        }
      }
    }
  };

  const drawPlayhead = (ctx, width, time, totalDuration) => {
    const x = (time / totalDuration) * width;
    
    ctx.strokeStyle = '#0d6efd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 40);
    ctx.stroke();
    
    // Playhead triangle
    ctx.fillStyle = '#0d6efd';
    ctx.beginPath();
    ctx.moveTo(x - 6, 0);
    ctx.lineTo(x + 6, 0);
    ctx.lineTo(x, 10);
    ctx.closePath();
    ctx.fill();
  };

  const handleClick = (e) => {
    if (!onSeek) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, clickTime)));
  };

  return (
    <div className="timeline-container" style={{ height: '60px', position: 'relative' }}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div className="timeline-info small text-muted">
          Time: {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={onZoomOut}>
            <FaSearchMinus />
          </Button>
          <Button variant="outline-secondary" onClick={onZoomIn}>
            <FaSearchPlus />
          </Button>
        </ButtonGroup>
      </div>
      <canvas
        ref={canvasRef}
        className="timeline-canvas"
        style={{ 
          width: '100%', 
          height: '40px', 
          cursor: 'pointer',
          backgroundColor: '#2d2d2d'
        }}
        onClick={handleClick}
      />
    </div>
  );
};

export default Timeline;