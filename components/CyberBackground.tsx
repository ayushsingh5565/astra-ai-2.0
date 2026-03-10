
import React, { useEffect, useRef } from 'react';
import { AstraMode } from '../types';

interface CyberBackgroundProps {
  mode: AstraMode;
  isProcessing?: boolean;
  pulseTrigger?: number;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({ mode, isProcessing, pulseTrigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<number>(0);

  useEffect(() => {
    if (pulseTrigger) {
      pulseRef.current = 1.0; // Reset pulse intensity
    }
  }, [pulseTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const baseColor = mode === 'skull' ? '239, 68, 68' : (mode === 'root' ? '34, 197, 94' : '0, 240, 255');
      
      // Draw Grid
      ctx.strokeStyle = `rgba(${baseColor}, ${0.03 + (pulseRef.current * 0.05)})`;
      ctx.lineWidth = 1;
      const gridSize = 60;
      
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Floating Data Particles (Optimized)
      const time = Date.now() * 0.0005;
      ctx.fillStyle = `rgba(${baseColor}, 0.1)`;
      for (let i = 0; i < 15; i++) {
        const x = ((Math.sin(time + i * 1.5) * 0.5 + 0.5) * width);
        const y = ((Math.cos(time * 0.8 + i) * 0.5 + 0.5) * height);
        const size = 2;
        
        ctx.fillRect(x, y, size, size);
        
        // Subtle scanline effect
        if (i % 5 === 0) {
          ctx.fillStyle = `rgba(${baseColor}, 0.02)`;
          ctx.fillRect(0, y, width, 1);
          ctx.fillStyle = `rgba(${baseColor}, 0.1)`;
        }
      }

      // Pulse fade
      if (pulseRef.current > 0) {
        pulseRef.current *= 0.95;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, isProcessing]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none opacity-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
