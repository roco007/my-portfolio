import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../animations/useReducedMotion';

interface AmbientCanvasProps {
  theme: 'dark' | 'light';
}

export const AmbientCanvas: React.FC<AmbientCanvasProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      drawGrid();
    };

    window.addEventListener('resize', handleResize);

    const isLight = theme === 'light';
    const dotColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
    const crossColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)';

    // Subtle Anime.js technical grid with crosshairs
    const drawGrid = () => {
      ctx.clearRect(0, 0, width, height);
      const spacing = 48;

      for (let x = spacing; x < width; x += spacing) {
        for (let y = spacing; y < height; y += spacing) {
          // Crosshairs every 4th grid point
          const isMajor = (x / spacing) % 4 === 0 && (y / spacing) % 4 === 0;

          if (isMajor) {
            ctx.strokeStyle = crossColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 3, y);
            ctx.lineTo(x + 3, y);
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x, y + 3);
            ctx.stroke();
          } else {
            ctx.fillStyle = dotColor;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    };

    drawGrid();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, reducedMotion]);

  return (
    <div
      className="ambient-canvas-wrapper"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
