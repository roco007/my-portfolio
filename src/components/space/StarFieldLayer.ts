/* ═══════════════════════════════════════════════════════════════════════════
   StarFieldLayer — multi-depth procedural starfield with:
   - Far layer: thousands of tiny faint slow-moving stars in cluster/void regions
   - Mid layer: larger twinkling stars with diffraction spikes
   - Binary star pairs: two stars orbiting a common barycenter with color coding
   - Pulsars: regular rhythmic flashing with characteristic blue-white color
   - Distant galaxy smudges: elliptical blobs of unresolved billions of stars
   Stars are distributed with clustered + uniform sampling so the sky shows
   natural sparse/dense regions. All driven by a seeded PRNG.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { gaussian, randRange } from './rng';

interface Star {
  x: number;
  y: number;
  depth: number;
  size: number;
  brightness: number;
  twinkle: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
  spike: boolean;
}

interface BinaryStar {
  /** Barycenter position (0..1 normalized) */
  bx: number;
  by: number;
  /** Orbital radius of each star around barycenter */
  orbitR: number;
  /** Orbital phase offset between star A and B (π apart) */
  phaseA: number;
  /** Angular speed (rad/s) */
  speed: number;
  /** Colors for star A and B */
  colorA: string;
  colorB: string;
  /** Individual sizes */
  sizeA: number;
  sizeB: number;
  depth: number;
}

interface Pulsar {
  x: number;
  y: number;
  depth: number;
  /** Pulse period in seconds */
  period: number;
  phase: number;
  size: number;
}

interface GalaxySmudge {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot: number;
  depth: number;
  brightness: number;
  /** Color tint 0=blue spiral 1=orange elliptical */
  type: 'spiral' | 'elliptical' | 'irregular';
}

// Blackbody stellar tint palette
const STAR_TINTS = [
  '#ffffff',  // white
  '#dfe9ff',  // blue-white (A/B class)
  '#cfe0ff',  // blue (O class)
  '#b0d0ff',  // deep blue
  '#fff4e8',  // warm white (F/G class)
  '#ffe9d0',  // orange-ish (K class)
  '#ffd9c2',  // cool red (M class)
  '#e8fff4',  // mint tinge
  '#fff0b0',  // yellow-white (G dwarf)
];

// Binary star color pairs (hot+cool companions, or hot+hot)
const BINARY_PAIRS: [string, string][] = [
  ['#dfe9ff', '#ffd9c2'],   // blue-white + red
  ['#b0d0ff', '#fff4e8'],   // blue + warm white
  ['#ffffff', '#ff9944'],   // white + orange giant
  ['#cfe0ff', '#cfe0ff'],   // two blue stars
  ['#fff0b0', '#ff7070'],   // yellow + red
  ['#ffffff', '#dfe9ff'],   // white + blue-white
];

export class StarFieldLayer implements SpaceLayer {
  private stars: Star[] = [];
  private binaryStars: BinaryStar[] = [];
  private pulsars: Pulsar[] = [];
  private galaxySmudges: GalaxySmudge[] = [];

  init(state: SceneState): void {
    const { width, height, rand, quality } = state;
    const areaScale = (width * height) / (1440 * 900);

    const farCount = Math.floor(
      (quality === 'low' ? 1100 : quality === 'medium' ? 2200 : 3800) * areaScale
    );
    const midCount = Math.floor(
      (quality === 'low' ? 160 : quality === 'medium' ? 300 : 480) * areaScale
    );
    const binaryCount = quality === 'low' ? 3 : quality === 'medium' ? 5 : 8;
    const pulsarCount = quality === 'low' ? 1 : quality === 'medium' ? 2 : 3;
    const smudgeCount = quality === 'low' ? 3 : quality === 'medium' ? 5 : 8;

    this.stars = [];
    this.binaryStars = [];
    this.pulsars = [];
    this.galaxySmudges = [];

    // Cluster centers for dense stellar regions
    const clusters = 6 + Math.floor(rand() * 4);
    const centers: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < clusters; i++) {
      centers.push({
        x: rand(),
        y: rand() * 0.9,
        r: randRange(rand, 0.05, 0.2),
      });
    }

