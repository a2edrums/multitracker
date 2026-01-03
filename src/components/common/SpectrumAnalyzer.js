import React, { useRef, useEffect } from 'react';

const SpectrumAnalyzer = ({ 
  audioNode, 
  width = 120, 
  height = 40,
  bars = 16
}) => {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!audioNode || !audioNode.context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Disconnect existing analyser
    if (analyserRef.current) {
      try {
        audioNode.disconnect(analyserRef.current);
      } catch (e) {}
    }

    const ctx = canvas.getContext('2d');
    const analyser = audioNode.context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    
    audioNode.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const barWidth = width / bars;
    let active = true;

    const draw = () => {
      if (!active) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Group frequency bins into bars
      const binSize = Math.floor(dataArray.length / bars);
      
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        const startBin = i * binSize;
        const endBin = Math.min(startBin + binSize, dataArray.length);
        
        for (let j = startBin; j < endBin; j++) {
          sum += dataArray[j];
        }
        
        const average = sum / (endBin - startBin);
        const barHeight = (average / 255) * height;
        
        // Color gradient based on frequency
        const hue = (i / bars) * 240; // Blue to red spectrum
        ctx.fillStyle = `hsl(${240 - hue}, 70%, 50%)`;
        
        const x = i * barWidth;
        ctx.fillRect(x + 1, height - barHeight, barWidth - 2, barHeight);
      }
      
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
  }, [audioNode, width, height, bars]);

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

export default SpectrumAnalyzer;