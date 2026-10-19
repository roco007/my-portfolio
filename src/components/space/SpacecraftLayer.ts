/* ═══════════════════════════════════════════════════════════════════════════
   SpacecraftLayer — occasional futuristic craft drifting across the scene.
   Craft spawn at a random edge, travel diagonally over 20–60 s with a subtle
   engine glow, then fade out rather than teleporting. Sparse by design so they
   never dominate the viewport.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

interface Craft {
  x: number; y: number;
  vx: number; vy: number;   // px/s
  heading: number;          // radians (for drawing orientation)
  scale: number;
  depth: number;
  life: number;             // seconds remaining
  maxLife: number;
  glowPhase: number;
  trail: { x: number; y: number }[]; // recent positions for engine trail
}

function drawCraft(ctx: CanvasRenderingContext2D, c: Craft, alpha: number, intensity: number, fancy: boolean): void {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.heading);
  ctx.scale(c.scale, c.scale);
  ctx.globalAlpha = alpha * intensity;

  // ── Engine trail ───────────────────────────────────────────────────────
  if (fancy && c.trail.length > 1) {
    ctx.save();
    ctx.rotate(-c.heading); // trail drawn in world space
    for (let i = 1; i < c.trail.length; i++) {
      const p0 = c.trail[i - 1], p1 = c.trail[i];
      const f = i / c.trail.length;
      ctx.globalAlpha = alpha * f * 0.25 * intensity;
      ctx.strokeStyle = '#7fd8ff';
      ctx.lineWidth = 1.2 * f;
      ctx.beginPath();
      ctx.moveTo(p0.x - c.x, p0.y - c.y);
      ctx.lineTo(p1.x - c.x, p1.y - c.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Hull (elongated diamond) ───────────────────────────────────────────
  ctx.globalAlpha = alpha * intensity;
  const hull = ctx.createLinearGradient(-10, 0, 12, 0);
  hull.addColorStop(0, 'rgba(180,188,200,0.95)');
  hull.addColorStop(0.6, 'rgba(120,128,142,0.95)');
  hull.addColorStop(1, 'rgba(70,76,90,0.95)');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(12, 0);      // nose
  ctx.lineTo(-6, -4);     // top back
  ctx.lineTo(-10, 0);     // tail
  ctx.lineTo(-6, 4);      // bottom back
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,226,236,0.4)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // ── Cockpit hint ───────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(120,200,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(6, 0, 2, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Engine glow at the tail ────────────────────────────────────────────
  if (fancy) {
    const flick = 0.7 + 0.3 * Math.sin(c.glowPhase);
    const eg = ctx.createRadialGradient(-10, 0, 0, -10, 0, 9 * flick);
    eg.addColorStop(0, 'rgba(140,225,255,0.9)');
    eg.addColorStop(0.4, 'rgba(90,170,255,0.45)');
    eg.addColorStop(1, 'rgba(60,120,255,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(-10, 0, 9 * flick, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(140,225,255,0.7)';
    ctx.beginPath();
    ctx.arc(-10, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export class SpacecraftLayer implements SpaceLayer {
  private craft: Craft[] = [];
  private spawnTimer = 0;
  private maxConcurrent = 1;
  private width = 0;
  private height = 0;

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.width = width;
    this.height = height;
    this.craft = [];
    if (theme === 'light') return;
    this.maxConcurrent = quality === 'low' ? 1 : quality === 'medium' ? 1 : 2;
    this.spawnTimer = randRange(rand, 3, 10); // first craft soon-ish
  }

  private spawn(rand: () => number): void {
    const edge = Math.floor(rand() * 4);
    let x: number, y: number;
    const margin = 40;
    switch (edge) {
      case 0: x = -margin; y = rand() * this.height; break;
      case 1: x = this.width + margin; y = rand() * this.height; break;
      case 2: x = rand() * this.width; y = -margin; break;
      default: x = rand() * this.width; y = this.height + margin; break;
    }
    // Diagonal-ish heading toward the opposite side.
    const targetX = this.width - x + randRange(rand, -this.width * 0.3, this.width * 0.3);
    const targetY = this.height - y + randRange(rand, -this.height * 0.3, this.height * 0.3);
    const heading = Math.atan2(targetY, targetX);
    const duration = randRange(rand, 20, 60); // seconds to cross
    const dist = Math.hypot(targetX, targetY);
    const speed = dist / duration;
    const depth = randRange(rand, 0.3, 0.8);
    this.craft.push({
      x, y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      heading,
      scale: randRange(rand, 0.5, 1.1) * (0.6 + depth * 0.7),
      depth,
      life: duration + 4,
      maxLife: duration + 4,
      glowPhase: rand() * Math.PI * 2,
      trail: [],
    });
  }

  update(state: SceneState): void {
    const { dt, rand, quality, theme } = state;
    if (theme === 'light') return;

    // Spawn logic.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.craft.length < this.maxConcurrent) {
      this.spawn(rand);
      const gap = quality === 'low' ? randRange(rand, 25, 55) : randRange(rand, 15, 40);
      this.spawnTimer = gap;
    } else if (this.spawnTimer <= 0) {
      this.spawnTimer = randRange(rand, 5, 12);
    }

    for (let i = this.craft.length - 1; i >= 0; i--) {
      const c = this.craft[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      c.glowPhase += dt * 6;
      // Record trail (bounded).
      c.trail.push({ x: c.x, y: c.y });
      if (c.trail.length > 14) c.trail.shift();
      // Remove when life ends or fully off-screen.
      if (c.life <= 0 || c.x < -120 || c.x > this.width + 120 || c.y < -120 || c.y > this.height + 120) {
        this.craft.splice(i, 1);
      }
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, intensity, quality, theme } = state;
    if (theme === 'light') return;
    const fancy = quality !== 'low';
    ctx.save();
    for (const c of this.craft) {
      // Fade in/out at the ends of life.
      const fadeIn = Math.min(1, (c.maxLife - c.life) / 3);
      const fadeOut = Math.min(1, c.life / 3);
      const alpha = Math.min(fadeIn, fadeOut) * (0.4 + c.depth * 0.6);
      const ox = mouse.x * (8 + c.depth * 18);
      const oy = mouse.y * (6 + c.depth * 12) - scrollY * (0.02 + c.depth * 0.06);
      ctx.save();
      ctx.translate(ox, oy);
      drawCraft(ctx, c, alpha, intensity, fancy);
      ctx.restore();
    }
    ctx.restore();
  }
}

