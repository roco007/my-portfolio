/* ═══════════════════════════════════════════════════════════════════════════
   EnvironmentalEvents — rare, randomized background events.
   • Shooting stars: a bright point streaks across ~1 s every 10–30 s.
   • Satellite sun-glints: a distant object briefly catches the sun and
     flares, then dims.
   • Distant asteroid: an occasional larger rock drifts through the far field.
   Events are sparse and never overlap the UI in a distracting way.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  len: number;
  brightness: number;
}

interface Glint {
  x: number; y: number;
  life: number; maxLife: number;
  size: number;
  color: string;
}

interface DistantRock {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  rot: number;
  rotSpeed: number;
  life: number; maxLife: number;
}

export class EnvironmentalEvents implements SpaceLayer {
  private shooting: ShootingStar[] = [];
  private glints: Glint[] = [];
  private rocks: DistantRock[] = [];
  private nextShoot = 0;
  private nextGlint = 0;
  private nextRock = 0;
  private width = 0;
  private height = 0;

  init(state: SceneState): void {
    const { width, height, rand, theme } = state;
    this.width = width;
    this.height = height;
    this.shooting = [];
    this.glints = [];
    this.rocks = [];
    if (theme === 'light') return;
    // Schedule the first events with randomized delays.
    this.nextShoot = randRange(rand, 4, 14);
    this.nextGlint = randRange(rand, 6, 20);
    this.nextRock = randRange(rand, 15, 45);
  }

  private spawnShootingStar(rand: () => number): void {
    const angle = randRange(rand, 0.2, 0.9) * Math.PI * (rand() < 0.5 ? 1 : -0.2) + (rand() < 0.5 ? 0 : Math.PI);
    const speed = randRange(rand, 500, 900);
    const life = randRange(rand, 0.7, 1.4);
    this.shooting.push({
      x: rand() * this.width,
      y: rand() * this.height * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.abs(Math.sin(angle)) * speed * 0.6 + 120,
      life,
      maxLife: life,
      len: randRange(rand, 40, 110),
      brightness: randRange(rand, 0.6, 1.0),
    });
  }

  private spawnGlint(rand: () => number): void {
    const life = randRange(rand, 0.8, 1.8);
    this.glints.push({
      x: rand() * this.width,
      y: rand() * this.height,
      life,
      maxLife: life,
      size: randRange(rand, 1.5, 3.5),
      color: rand() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(180,225,255,0.9)',
    });
  }

  private spawnDistantRock(rand: () => number): void {
    const life = randRange(rand, 25, 60);
    const depth = randRange(rand, 0.05, 0.25); // far field
    this.rocks.push({
      x: rand() < 0.5 ? -30 : this.width + 30,
      y: rand() * this.height,
      vx: (rand() < 0.5 ? 1 : -1) * randRange(rand, 3, 9),
      vy: randRange(rand, -2, 2),
      radius: randRange(rand, 8, 20) * (0.6 + depth),
      rot: rand() * Math.PI * 2,
      rotSpeed: randRange(rand, 0.02, 0.12),
      life,
      maxLife: life,
    });
  }

  update(state: SceneState): void {
    const { dt, rand, theme } = state;
    if (theme === 'light') return;

    // ── Timers ────────────────────────────────────────────────────────────
    this.nextShoot -= dt;
    if (this.nextShoot <= 0) {
      this.spawnShootingStar(rand);
      this.nextShoot = randRange(rand, 10, 30); // every 10–30 s
    }
    this.nextGlint -= dt;
    if (this.nextGlint <= 0) {
      this.spawnGlint(rand);
      this.nextGlint = randRange(rand, 8, 24);
    }
    this.nextRock -= dt;
    if (this.nextRock <= 0) {
      this.spawnDistantRock(rand);
      this.nextRock = randRange(rand, 30, 90);
    }

    // ── Advance ───────────────────────────────────────────────────────────
    for (let i = this.shooting.length - 1; i >= 0; i--) {
      const s = this.shooting[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) this.shooting.splice(i, 1);
    }
    for (let i = this.glints.length - 1; i >= 0; i--) {
      this.glints[i].life -= dt;
      if (this.glints[i].life <= 0) this.glints.splice(i, 1);
    }
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.rot += r.rotSpeed * dt;
      r.life -= dt;
      if (r.life <= 0 || r.x < -80 || r.x > this.width + 80) this.rocks.splice(i, 1);
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, intensity, theme, quality } = state;
    if (theme === 'light') return;
    const fancy = quality !== 'low';

    ctx.save();
    const ox = mouse.x * 4;
    const oy = mouse.y * 3 - scrollY * 0.01;
    ctx.translate(ox, oy);

    // ── Distant rocks ─────────────────────────────────────────────────────
    for (const r of this.rocks) {
      const fade = Math.min(1, (r.maxLife - r.life) / 4, r.life / 4);
      ctx.globalAlpha = fade * 0.5 * intensity;
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.fillStyle = 'rgb(96,96,104)';
      ctx.beginPath();
      ctx.moveTo(r.radius, 0);
      ctx.lineTo(r.radius * 0.4, -r.radius * 0.8);
      ctx.lineTo(-r.radius * 0.6, -r.radius * 0.6);
      ctx.lineTo(-r.radius, 0.1 * r.radius);
      ctx.lineTo(-r.radius * 0.5, r.radius * 0.8);
      ctx.lineTo(r.radius * 0.5, r.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ── Satellite sun-glints ──────────────────────────────────────────────
    for (const g of this.glints) {
      const prog = 1 - g.life / g.maxLife;
      const env = Math.sin(prog * Math.PI); // 0→1→0
      ctx.globalAlpha = env * 0.85 * intensity;
      if (fancy) {
        const rg = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size * 6);
        rg.addColorStop(0, g.color);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size * env, 0, Math.PI * 2);
      ctx.fill();
      // Subtle cross flare.
      ctx.globalAlpha = env * 0.4 * intensity;
      ctx.strokeStyle = '#dff4ff';
      ctx.lineWidth = 0.6;
      const fl = g.size * 5 * env;
      ctx.beginPath();
      ctx.moveTo(g.x - fl, g.y); ctx.lineTo(g.x + fl, g.y);
      ctx.moveTo(g.x, g.y - fl); ctx.lineTo(g.x, g.y + fl);
      ctx.stroke();
    }

    // ── Shooting stars ────────────────────────────────────────────────────
    for (const s of this.shooting) {
      const prog = 1 - s.life / s.maxLife;
      const fade = Math.min(1, prog * 4, s.life / (s.maxLife * 0.3));
      const hn = Math.hypot(s.vx, s.vy) || 1;
      const nx = s.vx / hn;
      const ny = s.vy / hn;
      const tailX = s.x - nx * s.len;
      const tailY = s.y - ny * s.len;

      ctx.globalAlpha = fade * 0.9 * s.brightness * intensity;
      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, 'rgba(200,230,255,0)');
      grad.addColorStop(1, 'rgba(255,255,255,0.9)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Bright head.
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6 * s.brightness, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

