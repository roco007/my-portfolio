/* ═══════════════════════════════════════════════════════════════════════════
   HyperspaceLayer — Relativistic FTL Warp Jump & Seamless 2-Min Loop.
   Active during the final 60 canonical seconds (FTL entry) and the first 6
   canonical seconds of the next loop (drop-out).
   Features:
   - Warp vector radiating relativistic star streaks with velocity elongation
   - Cerulean / cyan Cherenkov radiation horizon ring
   - Singularity jump pulse connecting 59:59 → 00:00 seamlessly
   - Zero hard cut, zero reload, continuous deterministic cycle
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { scaleSec } from './JourneyTimeline';

interface WarpStreak {
  angle: number;
  dist: number;      // 0..1 normalized distance from center
  speed: number;
  length: number;
  brightness: number;
  color: string;
}

const WARP_COLORS = [
  '#a6d4ff', // cyan-blue
  '#ffffff', // pure white
  '#74b9ff', // light blue
  '#dfe6e9', // silvery
  '#81ecec', // aqua
];

export class HyperspaceLayer implements SpaceLayer {
  private streaks: WarpStreak[] = [];

  init(state: SceneState): void {
    const { quality, rand } = state;
    const count = quality === 'low' ? 60 : quality === 'medium' ? 120 : 180;
    this.streaks = [];

    for (let i = 0; i < count; i++) {
      this.streaks.push({
        angle: rand() * Math.PI * 2,
        dist: 0.05 + rand() * 0.95,
        speed: 0.4 + rand() * 0.8,
        length: 20 + rand() * 80,
        brightness: 0.4 + rand() * 0.6,
        color: WARP_COLORS[Math.floor(rand() * WARP_COLORS.length)],
      });
    }
  }

  update(state: SceneState): void {
    const { journey, dt } = state;
    const intensity = journey.hyperspaceIntensity;
    if (intensity <= 0.01) return;

    const speedMult = 1.0 + intensity * 6.0;

    for (const s of this.streaks) {
      s.dist += s.speed * speedMult * dt * 0.6;
      if (s.dist > 1.2) {
        s.dist = 0.02 + Math.random() * 0.08;
        s.angle = Math.random() * Math.PI * 2;
      }
    }
  }

  draw(state: SceneState): void {
    const { ctx, width, height, journey, intensity } = state;
    const warpIntensity = journey.hyperspaceIntensity;

    // Check if we are also in the post-loop deceleration window (first 0.2 s)
    let exitIntensity = 0;
    const exitWindow = scaleSec(6); // 6 canonical seconds → 0.2 s
    if (journey.elapsed < exitWindow) {
      exitIntensity = (1 - journey.elapsed / exitWindow) * 0.5;
    }

    const effectiveIntensity = Math.max(warpIntensity, exitIntensity) * intensity;
    if (effectiveIntensity <= 0.02) return;

    ctx.save();
    ctx.globalAlpha = effectiveIntensity;

    const cx = width * 0.5;
    const cy = height * 0.5;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);

    // 1. Cherenkov Glow Horizon Ring
    const horizon = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius * 0.85);
    horizon.addColorStop(0, 'rgba(180, 230, 255, 0.4)');
    horizon.addColorStop(0.3, 'rgba(80, 160, 255, 0.25)');
    horizon.addColorStop(0.7, 'rgba(20, 60, 140, 0.1)');
    horizon.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, width, height);

    // 2. Relativistic Warp Speed Streaks
    const streakStretch = 1.0 + effectiveIntensity * 5.0;

    for (const s of this.streaks) {
      const r = s.dist * maxRadius;
      const x1 = cx + Math.cos(s.angle) * r;
      const y1 = cy + Math.sin(s.angle) * r;

      const len = s.length * streakStretch * s.dist;
      const x2 = cx + Math.cos(s.angle) * (r + len);
      const y2 = cy + Math.sin(s.angle) * (r + len);

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.4, s.color);
      grad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1, 1.8 * s.brightness * (1 + s.dist * 0.8));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 3. Singularity Jump Pulse (soft white pulse over the final 4 canonical seconds)
    const pulseStart = scaleSec(3596); // 59:56 → 01:59.87
    const pulseEnd = scaleSec(3600);   // 60:00 → 02:00
    if (journey.elapsed > pulseStart && journey.elapsed <= pulseEnd) {
      const pulseT = (journey.elapsed - pulseStart) / (pulseEnd - pulseStart); // 0..1
      const flashAlpha = Math.sin(pulseT * Math.PI) * 0.85;
      ctx.fillStyle = `rgba(235, 248, 255, ${flashAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}
