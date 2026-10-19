/* ═══════════════════════════════════════════════════════════════════════════
   SatelliteLayer — realistic-ish satellites at varied depths.
   Each satellite has a metallic bus, solar-panel wings, a dish and antenna,
   plus a blinking nav light. They follow independent elliptical orbits with
   randomized speed/direction/phase so nothing moves in sync. Depth controls
   size, brightness and parallax.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

interface Satellite {
  cx: number; cy: number;   // orbit center
  rx: number; ry: number;   // orbit radii
  angle: number;            // current angle on orbit
  speed: number;            // angular speed (rad/s), sign = direction
  tilt: number;             // orbit ellipse tilt
  depth: number;            // 0..1 (parallax + scale + brightness)
  scale: number;            // base size multiplier
  spin: number;             // self-rotation of the body
  spinSpeed: number;
  panelPhase: number;       // solar-panel wing angle wobble
  lightPhase: number;       // nav-light blink phase
  lightSpeed: number;
  hasDish: boolean;
}

function drawSatellite(ctx: CanvasRenderingContext2D, s: Satellite, t: number, intensity: number): void {
  const x = Math.cos(s.angle) * s.rx;
  const y = Math.sin(s.angle) * s.ry;
  const cos = Math.cos(s.tilt), sin = Math.sin(s.tilt);
  const px = s.cx + (x * cos - y * sin);
  const py = s.cy + (x * sin + y * cos);

  const size = (6 + s.depth * 10) * s.scale;
  const alpha = (0.35 + s.depth * 0.65) * intensity;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(s.spin);
  ctx.globalAlpha = alpha;

  // ── Solar-panel wings (two rectangles with grid lines) ─────────────────
  const wingW = size * 2.4;
  const wingH = size * 0.9;
  const gap = size * 0.5;
  const panelTilt = Math.sin(s.panelPhase) * 0.15; // subtle wing articulation
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * (gap + wingW / 2), 0);
    ctx.rotate(panelTilt * side);
    const grad = ctx.createLinearGradient(0, -wingH / 2, 0, wingH / 2);
    grad.addColorStop(0, `rgba(40,90,160,${(0.9 * intensity).toFixed(3)})`);
    grad.addColorStop(0.5, `rgba(70,130,210,${(0.95 * intensity).toFixed(3)})`);
    grad.addColorStop(1, `rgba(30,60,120,${(0.85 * intensity).toFixed(3)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(-wingW / 2, -wingH / 2, wingW, wingH);
    // Grid lines.
    ctx.strokeStyle = 'rgba(160,200,255,0.35)';
    ctx.lineWidth = 0.4;
    const cells = 4;
    for (let i = 1; i < cells; i++) {
      const gx = -wingW / 2 + (wingW / cells) * i;
      ctx.beginPath(); ctx.moveTo(gx, -wingH / 2); ctx.lineTo(gx, wingH / 2); ctx.stroke();
    }
    // Specular highlight (sun catching the panel).
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-wingW / 2, -wingH / 2, wingW, wingH * 0.25);
    ctx.restore();
  }

  // ── Central bus (metallic body) ────────────────────────────────────────
  const busW = size * 1.1;
  const busH = size * 0.9;
  const busGrad = ctx.createLinearGradient(-busW / 2, -busH / 2, busW / 2, busH / 2);
  busGrad.addColorStop(0, 'rgba(210,215,225,0.95)');
  busGrad.addColorStop(0.5, 'rgba(150,158,170,0.95)');
  busGrad.addColorStop(1, 'rgba(90,96,110,0.95)');
  ctx.fillStyle = busGrad;
  ctx.fillRect(-busW / 2, -busH / 2, busW, busH);
  ctx.strokeStyle = 'rgba(230,235,245,0.4)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-busW / 2, -busH / 2, busW, busH);

  // ── Communication dish ─────────────────────────────────────────────────
  if (s.hasDish) {
    ctx.fillStyle = 'rgba(200,205,215,0.9)';
    ctx.beginPath();
    ctx.ellipse(0, -busH * 0.75, size * 0.5, size * 0.32, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,128,140,0.8)';
    ctx.beginPath();
    ctx.moveTo(0, -busH * 0.75);
    ctx.lineTo(busW * 0.2, -busH * 0.5);
    ctx.stroke();
  }

  // ── Antenna whip ───────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(220,225,235,0.7)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-busW * 0.3, busH * 0.5);
  ctx.lineTo(-busW * 0.3, busH * 0.5 + size * 1.2);
  ctx.stroke();

  // ── Blinking navigation light ──────────────────────────────────────────
  const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.lightPhase + t * s.lightSpeed));
  ctx.globalAlpha = blink * intensity;
  ctx.fillStyle = '#ff5a5a';
  ctx.beginPath();
  ctx.arc(busW * 0.35, -busH * 0.35, Math.max(0.8, size * 0.14), 0, Math.PI * 2);
  ctx.fill();
  // Tiny glow.
  ctx.globalAlpha = blink * 0.35 * intensity;
  const g = ctx.createRadialGradient(busW * 0.35, -busH * 0.35, 0, busW * 0.35, -busH * 0.35, size * 0.5);
  g.addColorStop(0, 'rgba(255,90,90,0.8)');
  g.addColorStop(1, 'rgba(255,90,90,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(busW * 0.35, -busH * 0.35, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export class SatelliteLayer implements SpaceLayer {
  private sats: Satellite[] = [];

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.sats = [];
    if (theme === 'light') return;

    const count = quality === 'low' ? 2 : quality === 'medium' ? 4 : 6;
    for (let i = 0; i < count; i++) {
      const depth = randRange(rand, 0.15, 0.9);
      this.sats.push({
        cx: randRange(rand, width * 0.1, width * 0.9),
        cy: randRange(rand, height * 0.1, height * 0.9),
        rx: randRange(rand, width * 0.15, width * 0.45),
        ry: randRange(rand, height * 0.08, height * 0.25),
        angle: rand() * Math.PI * 2,
        // Independent orbital speeds, randomized direction.
        speed: randRange(rand, 0.02, 0.08) * (rand() < 0.5 ? 1 : -1),
        tilt: randRange(rand, -0.6, 0.6),
        depth,
        scale: randRange(rand, 0.6, 1.3) * (0.5 + depth * 0.8),
        spin: rand() * Math.PI * 2,
        spinSpeed: randRange(rand, 0.05, 0.2) * (rand() < 0.5 ? 1 : -1),
        panelPhase: rand() * Math.PI * 2,
        lightPhase: rand() * Math.PI * 2,
        lightSpeed: randRange(rand, 1.5, 3.5),
        hasDish: rand() < 0.6,
      });
    }
  }

  update(state: SceneState): void {
    const { dt } = state;
    for (const s of this.sats) {
      s.angle += s.speed * dt;
      s.spin += s.spinSpeed * dt;
      s.panelPhase += dt * 0.4;
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, time, intensity } = state;
    ctx.save();
    // Depth-scaled parallax for the whole layer.
    for (const s of this.sats) {
      const ox = mouse.x * (8 + s.depth * 20);
      const oy = mouse.y * (6 + s.depth * 14) - scrollY * (0.02 + s.depth * 0.06);
      ctx.save();
      ctx.translate(ox, oy);
      drawSatellite(ctx, s, time, intensity);
      ctx.restore();
    }
    ctx.restore();
  }
}

