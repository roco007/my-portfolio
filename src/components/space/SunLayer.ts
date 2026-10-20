/* ═══════════════════════════════════════════════════════════════════════════
   SunLayer — The Colossal Solar Perihelion Encounter (47:00 – 52:00).
   The Sun appears as an immense radiant stellar orb grazing the upper-right
   viewport edge. Features:
   - Dynamic turbulent solar granulation & convective heat shimmer
   - Animated coronal plasma loops & prominences arching off the limb
   - Multi-tiered radiant corona with rotating radial light rays
   - Anamorphic horizontal lens flare across the observation deck window
   - Secondary chromatic flare artifacts along the solar optical axis
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { scaleSec } from './JourneyTimeline';

export class SunLayer implements SpaceLayer {
  private startSec = scaleSec(2820); // 47:00 canonical → 94 s
  private endSec = scaleSec(3120);   // 52:00 canonical → 104 s
  private offscreenGranules: HTMLCanvasElement | null = null;

  init(_state: SceneState): void {
    // Pre-render a granular convection surface patch
    const size = 320;
    this.offscreenGranules = document.createElement('canvas');
    this.offscreenGranules.width = size;
    this.offscreenGranules.height = size;
    const g = this.offscreenGranules.getContext('2d');
    if (!g) return;

    g.fillStyle = '#ff7b00';
    g.fillRect(0, 0, size, size);

    // Convective granules
    for (let i = 0; i < 280; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 4 + Math.random() * 10;
      g.fillStyle = Math.random() < 0.6 ? 'rgba(255, 230, 90, 0.45)' : 'rgba(215, 65, 0, 0.35)';
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  draw(state: SceneState): void {
    const { ctx, theme, intensity, journey, width, height, time, mouse } = state;
    if (theme === 'light') return;

    const elapsed = journey.elapsed;
    if (elapsed < this.startSec || elapsed > this.endSec) {
      return;
    }

    const duration = this.endSec - this.startSec;
    const progress = Math.max(0, Math.min(1, (elapsed - this.startSec) / duration));

    // Sun trajectory: enters from top-right (xRatio: 1.25, yRatio: -0.25)
    // Closest approach (xRatio: 0.92, yRatio: 0.08) at progress 0.5
    // Leaves toward bottom-right (xRatio: 1.3, yRatio: 0.5)
    const t = progress;
    const invT = 1 - t;
    const xRatio = invT * invT * 1.35 + 2 * invT * t * 0.94 + t * t * 1.32;
    const yRatio = invT * invT * -0.28 + 2 * invT * t * 0.06 + t * t * 0.55;

    const px = mouse.x * 20;
    const py = mouse.y * 14;
    const cx = xRatio * width + px;
    const cy = yRatio * height + py;

    // Enormous scale: radius is ~360 - 480px, so only a giant curving limb is visible
    const approachScale = 1.0 + Math.sin(progress * Math.PI) * 0.4;
    const radius = Math.min(width, height) * 0.55 * approachScale;

    // Fade in/out at boundaries
    let alpha = 1.0;
    if (progress < 0.12) alpha = progress / 0.12;
    else if (progress > 0.88) alpha = (1 - progress) / 0.12;
    alpha *= intensity;

    ctx.save();
    ctx.globalAlpha = alpha;

    // ── 1. Vast Ambient Space Illumination ─────────────────────────────────
    const ambientHalo = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 3.5);
    ambientHalo.addColorStop(0, 'rgba(255, 170, 40, 0.45)');
    ambientHalo.addColorStop(0.3, 'rgba(255, 110, 15, 0.22)');
    ambientHalo.addColorStop(0.7, 'rgba(180, 50, 0, 0.08)');
    ambientHalo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ambientHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ── 2. Rotating Radial Corona Rays ─────────────────────────────────────
    this.renderCoronaRays(ctx, cx, cy, radius, time);

    // ── 3. Solar Prominences / Coronal Magnetic Loops ──────────────────────
    this.renderProminences(ctx, cx, cy, radius, time);

    // ── 4. Main Solar Orb (Photosphere + Chromosphere) ─────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Base fiery gradient
    const sunGrad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, 0, cx, cy, radius);
    sunGrad.addColorStop(0, '#ffffff'); // blinding white-hot core
    sunGrad.addColorStop(0.25, '#fff6c2');
    sunGrad.addColorStop(0.55, '#ffb72b');
    sunGrad.addColorStop(0.82, '#ff6e00');
    sunGrad.addColorStop(1, '#c92a00'); // limb darkening
    ctx.fillStyle = sunGrad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    // Layer animated convective granulation
    if (this.offscreenGranules) {
      ctx.globalAlpha = 0.28;
      ctx.globalCompositeOperation = 'overlay';
      const offset = (time * 12) % 320;
      ctx.drawImage(this.offscreenGranules, cx - radius + offset, cy - radius, radius * 2, radius * 2);
      ctx.drawImage(this.offscreenGranules, cx - radius + offset - 320, cy - radius, radius * 2, radius * 2);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();

    // ── 5. Blinding Chromosphere Rim Glow ──────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.85;
    const rim = ctx.createRadialGradient(cx, cy, radius * 0.94, cx, cy, radius * 1.15);
    rim.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
    rim.addColorStop(0.3, 'rgba(255, 185, 50, 0.6)');
    rim.addColorStop(0.7, 'rgba(255, 80, 0, 0.25)');
    rim.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── 6. Horizontal Anamorphic Lens Flare & Optical Artifacts ────────────
    this.renderLensFlares(ctx, cx, cy, width, height, progress);

    ctx.restore();
  }

  private renderCoronaRays(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    time: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.35;
    const rayCount = 18;
    const rotBase = time * 0.04;

    for (let i = 0; i < rayCount; i++) {
      const angle = rotBase + (i / rayCount) * Math.PI * 2;
      const rayLen = radius * (1.3 + Math.sin(i * 2.3 + time * 0.8) * 0.35);
      const rayWidth = radius * 0.12;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const rGrad = ctx.createLinearGradient(0, 0, rayLen, 0);
      rGrad.addColorStop(0, 'rgba(255, 220, 120, 0.45)');
      rGrad.addColorStop(0.5, 'rgba(255, 130, 20, 0.18)');
      rGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');

      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(radius * 0.95, -rayWidth * 0.5);
      ctx.lineTo(rayLen, 0);
      ctx.lineTo(radius * 0.95, rayWidth * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  private renderProminences(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    time: number
  ): void {
    ctx.save();
    // 6 animated magnetic plasma arches along the visible solar limb
    const loops = [
      { angle: 2.3, height: radius * 0.16, width: 0.14, speed: 0.6 },
      { angle: 2.7, height: radius * 0.22, width: 0.18, speed: 0.45 },
      { angle: 3.2, height: radius * 0.14, width: 0.12, speed: 0.7 },
      { angle: 3.7, height: radius * 0.26, width: 0.22, speed: 0.5 },
      { angle: 4.1, height: radius * 0.18, width: 0.15, speed: 0.8 },
      { angle: 4.6, height: radius * 0.15, width: 0.13, speed: 0.55 },
    ];

    for (const l of loops) {
      const pulse = 1.0 + Math.sin(time * l.speed) * 0.25;
      const a1 = l.angle - l.width * 0.5;
      const a2 = l.angle + l.width * 0.5;

      const p1x = cx + Math.cos(a1) * radius;
      const p1y = cy + Math.sin(a1) * radius;
      const p2x = cx + Math.cos(a2) * radius;
      const p2y = cy + Math.sin(a2) * radius;

      const peakDist = radius + l.height * pulse;
      const cpx = cx + Math.cos(l.angle) * peakDist;
      const cpy = cy + Math.sin(l.angle) * peakDist;

      ctx.strokeStyle = 'rgba(255, 110, 20, 0.75)';
      ctx.lineWidth = Math.max(1.5, radius * 0.012);
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.quadraticCurveTo(cpx, cpy, p2x, p2y);
      ctx.stroke();

      // Inner glowing core
      ctx.strokeStyle = 'rgba(255, 235, 150, 0.85)';
      ctx.lineWidth = Math.max(0.8, radius * 0.005);
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.quadraticCurveTo(cpx, cpy, p2x, p2y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderLensFlares(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    width: number,
    height: number,
    progress: number
  ): void {
    // Optical center of screen
    const ocx = width * 0.5;
    const ocy = height * 0.5;

    // Vector from sun to viewport center
    const dx = ocx - cx;
    const dy = ocy - cy;

    const flareIntensity = Math.sin(progress * Math.PI) * 0.65;
    if (flareIntensity <= 0.05) return;

    ctx.save();
    ctx.globalAlpha = flareIntensity;

    // 1. Horizontal Anamorphic Sci-Fi Streak
    const streakGrad = ctx.createLinearGradient(0, cy, width, cy);
    streakGrad.addColorStop(0, 'rgba(90, 180, 255, 0)');
    streakGrad.addColorStop(0.3, 'rgba(255, 200, 100, 0.15)');
    streakGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.65)');
    streakGrad.addColorStop(0.7, 'rgba(255, 180, 80, 0.15)');
    streakGrad.addColorStop(1, 'rgba(90, 180, 255, 0)');

    ctx.fillStyle = streakGrad;
    ctx.fillRect(0, cy - 1.5, width, 3);

    // 2. Secondary Chromatic Flare Hexagons/Circles along optical axis
    const flareSteps = [
      { t: 0.35, r: 18, col: 'rgba(255, 180, 80, 0.25)' },
      { t: 0.6,  r: 32, col: 'rgba(90, 200, 255, 0.2)' },
      { t: 0.85, r: 12, col: 'rgba(255, 120, 220, 0.22)' },
      { t: 1.25, r: 48, col: 'rgba(255, 220, 110, 0.15)' },
    ];

    for (const f of flareSteps) {
      const fx = cx + dx * f.t;
      const fy = cy + dy * f.t;

      const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.r);
      fGrad.addColorStop(0, f.col);
      fGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(fx, fy, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  dispose(): void {
    this.offscreenGranules = null;
  }
}
