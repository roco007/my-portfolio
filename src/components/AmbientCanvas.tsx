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
    let scrollY = window.scrollY;
    let targetScrollY = window.scrollY;
    let animFrameId: number;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const isLight = theme === 'light';
    const dotColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
    const crossColor = isLight ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.07)';
    const laserGlow = isLight
      ? 'rgba(255, 75, 75, 0.08)'
      : 'rgba(0, 255, 170, 0.08)';

    const render = () => {
      // Smooth interpolation for scroll-driven parallax
      scrollY += (targetScrollY - scrollY) * 0.12;

      ctx.clearRect(0, 0, width, height);
      const spacing = 48;
      const offsetY = (scrollY * 0.2) % spacing;

      // 1. Draw futuristic coordinate grid with scroll parallax
      for (let x = spacing; x < width; x += spacing) {
        for (let y = spacing; y < height + spacing; y += spacing) {
          const drawY = y - offsetY;
          const isMajor = (x / spacing) % 4 === 0 && Math.floor((y + scrollY * 0.2) / spacing) % 4 === 0;

          if (isMajor) {
            ctx.strokeStyle = crossColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 3, drawY);
            ctx.lineTo(x + 3, drawY);
            ctx.moveTo(x, drawY - 3);
            ctx.lineTo(x, drawY + 3);
            ctx.stroke();
          } else {
            ctx.fillStyle = dotColor;
            ctx.fillRect(x, drawY, 1, 1);
          }
        }
      }

      // 2. Futuristic horizontal laser sweep across the canvas on scroll
      if (!reducedMotion) {
        const sweepY = (scrollY * 0.75) % (height * 1.5) - height * 0.25;
        if (sweepY > -20 && sweepY < height + 20) {
          const gradient = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.5, laserGlow);
          gradient.addColorStop(1, 'transparent');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, sweepY - 30, width, 60);

          ctx.strokeStyle = isLight
            ? 'rgba(255, 75, 75, 0.25)'
            : 'rgba(0, 255, 170, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, sweepY);
          ctx.lineTo(width, sweepY);
          ctx.stroke();
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animFrameId);
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
