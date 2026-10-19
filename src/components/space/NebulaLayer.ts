/* ═══════════════════════════════════════════════════════════════════════════
   NebulaLayer — deep-space volumetric-looking clouds.
   Procedural noise clouds are pre-rendered once to an oversized offscreen
   canvas, then composited cheaply each frame with slow drift + breathing.
   Kept very subtle so the environment stays dark and text stays readable.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';

interface NebulaCloud {
  cx: number;      // center x in offscreen space
  cy: number;      // center y in offscreen space
  rx: number;      // horizontal radius
  ry: number;      // vertical radius
  rot: number;     // rotation (rad)
  color: [number, number, number]; // rgb
  alpha: number;   // peak opacity
  phase: number;
  breath: number;  // breathing speed
  driftX: number;  // slow horizontal drift speed (px/s)
  driftY: number;
}

const NEBULA_COLORS: [number, number, number][] = [
  [18, 32, 78],    // deep navy blue
  [28, 46, 104],   // blue
  [40, 90, 130],   // cyan-ish
  [70, 40, 120],   // violet
  [110, 46, 130],  // purple
  [130, 50, 110],  // subtle magenta
  [16, 24, 60],    // extremely dark navy
];

export class NebulaLayer implements SpaceLayer {
  private offscreen: HTMLCanvasElement | null = null;
  private offCtx: CanvasRenderingContext2D | null = null;
  private clouds: NebulaCloud[] = [];
  private ow = 0; // offscreen width
  private oh = 0; // offscreen height

  init(state: SceneState): void {
    const { width, height, rand, quality } = state;

    // Offscreen rendered at reduced resolution for a natural soft blur and
    // cheaper compositing; scaled up on draw.
    const resScale = quality === 'low' ? 0.16 : quality === 'medium' ? 0.22 : 0.3;
    // Overscan so parallax drift never reveals an edge.
    this.ow = Math.max(2, Math.ceil(width * resScale * 1.35));
    this.oh = Math.max(2, Math.ceil(height * resScale * 1.35));

    if (!this.offscreen) this.offscreen = document.createElement('canvas');
    this.offscreen.width = this.ow;
    this.offscreen.height = this.oh;
    this.offCtx = this.offscreen.getContext('2d');
    if (!this.offCtx) return;

    // Build a handful of large, irregular cloud clusters.
    const count = quality === 'low' ? 4 : quality === 'medium' ? 5 : 6;
    this.clouds = [];
    for (let i = 0; i < count; i++) {
      const color = NEBULA_COLORS[Math.floor(rand() * NEBULA_COLORS.length)];
      this.clouds.push({
        cx: rand() * this.ow,
        cy: rand() * this.oh,
        rx: this.ow * (0.16 + rand() * 0.24),
        ry: this.oh * (0.18 + rand() * 0.26),
        rot: rand() * Math.PI * 2,
        color,
        alpha: 0.16 + rand() * 0.2,
        phase: rand() * Math.PI * 2,
        breath: 0.05 + rand() * 0.08,
        driftX: (rand() - 0.5) * 0.9,
        driftY: (rand() - 0.5) * 0.6,
      });
    }

    this.renderOffscreen(0);
  }

  /** Paint the clouds into the offscreen buffer using layered radial blobs. */
  private renderOffscreen(time: number): void {
    const ctx = this.offCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.ow, this.oh);
    ctx.globalCompositeOperation = 'lighter';

    for (const c of this.clouds) {
      const breath = 1 + 0.06 * Math.sin(c.phase + time * c.breath);
      const x = c.cx + Math.sin(time * 0.02 + c.phase) * c.driftX;
      const y = c.cy + Math.cos(time * 0.016 + c.phase) * c.driftY;
      const rx = c.rx * breath;
      const ry = c.ry * breath;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(c.rot);

      // Multi-blob cluster for irregular, non-circular shape.
      const lobes = 3;
      for (let l = 0; l < lobes; l++) {
        const ox = (l - 1) * rx * 0.28;
        const oy = Math.sin(l * 1.7 + c.phase) * ry * 0.18;
        const lrx = rx * (0.75 - l * 0.12);
        const lry = ry * (0.8 - l * 0.1);
        const [r, g, b] = c.color;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(lrx, lry));
        grad.addColorStop(0, `rgba(${r},${g},${b},${(c.alpha * 0.55).toFixed(3)})`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${(c.alpha * 0.28).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(ox, oy, lrx, lry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  update(state: SceneState): void {
    // Re-render offscreen periodically (not every frame — it's expensive).
    // ~8 FPS re-render is plenty for this slow-moving layer.
    if (Math.floor(state.time * 8) !== Math.floor((state.time - state.dt) * 8)) {
      this.renderOffscreen(state.time);
    }
  }

  draw(state: SceneState): void {
    const { ctx, width, height, scrollY, mouse, theme, intensity } = state;
    if (!this.offscreen) return;

    // Extremely subtle parallax (far layer ≈ 0.1x) + slow scroll drift.
    const px = mouse.x * 6;
    const py = mouse.y * 4 + scrollY * 0.015;

    ctx.save();
    ctx.globalAlpha =
      (theme === 'light' ? 0.35 : 1) * intensity * (theme === 'light' ? 0.5 : 0.9);
    // Draw stretched to cover viewport with overscan margin for drift.
    const dw = width * 1.35;
    const dh = height * 1.35;
    const dx = -(dw - width) / 2 - px;
    const dy = -(dh - height) / 2 - py;
    ctx.drawImage(this.offscreen, dx, dy, dw, dh);
    ctx.restore();
  }

  dispose(): void {
    this.offscreen = null;
    this.offCtx = null;
    this.clouds = [];
  }
}