    // ── Far stars ──────────────────────────────────────────────────────────
    for (let i = 0; i < farCount; i++) {
      let x: number, y: number;
      if (rand() < 0.38) {
        const c = centers[Math.floor(rand() * centers.length)];
        x = c.x + gaussian(rand) * c.r;
        y = c.y + gaussian(rand) * c.r * 0.8;
      } else {
        x = rand(); y = rand();
      }
      const depth = randRange(rand, 0.02, 0.28);
      const bright = randRange(rand, 0.15, 0.72);
      this.stars.push({
        x, y, depth,
        size: randRange(rand, 0.32, 0.92),
        brightness: bright,
        twinkle: rand() < 0.38 ? randRange(rand, 0.05, 0.22) : 0,
        twinkleSpeed: randRange(rand, 0.4, 1.8),
        phase: rand() * Math.PI * 2,
        color: STAR_TINTS[Math.floor(rand() * STAR_TINTS.length)],
        spike: false,
      });
    }

    // ── Mid stars ──────────────────────────────────────────────────────────
    for (let i = 0; i < midCount; i++) {
      let x: number, y: number;
      if (rand() < 0.3) {
        const c = centers[Math.floor(rand() * centers.length)];
        x = c.x + gaussian(rand) * c.r;
        y = c.y + gaussian(rand) * c.r * 0.8;
      } else {
        x = rand(); y = rand();
      }
      const depth = randRange(rand, 0.28, 0.78);
      const bright = randRange(rand, 0.55, 1.0);
      const size = randRange(rand, 0.8, 2.1);
      this.stars.push({
        x, y, depth, size,
        brightness: bright,
        twinkle: randRange(rand, 0.08, 0.42),
        twinkleSpeed: randRange(rand, 0.7, 2.8),
        phase: rand() * Math.PI * 2,
        color: STAR_TINTS[Math.floor(rand() * STAR_TINTS.length)],
        spike: bright > 0.88 && size > 1.5 && rand() < 0.55,
      });
    }

    // Sort far→near
    this.stars.sort((a, b) => a.depth - b.depth);

    // ── Binary star pairs ──────────────────────────────────────────────────
    for (let i = 0; i < binaryCount; i++) {
      const pair = BINARY_PAIRS[Math.floor(rand() * BINARY_PAIRS.length)];
      const depth = randRange(rand, 0.3, 0.85);
      this.binaryStars.push({
        bx: randRange(rand, 0.05, 0.95),
        by: randRange(rand, 0.05, 0.90),
        orbitR: randRange(rand, 2.5, 6),
        phaseA: rand() * Math.PI * 2,
        speed: randRange(rand, 0.15, 0.6) * (rand() < 0.5 ? 1 : -1),
        colorA: pair[0],
        colorB: pair[1],
        sizeA: randRange(rand, 1.2, 2.4),
        sizeB: randRange(rand, 0.9, 2.0),
        depth,
      });
    }

    // ── Pulsars ────────────────────────────────────────────────────────────
    for (let i = 0; i < pulsarCount; i++) {
      this.pulsars.push({
        x: rand(),
        y: rand() * 0.85,
        depth: randRange(rand, 0.2, 0.6),
        period: randRange(rand, 0.35, 2.8), // seconds per pulse
        phase: rand() * Math.PI * 2,
        size: randRange(rand, 1.4, 2.8),
      });
    }

