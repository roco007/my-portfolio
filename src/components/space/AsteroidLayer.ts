/* ═══════════════════════════════════════════════════════════════════════════
   AsteroidLayer — sparse field of irregular tumbling rocks & debris.
   Kept deliberately sparse so it adds depth without distracting from content.
   Each rock is an irregular polygon that drifts slowly and tumbles at its own
   rate, with subtle directional lighting (sun upper-left).
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

interface Asteroid {
  x: number; y: number;
  vx: number; vy: number;   // px/s drift
  radius: number;
  rot: number;
  rotSpeed: number;
  depth: number;
  verts: { a: number; r: number }[]; // irregular outline
  tone: number;             // base gray tone
  hasCrater: boolean;
}

function buildAsteroid(rand: () => number, depth: number): Asteroid {
  const n = 7 + Math.floor(rand() * 5); // 7–11 vertices
  const verts: { a: number; r: number }[] = [];
  for (let i = 0; i < n; i++) {
    verts.push({
      a: (i / n) * Math.PI * 2,
      r: randRange(rand, 0.65, 1.15), // radius multiplier → irregular shape
    });
  }
  const radius = randRange(rand, 3, 14) * (0.5 + depth);
  return {
    x: 0, y: 0,
    vx: randRange(rand, -4, 4),
    vy: randRange(rand, -2, 2),
    radius,
    rot: rand() * Math.PI * 2,
    rotSpeed: randRange(rand, 0.05, 0.35) * (rand() < 0.5 ? 1 : -1),
    depth,
    verts,
    tone: randRange(rand, 70, 140),
    hasCrater: rand() < 0.5,
  };
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid, intensity: number): void {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  ctx.globalAlpha = (0.3 + a.depth * 0.6) * intensity;

  // Irregular polygon body with directional shading (lit upper-left).
  const grad = ctx.createLinearGradient(-a.radius, -a.radius, a.radius, a.radius);
  const t = Math.round(a.tone);
  grad.addColorStop(0, `rgb(${Math.min(255, t + 45)},${Math.min(255, t + 45)},${Math.min(255, t + 50)})`);
  grad.addColorStop(1, `rgb(${Math.max(0, t - 40)},${Math.max(0, t - 40)},${Math.max(0, t - 35)})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  a.verts.forEach((v, i) => {
    const vx = Math.cos(v.a) * v.r * a.radius;
    const vy = Math.sin(v.a) * v.r * a.radius;
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  });
  ctx.closePath();
  ctx.fill();

  // Rim light on the sunward edge.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Occasional crater detail.
  if (a.hasCrater && a.radius > 5) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(a.radius * 0.2, -a.radius * 0.15, a.radius * 0.22, a.radius * 0.18, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export class AsteroidLayer implements SpaceLayer {
  private rocks: Asteroid[] = [];
  private width = 0;
  private height = 0;

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.width = width;
    this.height = height;
    this.rocks = [];
    if (theme === 'light') return;

    const count = quality === 'low' ? 8 : quality === 'medium' ? 16 : 26;
    for (let i = 0; i < count; i++) {
      const depth = randRange(rand, 0.1, 0.95);
      const a = buildAsteroid(rand, depth);
      a.x = rand() * width;
      a.y = rand() * height;
      // Scale drift with depth (foreground moves faster).
      a.vx *= 0.5 + depth;
      a.vy *= 0.5 + depth;
      this.rocks.push(a);
    }
  }

  update(state: SceneState): void {
    const { dt } = state;
    for (const a of this.rocks) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.rotSpeed * dt;
      // Wrap around edges.
      if (a.x < -40) a.x = this.width + 40;
      else if (a.x > this.width + 40) a.x = -40;
      if (a.y < -40) a.y = this.height + 40;
      else if (a.y > this.height + 40) a.y = -40;
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, intensity, theme } = state;
    if (theme === 'light') return;
    ctx.save();
    for (const a of this.rocks) {
      const ox = mouse.x * (8 + a.depth * 22);
      const oy = mouse.y * (6 + a.depth * 16) - scrollY * (0.02 + a.depth * 0.08);
      ctx.save();
      ctx.translate(ox, oy);
      drawAsteroid(ctx, a, intensity);
      ctx.restore();
    }
    ctx.restore();
  }
}
