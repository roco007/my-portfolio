import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../animations/useReducedMotion';
import { createRng } from './space/rng';
import { cappedDpr, detectQuality } from './space/quality';
import type { QualityTier, SceneState, SpaceLayer, SpaceTheme } from './space/types';
import { JourneyTimeline, type JourneyState } from './space/JourneyTimeline';
import { NebulaLayer } from './space/NebulaLayer';
import { GalaxyLayer } from './space/GalaxyLayer';
import { StarFieldLayer } from './space/StarFieldLayer';
import { KnownStarsLayer } from './space/KnownStarsLayer';
import { SolarSystemLayer } from './space/SolarSystemLayer';
import { SunLayer } from './space/SunLayer';
import { SatelliteLayer } from './space/SatelliteLayer';
import { SpaceStationLayer } from './space/SpaceStationLayer';
import { SpacecraftLayer } from './space/SpacecraftLayer';
import { AsteroidLayer } from './space/AsteroidLayer';
import { CometLayer } from './space/CometLayer';
import { ForegroundParticleLayer } from './space/ForegroundParticleLayer';
import { HyperspaceLayer } from './space/HyperspaceLayer';
import { EnvironmentalEvents } from './space/EnvironmentalEvents';
import { SpaceWindowLayer } from './space/SpaceWindowLayer';
import { JourneyDevScrubber } from './space/JourneyDevScrubber';

interface SpaceBackgroundProps {
  theme: SpaceTheme;
}

declare global {
  interface Window {
    __SET_JOURNEY_PROGRESS__?: (progress: number | null) => void;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SpaceBackground — Spaceship Observation Deck & 2-Minute Cosmic Voyage.
   Orchestrates the layered outer-space canvas:
   Nebula → Spiral Galaxy → 3D StarField → Known Stars → Solar System →
   Sun Perihelion → Satellites → Space Station → Spacecraft → Asteroid Belt →
   Particles → Hyperspace Jump → Environmental Events → Spaceship Window & HUD.
   ═══════════════════════════════════════════════════════════════════════════ */
export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineRef = useRef<JourneyTimeline>(new JourneyTimeline());
  const [currentJourneyState, setCurrentJourneyState] = useState<JourneyState | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const timeline = timelineRef.current;

    // Expose global control hook for testing
    window.__SET_JOURNEY_PROGRESS__ = (p: number | null) => {
      timeline.setManualProgress(p);
    };

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
    const seed = (Math.random() * 0xffffffff) >>> 0;
    const rand = createRng(seed);
    const intensity = theme === 'light' ? 0.35 : 1.0;

    const buildState = (time: number, dt: number): SceneState => ({
      ctx,
      width,
      height,
      time,
      dt,
      scrollY,
      mouse: { x: mouseX, y: mouseY },
      theme,
      quality,
      rand,
      intensity,
      journey: timeline.getState(time),
    });

    // ── Layer stack (back → front) ───────────────────────────────────────
    const layers: SpaceLayer[] = [
      new NebulaLayer(),
      new GalaxyLayer(),
      new StarFieldLayer(),
      new KnownStarsLayer(),
      new SolarSystemLayer(),
      new SunLayer(),
      new SatelliteLayer(),
      new SpaceStationLayer(),
      new SpacecraftLayer(),
      new AsteroidLayer(),
      new CometLayer(),
      new ForegroundParticleLayer(),
      new HyperspaceLayer(),
      new EnvironmentalEvents(),
      new SpaceWindowLayer(),
    ];

    const initLayers = () => {
      const s = buildState(0, 0);
      for (const l of layers) l.init(s);
      setCurrentJourneyState(s.journey);
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
        delete window.__SET_JOURNEY_PROGRESS__;
      };
    }

    // ── Animation loop ───────────────────────────────────────────────────
    let animFrameId = 0;
    let last = performance.now();
    let timeSec = 0;
    let running = true;
    let uiSyncTimer = 0;

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeSec += dt;

      // Depth mouse smoothing
      mouseX += (mouseTargetX - mouseX) * Math.min(1, dt * 3);
      mouseY += (mouseTargetY - mouseY) * Math.min(1, dt * 3);

      const state = buildState(timeSec, dt);

      ctx.clearRect(0, 0, width, height);
      for (const l of layers) {
        l.update?.(state);
        l.draw(state);
      }

      // Sync scrubber state periodically (~4 times/sec) to avoid React re-render overhead
      uiSyncTimer += dt;
      if (uiSyncTimer > 0.25) {
        uiSyncTimer = 0;
        setCurrentJourneyState(state.journey);
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
      delete window.__SET_JOURNEY_PROGRESS__;
    };
  }, [theme, reducedMotion]);

  const handleDevScrub = (p: number | null) => {
    timelineRef.current.setManualProgress(p);
  };

  return (
    <>
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

      {/* Dev Scrubber for Jump Testing (0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 99%) */}
      <JourneyDevScrubber
        journeyState={currentJourneyState}
        onScrub={handleDevScrub}
      />
    </>
  );
};

export default SpaceBackground;
