/* ═══════════════════════════════════════════════════════════════════════════
   StarFieldLayer — multi-depth procedural starfield.
   Combines a far layer (thousands of tiny, dim, slow-moving stars) and a mid
   layer (larger, brighter, twinkling stars with occasional diffraction
   spikes). Stars are distributed with clustered + uniform sampling so the sky
   shows natural sparse/dense regions instead of a flat grid, all driven by a
   seeded PRNG for reproducibility.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { gaussian, randRange } from './rng';

interface Star {
  x: number;          // base position (0..1 normalized, scaled at draw)
  y: number;
  depth: number;      // 0 (farthest) .. 1 (nearest)
  size: number;       // base radius px at depth 1
  brightness: number; // 0..1
  twinkle: number;    // twinkle amplitude 0..1 (0 = steady)
  twinkleSpeed: number;
  phase: number;
  color: string;
  spike: boolean;     // draw diffraction spikes (rare, brightest only)
}

// Stellar color classes (approximate blackbody tinting).
const STAR_TINTS = [
  '#ffffff', // white (most common)
  '#dfe9ff', // blue-white
  '#cfe0ff', // blue
  '#fff4e8', // warm white
  '#ffe9d0', // orange-ish
  '#ffd9c2', // cool red-ish
  '#e8fff4', // mint tinge
];

export class StarFieldLayer implements SpaceLayer {
  private stars: Star[] = [];

  init(state: SceneState): void {
    const { width, height, rand, quality } = state;
    const areaScale = (width * height) / (1440 * 900);
    // Far stars: thousands of faint points.
    const farCount = Math.floor((quality === 'low' ? 900 : quality === 'medium' ? 1800 : 3200) * areaScale);
    // Mid stars: fewer, larger, brighter.
    const midCount = Math.floor((quality === 'low' ? 140 : quality === 'medium' ? 260 : 420) * areaScale);

    this.stars = [];

    // Cluster centers create dense regions; most stars are scattered uniform.
    const clusters = 5 + Math.floor(rand() * 4);
    const centers: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < clusters; i++) {
      centers.push({
        x: rand(),
        y: rand() * 0.9,
        r: randRange(rand, 0.06, 0.18),
      });
    }

    // ── Far layer ───────────────────────────────────────────────────────────
    for (let i = 0; i < farCount; i++) {
      let x: number, y: number;
      if (rand() < 0.38) {
        // Clustered sampling (gaussian around a center) for dense patches.
        const c = centers[Math.floor(rand() * centers.length)];
        x = c.x + gaussian(rand) * c.r;
        y = c.y + gaussian(rand) * c.r * 0.8;
      } else {
        x = rand();
        y = rand();
      }
      const depth = randRange(rand, 0.02, 0.28);
      const bright = randRange(rand, 0.18, 0.75);
      this.stars.push({
        x, y,
        depth,
        size: randRange(rand, 0.35, 0.95),
        brightness: bright,
        twinkle: rand() < 0.4 ? randRange(rand, 0.05, 0.25) : 0,
        twinkleSpeed: randRange(rand, 0.4, 1.6),
        phase: rand() * Math.PI * 2,
        color: STAR_TINTS[Math.floor(rand() * STAR_TINTS.length)],
        spike: false,
      });
    }

    // ── Mid layer ───────────────────────────────────────────────────────────
    for (let i = 0; i < midCount; i++) {
      let x: number, y: number;
      if (rand() < 0.3) {
        const c = centers[Math.floor(rand() * centers.length)];
        x = c.x + gaussian(rand) * c.r;
        y = c.y + gaussian(rand) * c.r * 0.8;
      } else {
        x = rand();
        y = rand();
      }
      const depth = randRange(rand, 0.3, 0.75);
      const bright = randRange(rand, 0.55, 1.0);
      const size = randRange(rand, 0.8, 1.9);
      this.stars.push({
        x, y,
        depth,
        size,
        brightness: bright,
        twinkle: randRange(rand, 0.1, 0.4),
        twinkleSpeed: randRange(rand, 0.8, 2.6),
        phase: rand() * Math.PI * 2,
        color: STAR_TINTS[Math.floor(rand() * STAR_TINTS.length)],
        // Only the very brightest mid stars get diffraction spikes.
        spike: bright > 0.9 && size > 1.5 && rand() < 0.5,
      });
    }

    // Sort far→near so nearer stars draw on top (cheap painter's order).
    this.stars.sort((a, b) => a.depth - b.depth);
  }

  draw(state: SceneState): void {
    const { ctx, width, height, time, mouse, scrollY, theme, intensity } = state;
    if (theme === 'light') return; // Stars don't read on the light theme.

    ctx.save();
    // Depth-scaled parallax: far ~0.05x, near ~0.35x. Scroll adds gentle drift.
    for (const s of this.stars) {
      const px = mouse.x * (6 + s.depth * 22);
      const py = mouse.y * (4 + s.depth * 14) - scrollY * (0.01 + s.depth * 0.05);
      let sx = s.x * width + px;
      let sy = s.y * height + py;

      // Wrap horizontally/vertically so parallax never empties an edge.
      sx = ((sx % width) + width) % width;
      sy = ((sy % height) + height) % height;

      // Twinkle (frozen under reduced motion via a static phase).
      let tw = 1;
      if (s.twinkle > 0) {
        tw = 1 - s.twinkle * (0.5 + 0.5 * Math.sin(s.phase + time * s.twinkleSpeed));
      }

      const alpha = s.brightness * tw * intensity;
      if (alpha <= 0.01) continue;

      const r = s.size * (0.85 + s.depth * 0.5);

      // Soft halo for brighter stars.
      if (s.brightness > 0.7 && r > 1) {
        ctx.globalAlpha = alpha * 0.18;
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
        halo.addColorStop(0, s.color);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core.
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Diffraction spikes for the rare brightest stars.
      if (s.spike) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.6;
        const len = r * 6;
        ctx.beginPath();
        ctx.moveTo(sx - len, sy); ctx.lineTo(sx + len, sy);
        ctx.moveTo(sx, sy - len); ctx.lineTo(sx, sy + len);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