    // ── Distant galaxy smudges ────────────────────────────────────────────
    const smudgeTypes: GalaxySmudge['type'][] = ['spiral', 'elliptical', 'irregular'];
    for (let i = 0; i < smudgeCount; i++) {
      const aspect = 0.25 + rand() * 0.55;
      const baseSize = randRange(rand, 6, 22);
      this.galaxySmudges.push({
        x: rand(),
        y: rand() * 0.88,
        rx: baseSize,
        ry: baseSize * aspect,
        rot: rand() * Math.PI,
        depth: randRange(rand, 0.02, 0.18), // very far
        brightness: randRange(rand, 0.1, 0.4),
        type: smudgeTypes[Math.floor(rand() * smudgeTypes.length)],
      });
    }
  }

  draw(state: SceneState): void {
    const { ctx, width, height, time, mouse, scrollY, theme, intensity, journey } = state;
    if (theme === 'light') return;

    ctx.save();

    const cx = width * 0.5;
    const cy = height * 0.5;
    const fwdSpeed = journey.camera.forwardSpeed;

    // Global banking around center
    if (journey.camera.bankAngle !== 0) {
      ctx.translate(cx, cy);
      ctx.rotate(journey.camera.bankAngle);
      ctx.translate(-cx, -cy);
    }

    // ── Galaxy smudges (farthest — drawn first) ───────────────────────────
    for (const gs of this.galaxySmudges) {
      const px = mouse.x * (3 + gs.depth * 10) + journey.camera.swayX * gs.depth * 0.3;
      const py = mouse.y * (2 + gs.depth * 7) - scrollY * (0.005 + gs.depth * 0.02) + journey.camera.swayY * gs.depth * 0.3;
      const gx = gs.x * width + px;
      const gy = gs.y * height + py;

      // Very subtle panning from forward speed
      const fdx = (gx - cx) * (time * 0.004 * fwdSpeed * gs.depth * 0.1) % 1;
      const fdy = (gy - cy) * (time * 0.004 * fwdSpeed * gs.depth * 0.1) % 1;

      const alpha = gs.brightness * intensity * 0.7;
      if (alpha <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(gx + fdx, gy + fdy);
      ctx.rotate(gs.rot);

      if (gs.type === 'spiral') {
        // Fuzzy oval with brighter core
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, gs.rx);
        grad.addColorStop(0, 'rgba(255, 248, 220, 0.85)');
        grad.addColorStop(0.3, 'rgba(200, 215, 255, 0.45)');
        grad.addColorStop(0.7, 'rgba(140, 170, 240, 0.18)');
        grad.addColorStop(1, 'rgba(100, 140, 220, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, gs.rx, gs.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        // Spiral arm hint — two faint strokes
        ctx.strokeStyle = 'rgba(180, 210, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let arm = 0; arm < 2; arm++) {
          ctx.beginPath();
          const aOff = arm * Math.PI;
          for (let t = 0; t < Math.PI * 1.5; t += 0.1) {
            const r = (t / (Math.PI * 1.5)) * gs.rx * 0.85;
            const ax = Math.cos(t + aOff) * r;
            const ay = Math.sin(t + aOff) * r * (gs.ry / gs.rx);
            if (t === 0) ctx.moveTo(ax, ay);
            else ctx.lineTo(ax, ay);
          }
          ctx.stroke();
        }
      } else if (gs.type === 'elliptical') {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, gs.rx);
        grad.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
        grad.addColorStop(0.4, 'rgba(240, 210, 160, 0.4)');
        grad.addColorStop(1, 'rgba(200, 170, 120, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, gs.rx, gs.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Irregular — multiple offset blobs
        for (let b = 0; b < 3; b++) {
          const bx = (b - 1) * gs.rx * 0.4;
          const by = Math.sin(b * 1.3) * gs.ry * 0.3;
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, gs.rx * 0.7);
          grad.addColorStop(0, 'rgba(200, 220, 255, 0.7)');
          grad.addColorStop(1, 'rgba(160, 190, 255, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(bx, by, gs.rx * (0.5 + b * 0.2), gs.ry * (0.5 + b * 0.15), b, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // ── Regular stars ─────────────────────────────────────────────────────
    for (const s of this.stars) {
      const px = mouse.x * (6 + s.depth * 22) + journey.camera.swayX * s.depth * 0.8;
      const py = mouse.y * (4 + s.depth * 14) - scrollY * (0.01 + s.depth * 0.05) + journey.camera.swayY * s.depth * 0.8;

      let sx = s.x * width + px;
      let sy = s.y * height + py;

      const dx = sx - cx;
      const dy = sy - cy;
      const fwdDrift = (time * 0.015 * fwdSpeed * (0.2 + s.depth * 0.8)) % 1;
      sx += dx * fwdDrift * 0.15;
      sy += dy * fwdDrift * 0.15;

      sx = ((sx % width) + width) % width;
      sy = ((sy % height) + height) % height;

      let tw = 1;
      if (s.twinkle > 0) {
        tw = 1 - s.twinkle * (0.5 + 0.5 * Math.sin(s.phase + time * s.twinkleSpeed));
      }

      const alpha = s.brightness * tw * intensity;
      if (alpha <= 0.01) continue;

      const r = s.size * (0.85 + s.depth * 0.5);

      // Soft halo for brighter stars
      if (s.brightness > 0.68 && r > 1) {
        ctx.globalAlpha = alpha * 0.18;
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4.5);
        halo.addColorStop(0, s.color);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      // Diffraction spikes
      if (s.spike) {
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.6;
        const len = r * 6.5;
        ctx.beginPath();
        ctx.moveTo(sx - len, sy); ctx.lineTo(sx + len, sy);
        ctx.moveTo(sx, sy - len); ctx.lineTo(sx, sy + len);
        ctx.stroke();
        // Diagonal lesser spikes
        const dlen = len * 0.45;
        ctx.globalAlpha = alpha * 0.22;
        ctx.beginPath();
        ctx.moveTo(sx - dlen, sy - dlen); ctx.lineTo(sx + dlen, sy + dlen);
        ctx.moveTo(sx + dlen, sy - dlen); ctx.lineTo(sx - dlen, sy + dlen);
        ctx.stroke();
      }
    }

    // ── Binary stars ──────────────────────────────────────────────────────
    for (const b of this.binaryStars) {
      const px = mouse.x * (8 + b.depth * 18) + journey.camera.swayX * b.depth * 0.7;
      const py = mouse.y * (5 + b.depth * 12) + journey.camera.swayY * b.depth * 0.7;

      const bcx = b.bx * width + px;
      const bcy = b.by * height + py;

      const phaseA = b.phaseA + time * b.speed;
      const phaseB = phaseA + Math.PI;

      const axA = bcx + Math.cos(phaseA) * b.orbitR * (0.9 + b.depth * 0.4);
      const ayA = bcy + Math.sin(phaseA) * b.orbitR * (0.5 + b.depth * 0.3);
      const axB = bcx + Math.cos(phaseB) * b.orbitR * (0.9 + b.depth * 0.4);
      const ayB = bcy + Math.sin(phaseB) * b.orbitR * (0.5 + b.depth * 0.3);

      const alpha = (0.5 + b.depth * 0.5) * intensity;

      // Star A
      ctx.globalAlpha = alpha;
      ctx.fillStyle = b.colorA;
      ctx.beginPath();
      ctx.arc(axA, ayA, b.sizeA, 0, Math.PI * 2);
      ctx.fill();
      // Halo A
      if (b.sizeA > 1.5) {
        const hA = ctx.createRadialGradient(axA, ayA, 0, axA, ayA, b.sizeA * 3.5);
        hA.addColorStop(0, b.colorA);
        hA.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = alpha * 0.22;
        ctx.fillStyle = hA;
        ctx.beginPath();
        ctx.arc(axA, ayA, b.sizeA * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Star B
      ctx.globalAlpha = alpha;
      ctx.fillStyle = b.colorB;
      ctx.beginPath();
      ctx.arc(axB, ayB, b.sizeB, 0, Math.PI * 2);
      ctx.fill();
      if (b.sizeB > 1.5) {
        const hB = ctx.createRadialGradient(axB, ayB, 0, axB, ayB, b.sizeB * 3.5);
        hB.addColorStop(0, b.colorB);
        hB.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = hB;
        ctx.beginPath();
        ctx.arc(axB, ayB, b.sizeB * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Pulsars ──────────────────────────────────────────────────────────
    for (const p of this.pulsars) {
      const px = mouse.x * (5 + p.depth * 15) + journey.camera.swayX * p.depth * 0.5;
      const py = mouse.y * (3 + p.depth * 10) + journey.camera.swayY * p.depth * 0.5;
      const sx = p.x * width + px;
      const sy = p.y * height + py;

      // Sharp periodic pulse: narrow raised cosine
      const phase = ((time / p.period) % 1) * Math.PI * 2 + p.phase;
      const pulse = Math.pow(Math.max(0, Math.cos(phase)), 8); // very narrow peak
      const alpha = pulse * (0.6 + p.depth * 0.4) * intensity;

      if (alpha > 0.02) {
        // Core blip
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#c8e8ff';
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * 0.6 + pulse * p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Expanding ring pulse
        const ringR = p.size * (2 + pulse * 8);
        ctx.globalAlpha = alpha * 0.35;
        ctx.strokeStyle = '#88c8ff';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
        ctx.stroke();

        // 4-spike flash
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = '#b0d8ff';
        ctx.lineWidth = 0.5;
        const spikeLen = p.size * (3 + pulse * 7);
        ctx.beginPath();
        ctx.moveTo(sx - spikeLen, sy); ctx.lineTo(sx + spikeLen, sy);
        ctx.moveTo(sx, sy - spikeLen); ctx.lineTo(sx, sy + spikeLen);
        ctx.stroke();
      } else {
        // Steady dim dot between pulses
        ctx.globalAlpha = 0.15 * intensity;
        ctx.fillStyle = '#88b8e0';
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
