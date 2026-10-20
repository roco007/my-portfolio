/* ═══════════════════════════════════════════════════════════════════════════
   NebulaLayer — rich volumetric deep-space cloud complexes.
   Renders multiple distinct nebula types:
   - Emission nebulae (Hα red-pink, OIII blue-green) with gas pillars
   - Reflection nebulae (blue-white starlight scattering)
   - Dark dust lanes cutting across glowing regions
   Pre-rendered to offscreen buffer with multi-lobe fractal-like blobs,
   composited cheaply each frame with slow drift + breathing + parallax.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';

interface NebulaBlob {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  color: [number, number, number];
  alpha: number;
  phase: number;
  breath: number;
  driftX: number;
  driftY: number;
  lobes: number;
  type: 'emission' | 'reflection' | 'dark';
}

// Emission nebula palettes (Hα, OIII, SII mapped to visible RGB)
const EMISSION_COLORS: [number, number, number][] = [
  [210, 40, 80],   // Hα red (hydrogen-alpha)
  [190, 30, 100],  // deep Hα crimson
  [50, 170, 210],  // OIII blue-green
  [30, 140, 200],  // deep OIII
  [230, 80, 140],  // SII magenta
  [160, 50, 220],  // NII violet
  [255, 100, 60],  // warm reddish-orange
];

// Reflection nebula palettes (cool blue starlight scatter)
const REFLECTION_COLORS: [number, number, number][] = [
  [60, 110, 220],
  [40, 90, 200],
  [80, 140, 255],
  [100, 160, 240],
];

// Subtle background nebulosity tints
const AMBIENT_COLORS: [number, number, number][] = [
  [18, 32, 78],
  [28, 46, 104],
  [40, 90, 130],
  [70, 40, 120],
  [16, 24, 60],
];

export class NebulaLayer implements SpaceLayer {
  private offscreen: HTMLCanvasElement | null = null;
  private offCtx: CanvasRenderingContext2D | null = null;
  private blobs: NebulaBlob[] = [];
  private ow = 0;
  private oh = 0;
  private lastRenderTime = -999;

  init(state: SceneState): void {
    const { width, height, rand, quality } = state;

    const resScale = quality === 'low' ? 0.18 : quality === 'medium' ? 0.25 : 0.35;
    this.ow = Math.max(2, Math.ceil(width * resScale * 1.4));
    this.oh = Math.max(2, Math.ceil(height * resScale * 1.4));

    if (!this.offscreen) this.offscreen = document.createElement('canvas');
    this.offscreen.width = this.ow;
    this.offscreen.height = this.oh;
    this.offCtx = this.offscreen.getContext('2d');
    if (!this.offCtx) return;

    const count = quality === 'low' ? 5 : quality === 'medium' ? 8 : 12;
    this.blobs = [];

    // ── Background ambient nebulosity (faint, large-scale) ──────────────────
    for (let i = 0; i < 3; i++) {
      const color = AMBIENT_COLORS[Math.floor(rand() * AMBIENT_COLORS.length)];
      this.blobs.push({
        cx: rand() * this.ow,
        cy: rand() * this.oh,
        rx: this.ow * (0.3 + rand() * 0.35),
        ry: this.oh * (0.3 + rand() * 0.35),
        rot: rand() * Math.PI * 2,
        color,
        alpha: 0.08 + rand() * 0.10,
        phase: rand() * Math.PI * 2,
        breath: 0.03 + rand() * 0.05,
        driftX: (rand() - 0.5) * 0.5,
        driftY: (rand() - 0.5) * 0.4,
        lobes: 2,
        type: 'reflection',
      });
    }

    // ── Emission nebula blobs (Hα + OIII, vivid) ───────────────────────────
    const emissionCount = Math.floor(count * 0.55);
    for (let i = 0; i < emissionCount; i++) {
      const color = EMISSION_COLORS[Math.floor(rand() * EMISSION_COLORS.length)];
      this.blobs.push({
        cx: rand() * this.ow,
        cy: rand() * this.oh,
        rx: this.ow * (0.08 + rand() * 0.18),
        ry: this.oh * (0.10 + rand() * 0.22),
        rot: rand() * Math.PI * 2,
        color,
        alpha: 0.12 + rand() * 0.22,
        phase: rand() * Math.PI * 2,
        breath: 0.04 + rand() * 0.09,
        driftX: (rand() - 0.5) * 0.8,
        driftY: (rand() - 0.5) * 0.6,
        lobes: 3 + Math.floor(rand() * 3),
        type: 'emission',
      });
    }

    // ── Reflection nebula blobs (cool blue, moderate) ───────────────────────
    const reflectionCount = count - emissionCount;
    for (let i = 0; i < reflectionCount; i++) {
      const color = REFLECTION_COLORS[Math.floor(rand() * REFLECTION_COLORS.length)];
      this.blobs.push({
        cx: rand() * this.ow,
        cy: rand() * this.oh,
        rx: this.ow * (0.10 + rand() * 0.20),
        ry: this.oh * (0.12 + rand() * 0.24),
        rot: rand() * Math.PI * 2,
        color,
        alpha: 0.10 + rand() * 0.18,
        phase: rand() * Math.PI * 2,
        breath: 0.05 + rand() * 0.08,
        driftX: (rand() - 0.5) * 0.7,
        driftY: (rand() - 0.5) * 0.5,
        lobes: 2 + Math.floor(rand() * 2),
        type: 'reflection',
      });
    }

    this.renderOffscreen(0);
    this.lastRenderTime = 0;
  }

  private renderOffscreen(time: number): void {
    const ctx = this.offCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.ow, this.oh);

    // Background ambient pass
    ctx.globalCompositeOperation = 'source-over';
    for (const b of this.blobs) {
      if (b.type !== 'reflection' || b.lobes > 2) continue;
      this.drawBlob(ctx, b, time);
    }

    // Emission nebula pass (additive glow)
    ctx.globalCompositeOperation = 'screen';
    for (const b of this.blobs) {
      if (b.type !== 'emission') continue;
      this.drawBlob(ctx, b, time);
    }

    // Reflection nebula pass
    ctx.globalCompositeOperation = 'screen';
    for (const b of this.blobs) {
      if (b.type !== 'reflection' || b.lobes <= 2) continue;
      this.drawBlob(ctx, b, time);
    }

    // Gas pillars — dark columnar structures cutting across emission regions
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(10, 8, 20, 0.22)';
    for (let p = 0; p < 4; p++) {
      const pillarX = this.ow * (0.15 + p * 0.22);
      const pillarW = 4 + p * 2;
      const pillarH = this.oh * (0.3 + Math.sin(p * 1.3) * 0.2);
      ctx.beginPath();
      ctx.ellipse(pillarX, this.oh * 0.5, pillarW, pillarH, p * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private drawBlob(ctx: CanvasRenderingContext2D, b: NebulaBlob, time: number): void {
    const breath = 1 + 0.07 * Math.sin(b.phase + time * b.breath);
    const x = b.cx + Math.sin(time * 0.018 + b.phase) * b.driftX;
    const y = b.cy + Math.cos(time * 0.013 + b.phase) * b.driftY;
    const rx = b.rx * breath;
    const ry = b.ry * breath;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.rot);

    for (let l = 0; l < b.lobes; l++) {
      const angle = (l / b.lobes) * Math.PI * 2;
      const lx = Math.cos(angle) * rx * 0.32;
      const ly = Math.sin(angle) * ry * 0.32;
      const lrx = rx * (0.7 + Math.sin(l * 2.1 + b.phase) * 0.2);
      const lry = ry * (0.65 + Math.cos(l * 1.7 + b.phase) * 0.2);

      const [r, g, bv] = b.color;
      const rad = Math.max(lrx, lry);
      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, rad);
      grad.addColorStop(0, `rgba(${r},${g},${bv},${(b.alpha * 0.7).toFixed(3)})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${bv},${(b.alpha * 0.35).toFixed(3)})`);
      grad.addColorStop(0.75, `rgba(${r},${g},${bv},${(b.alpha * 0.1).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${r},${g},${bv},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(lx, ly, lrx, lry, angle * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  update(state: SceneState): void {
    // Re-render at ~6 FPS — enough for slow cloud breathing
    const interval = 1 / 6;
    if (state.time - this.lastRenderTime >= interval) {
      this.renderOffscreen(state.time);
      this.lastRenderTime = state.time;
    }
  }

  draw(state: SceneState): void {
    const { ctx, width, height, scrollY, mouse, theme, intensity, journey } = state;
    if (!this.offscreen) return;

    // Nebula boost during nebula_asteroids section
    let nebulaBoost = 1.0;
    let baseAlpha = theme === 'light' ? 0.2 : 0.85;

    if (journey.currentSection.id === 'nebula_asteroids') {
      nebulaBoost = 1.0 + Math.sin(journey.sectionProgress * Math.PI) * 1.5;
    } else if (journey.currentSection.id === 'galaxy') {
      nebulaBoost = 1.2;
    } else if (journey.currentSection.id === 'deep_space_stars') {
      nebulaBoost = 0.8;
    }

    // Subtle parallax
    const px = mouse.x * 7 + journey.camera.swayX * 0.35;
    const py = mouse.y * 5 + scrollY * 0.016 + journey.camera.swayY * 0.35;

    ctx.save();
    ctx.globalAlpha = baseAlpha * intensity * nebulaBoost;

    const dw = width * 1.4;
    const dh = height * 1.4;
    const dx = -(dw - width) / 2 - px;
    const dy = -(dh - height) / 2 - py;
    ctx.drawImage(this.offscreen, dx, dy, dw, dh);

    // Cosmic ambient wash from journey section tint
    const [ar, ag, ab] = journey.ambientColor;
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.06 * intensity * nebulaBoost;
    ctx.fillStyle = `rgb(${ar},${ag},${ab})`;
    ctx.fillRect(0, 0, width, height);

    // Extra emission bloom during peak nebula section
    if (journey.currentSection.id === 'nebula_asteroids') {
      const peakBoost = Math.sin(journey.sectionProgress * Math.PI);
      ctx.globalAlpha = 0.08 * peakBoost * intensity;
      ctx.fillStyle = 'rgba(210, 60, 100, 1)'; // Hα red
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 0.05 * peakBoost * intensity;
      ctx.fillStyle = 'rgba(50, 160, 210, 1)'; // OIII blue
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  dispose(): void {
    this.offscreen = null;
    this.offCtx = null;
    this.blobs = [];
  }
}
