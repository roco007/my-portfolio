/* ═══════════════════════════════════════════════════════════════════════════
   CometLayer — cinematic comets with multi-layered dust & ion tails.
   Each comet sweeps across the scene on a realistic parabolic arc with:
   - Bright nucleus (dust coma + rocky core)
   - Long curved dust tail (yellow-white, blown radially away from "sun")
   - Shorter ion tail (blue-white, straight anti-sunward)
   - Subtle light reflection off the coma as it approaches perihelion
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

interface Comet {
  // Current position (world px)
  x: number;
  y: number;
  // Velocity (px/s)
  vx: number;
  vy: number;
  // Nucleus size
  nucleusR: number;
  // Speed scalar
  speed: number;
  // Depth for parallax & brightness
  depth: number;
  // Lifetime bookkeeping
  life: number;
  maxLife: number;
  // Phase offset for coma shimmer
  phase: number;
  // Historical trail positions for dust tail
  trail: { x: number; y: number }[];
  // "Sun" direction (upper-left by default, varies per comet)
  sunAngle: number;
}

function drawComet(
  ctx: CanvasRenderingContext2D,
  c: Comet,
  intensity: number,
  fancy: boolean
): void {
  if (c.trail.length < 2) return;

  const alpha = (0.35 + c.depth * 0.65) * intensity;
  const lifeRatio = c.life / c.maxLife;
  const fadeAlpha = alpha * Math.min(1, lifeRatio * 6, (1 - lifeRatio) * 6);
  if (fadeAlpha <= 0.01) return;

  ctx.save();

  // ── Ion Tail (straight, blue-white, anti-sunward direction) ──────────────
  if (fancy) {
    const ionDir = c.sunAngle + Math.PI; // away from "sun"
    const ionLen = 60 + c.nucleusR * 22;
    const ionEndX = c.x + Math.cos(ionDir) * ionLen;
    const ionEndY = c.y + Math.sin(ionDir) * ionLen;

    const ionGrad = ctx.createLinearGradient(c.x, c.y, ionEndX, ionEndY);
    ionGrad.addColorStop(0, `rgba(160, 220, 255, ${(fadeAlpha * 0.55).toFixed(3)})`);
    ionGrad.addColorStop(0.4, `rgba(120, 190, 255, ${(fadeAlpha * 0.25).toFixed(3)})`);
    ionGrad.addColorStop(1, 'rgba(80, 160, 255, 0)');

    ctx.beginPath();
    ctx.strokeStyle = ionGrad;
    ctx.lineWidth = 0.8 + c.nucleusR * 0.3;
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(ionEndX, ionEndY);
    ctx.stroke();
  }

  // ── Dust Tail (curved, yellow-white, broader) ─────────────────────────────
  if (c.trail.length >= 3) {
    const maxPoints = Math.min(c.trail.length, 60);
    const trailStart = Math.max(0, c.trail.length - maxPoints);

    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    for (let i = c.trail.length - 1; i >= trailStart; i--) {
      ctx.lineTo(c.trail[i].x, c.trail[i].y);
    }

    // Dust tail gradient along the stroke — requires setting style before lineWidth
    const tailLen = Math.hypot(
      c.x - c.trail[trailStart].x,
      c.y - c.trail[trailStart].y
    );
    if (tailLen > 2) {
      const dustGrad = ctx.createLinearGradient(
        c.x, c.y,
        c.trail[trailStart].x, c.trail[trailStart].y
      );
      dustGrad.addColorStop(0, `rgba(255, 245, 200, ${(fadeAlpha * 0.65).toFixed(3)})`);
      dustGrad.addColorStop(0.25, `rgba(255, 230, 160, ${(fadeAlpha * 0.35).toFixed(3)})`);
      dustGrad.addColorStop(0.6, `rgba(240, 200, 120, ${(fadeAlpha * 0.12).toFixed(3)})`);
      dustGrad.addColorStop(1, 'rgba(200, 160, 80, 0)');
      ctx.strokeStyle = dustGrad;
      ctx.lineWidth = 2.5 + c.nucleusR;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // ── Coma (diffuse glowing cloud around nucleus) ───────────────────────────
  const comaR = c.nucleusR * (3.5 + Math.sin(c.phase) * 0.4);
  const coma = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, comaR);
  coma.addColorStop(0, `rgba(255, 255, 240, ${(fadeAlpha * 0.9).toFixed(3)})`);
  coma.addColorStop(0.3, `rgba(255, 240, 190, ${(fadeAlpha * 0.5).toFixed(3)})`);
  coma.addColorStop(0.7, `rgba(240, 210, 140, ${(fadeAlpha * 0.18).toFixed(3)})`);
  coma.addColorStop(1, 'rgba(200, 170, 100, 0)');
  ctx.fillStyle = coma;
  ctx.beginPath();
  ctx.arc(c.x, c.y, comaR, 0, Math.PI * 2);
  ctx.fill();

  // ── Rocky Nucleus ─────────────────────────────────────────────────────────
  const nucGrad = ctx.createRadialGradient(
    c.x - c.nucleusR * 0.3, c.y - c.nucleusR * 0.3, 0,
    c.x, c.y, c.nucleusR
  );
  nucGrad.addColorStop(0, `rgba(255, 255, 255, ${fadeAlpha.toFixed(3)})`);
  nucGrad.addColorStop(0.5, `rgba(220, 210, 180, ${(fadeAlpha * 0.95).toFixed(3)})`);
  nucGrad.addColorStop(1, `rgba(140, 130, 110, ${(fadeAlpha * 0.8).toFixed(3)})`);
  ctx.fillStyle = nucGrad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.nucleusR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export class CometLayer implements SpaceLayer {
  private comets: Comet[] = [];
  private spawnTimer = 0;
  private width = 0;
  private height = 0;
  private maxConcurrent = 1;

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.width = width;
    this.height = height;
    this.comets = [];
    if (theme === 'light') return;
    this.maxConcurrent = quality === 'low' ? 1 : quality === 'medium' ? 1 : 2;
    // Stagger initial spawn
    this.spawnTimer = randRange(rand, 8, 25);
  }

  private spawn(rand: () => number): void {
    // Comets enter from upper-left quadrant edges sweeping to lower-right
    const edge = Math.floor(rand() * 2); // 0=top, 1=left
    let x: number, y: number;
    const margin = 80;

    if (edge === 0) {
      x = randRange(rand, this.width * 0.05, this.width * 0.7);
      y = -margin;
    } else {
      x = -margin;
      y = randRange(rand, 0, this.height * 0.6);
    }

    // Heading: generally upper-left → lower-right with some variance
    const baseAngle = Math.PI * 0.25 + (rand() - 0.5) * 0.8;
    const speed = randRange(rand, 55, 140);
    const duration = randRange(rand, 18, 40);
    const depth = randRange(rand, 0.25, 0.85);

    this.comets.push({
      x, y,
      vx: Math.cos(baseAngle) * speed,
      vy: Math.sin(baseAngle) * speed,
      nucleusR: randRange(rand, 1.5, 3.5) * (0.6 + depth * 0.7),
      speed,
      depth,
      life: duration,
      maxLife: duration,
      phase: rand() * Math.PI * 2,
      trail: [],
      // "Sun" is roughly upper-left
      sunAngle: -Math.PI * 0.75 + (rand() - 0.5) * 0.5,
    });
  }

  update(state: SceneState): void {
    const { dt, rand, theme } = state;
    if (theme === 'light') return;

    // Spawn control
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.comets.length < this.maxConcurrent) {
      this.spawn(rand);
      this.spawnTimer = randRange(rand, 20, 55);
    } else if (this.spawnTimer <= 0) {
      this.spawnTimer = randRange(rand, 5, 15);
    }

    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      c.phase += dt * 2.2;
      // Record position for dust tail (sample at ~20Hz)
      c.trail.push({ x: c.x, y: c.y });
      if (c.trail.length > 80) c.trail.shift();

      if (
        c.life <= 0 ||
        c.x < -200 || c.x > this.width + 200 ||
        c.y < -200 || c.y > this.height + 200
      ) {
        this.comets.splice(i, 1);
      }
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, intensity, quality, theme, journey } = state;
    if (theme === 'light') return;
    const fancy = quality !== 'low';

    // Comets are more common/visible during nebula_asteroids & deep_space sections
    const sectionBoost = (
      journey.currentSection.id === 'nebula_asteroids' ||
      journey.currentSection.id === 'deep_space_stars' ||
      journey.currentSection.id === 'galaxy'
    ) ? 1.3 : 1.0;

    ctx.save();
    for (const c of this.comets) {
      const ox = mouse.x * (6 + c.depth * 16) + journey.camera.swayX * c.depth * 0.3;
      const oy = mouse.y * (4 + c.depth * 10) - scrollY * (0.01 + c.depth * 0.04) + journey.camera.swayY * c.depth * 0.3;

      // Translate the comet temporarily for parallax, then pass original coords
      const savedX = c.x; const savedY = c.y;
      c.x += ox; c.y += oy;
      // Also shift trail
      for (const p of c.trail) { p.x += ox; p.y += oy; }
      drawComet(ctx, c, intensity * sectionBoost, fancy);
      // Restore
      c.x = savedX; c.y = savedY;
      for (const p of c.trail) { p.x -= ox; p.y -= oy; }
    }
    ctx.restore();
  }
}
