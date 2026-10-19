import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from '../animations/useReducedMotion';
import { createRng } from './space/rng';
import { cappedDpr, detectQuality } from './space/quality';
import type { QualityTier, SceneState, SpaceLayer, SpaceTheme } from './space/types';
import { NebulaLayer } from './space/NebulaLayer';
import { StarFieldLayer } from './space/StarFieldLayer';
import { PlanetLayer } from './space/PlanetLayer';
import { SatelliteLayer } from './space/SatelliteLayer';
import { SpaceStationLayer } from './space/SpaceStationLayer';
import { SpacecraftLayer } from './space/SpacecraftLayer';
import { AsteroidLayer } from './space/AsteroidLayer';
import { ForegroundParticleLayer } from './space/ForegroundParticleLayer';
import { EnvironmentalEvents } from './space/EnvironmentalEvents';

interface SpaceBackgroundProps {
  theme: SpaceTheme;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SpaceBackground — orchestrates the layered outer-space environment.

   Rendered as a single fixed, full-viewport, pointer-transparent canvas that
   sits behind all website content. One requestAnimationFrame loop drives every
   layer back-to-front; a shared SceneState carries timing, depth-scaled mouse
   parallax, scroll coupling and adaptive quality. Respects prefers-reduced-
   motion by rendering a single static frame, and pauses when the tab is hidden
   to avoid burning CPU/GPU in the background.
   ═══════════════════════════════════════════════════════════════════════════ */
export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ── Quality tier (device capability) ─────────────────────────────────
    const quality: QualityTier = detectQuality().tier;

    // ── Sizing ───────────────────────────────────────────────────────────
    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = cappedDpr(quality);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ── Interaction state ────────────────────────────────────────────────
    let scrollY = window.scrollY;
    // Target/current mouse offset normalized to [-1, 1]; smoothed each frame.
    let mouseTargetX = 0, mouseTargetY = 0;
    let mouseX = 0, mouseY = 0;

    const onScroll = () => { scrollY = window.scrollY; };
    const onMove = (e: MouseEvent) => {
      mouseTargetX = (e.clientX / width) * 2 - 1;
      mouseTargetY = (e.clientY / height) * 2 - 1;
    };
    const onLeave = () => { mouseTargetX = 0; mouseTargetY = 0; };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    // ── Scene state factory ──────────────────────────────────────────────
    // Deterministic seed so a given mount produces a stable, natural layout.
    const seed = (Math.random() * 0xffffffff) >>> 0;
    const rand = createRng(seed);
    // Light theme dims the whole environment so text stays readable.
    const intensity = theme === 'light' ? 0.35 : 1.0;

    const buildState = (time: number, dt: number): SceneState => ({
      ctx, width, height, time, dt,
      scrollY, mouse: { x: mouseX, y: mouseY },
      theme, quality, rand, intensity,
    });

    // ── Layer stack (back → front) ───────────────────────────────────────
    const layers: SpaceLayer[] = [
      new NebulaLayer(),
      new StarFieldLayer(),
      new PlanetLayer(),
      new SatelliteLayer(),
      new SpaceStationLayer(),
      new SpacecraftLayer(),
      new AsteroidLayer(),
      new ForegroundParticleLayer(),
      new EnvironmentalEvents(),
    ];

    const initLayers = () => {
      for (const l of layers) l.init(buildState(0, 0));
    };
    initLayers();

    // ── Resize handling (shared by both motion modes) ────────────────────
    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        initLayers();
        if (reducedMotion) {
          // Re-render the single static frame at the new size.
          ctx.clearRect(0, 0, width, height);
          const s = buildState(0, 0);
          for (const l of layers) l.draw(s);
        }
      }, 180);
    };
    window.addEventListener('resize', onResize);

    // ── Reduced motion: render one static frame and stop ─────────────────
    if (reducedMotion) {
      ctx.clearRect(0, 0, width, height);
      const s = buildState(0, 0);
      for (const l of layers) l.draw(s);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('resize', onResize);
        window.clearTimeout(resizeTimer);
        for (const l of layers) l.dispose?.();
      };
    }

    // ── Animation loop ───────────────────────────────────────────────────
    let animFrameId = 0;
    let last = performance.now();
    let timeSec = 0;
    let running = true;

    const render = (now: number) => {
      if (!running) return;
      // Clamp dt to avoid huge jumps after tab switches.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeSec += dt;

      // Smooth mouse (depth parallax is applied per-layer from this base).
      mouseX += (mouseTargetX - mouseX) * Math.min(1, dt * 3);
      mouseY += (mouseTargetY - mouseY) * Math.min(1, dt * 3);

      const state = buildState(timeSec, dt);

      ctx.clearRect(0, 0, width, height);
      for (const l of layers) {
        l.update?.(state);
        l.draw(state);
      }

      animFrameId = requestAnimationFrame(render);
    };
    animFrameId = requestAnimationFrame(render);

    // ── Pause when tab is hidden ─────────────────────────────────────────
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animFrameId);
      } else if (!running) {
        running = true;
        last = performance.now();
        animFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(resizeTimer);
      for (const l of layers) l.dispose?.();
    };
  }, [theme, reducedMotion]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

export default SpaceBackground;

