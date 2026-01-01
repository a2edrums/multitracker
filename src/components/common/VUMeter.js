import React, { useRef, useEffect } from 'react';

const VUMeter = ({ 
  audioNode, 
  width = 20, 
  height = 60, 
  orientation = 'vertical' 
}) => {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!audioNode || !audioNode.context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any existing animation first
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Disconnect existing analyser if any
    if (analyserRef.current) {
      try {
        audioNode.disconnect(analyserRef.current);
      } catch (e) {}
    }

    const ctx = canvas.getContext('2d');
    const analyser = audioNode.context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    
    audioNode.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let active = true;

    const draw = () => {
      if (!active) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const level = rms / 255;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      const barHeight = level * height;
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(0.7, '#ffff00');
      gradient.addColorStop(1, '#ff0000');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(2, height - barHeight, width - 4, barHeight);
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      active = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (analyserRef.current) {
        try {
          audioNode.disconnect(analyserRef.current);
        } catch (e) {}
      }
    };
  }, [audioNode, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        border: '1px solid #444',
        backgroundColor: '#1a1a1a'
      }}
    />
  );
};

export default VUMeter;