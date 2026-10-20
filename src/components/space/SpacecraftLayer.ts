/* ═══════════════════════════════════════════════════════════════════════════
   SpacecraftLayer — diverse fleet of spacecraft drifting across the scene.
   Three distinct craft archetypes rendered in detail:
   1. Fighter/shuttle — sleek elongated hull with swept delta wings
   2. ISS-style — modular station segment with large multi-panel solar arrays
   3. Deep-space probe — compact bus with dish antenna and long boom arms
   Each craft fades in at spawn, travels on a diagonal trajectory, and fades
   out gracefully. Engine glows flicker. Trails stream from all engines.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

type CraftType = 'shuttle' | 'iss_module' | 'probe';

interface Craft {
  x: number; y: number;
  vx: number; vy: number;
  heading: number;
  scale: number;
  depth: number;
  life: number;
  maxLife: number;
  glowPhase: number;
  trail: { x: number; y: number }[];
  type: CraftType;
}

// ── Shuttle / Fighter ─────────────────────────────────────────────────────
function drawShuttle(ctx: CanvasRenderingContext2D, c: Craft, alpha: number, intensity: number, fancy: boolean): void {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.heading);
  ctx.scale(c.scale, c.scale);
  ctx.globalAlpha = alpha * intensity;

  // Engine trail
  if (fancy && c.trail.length > 1) {
    ctx.save();
    ctx.rotate(-c.heading);
    for (let i = 1; i < c.trail.length; i++) {
      const f = i / c.trail.length;
      ctx.globalAlpha = alpha * f * 0.22 * intensity;
      ctx.strokeStyle = `hsl(${185 + f * 30}, 90%, 70%)`;
      ctx.lineWidth = 1.4 * f;
      ctx.beginPath();
      ctx.moveTo(c.trail[i - 1].x - c.x, c.trail[i - 1].y - c.y);
      ctx.lineTo(c.trail[i].x - c.x, c.trail[i].y - c.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.globalAlpha = alpha * intensity;

  // Delta wings
  const wingGrad = ctx.createLinearGradient(-8, -7, 2, 0);
  wingGrad.addColorStop(0, 'rgba(80,90,108,0.9)');
  wingGrad.addColorStop(1, 'rgba(140,148,164,0.9)');
  ctx.fillStyle = wingGrad;
  // Left wing
  ctx.beginPath();
  ctx.moveTo(8, 0); ctx.lineTo(-8, -8); ctx.lineTo(-12, -1); ctx.closePath();
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(8, 0); ctx.lineTo(-8, 8); ctx.lineTo(-12, 1); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,210,230,0.3)';
  ctx.lineWidth = 0.4;
  ctx.stroke();

  // Fuselage
  const hull = ctx.createLinearGradient(-12, 0, 14, 0);
  hull.addColorStop(0, 'rgba(70,76,90,0.95)');
  hull.addColorStop(0.45, 'rgba(175,183,198,0.95)');
  hull.addColorStop(1, 'rgba(220,228,240,0.9)');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(-4, -4); ctx.lineTo(-12, -2); ctx.lineTo(-12, 2); ctx.lineTo(-4, 4); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,228,240,0.3)';
  ctx.lineWidth = 0.4;
  ctx.stroke();

  // Cockpit
  ctx.fillStyle = 'rgba(130,210,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(9, 0, 2.8, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine pods (two small nacelles)
  for (const side of [-1, 1]) {
    ctx.fillStyle = 'rgba(90,96,110,0.95)';
    ctx.beginPath();
    ctx.ellipse(-9, side * 5.5, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    if (fancy) {
      const flick = 0.7 + 0.3 * Math.sin(c.glowPhase + side);
      const eg = ctx.createRadialGradient(-12, side * 5.5, 0, -12, side * 5.5, 5 * flick);
      eg.addColorStop(0, 'rgba(140,230,255,0.9)');
      eg.addColorStop(0.5, 'rgba(90,170,255,0.35)');
      eg.addColorStop(1, 'rgba(60,120,255,0)');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(-12, side * 5.5, 5 * flick, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ── ISS Module Segment ──────────────────────────────────────────────────
function drawISSModule(ctx: CanvasRenderingContext2D, c: Craft, alpha: number, intensity: number, fancy: boolean): void {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.heading);
  ctx.scale(c.scale, c.scale);
  ctx.globalAlpha = alpha * intensity;

  const metal = (l: number) => `rgba(${l},${l + 5},${l + 12},0.95)`;

  // Central truss spine
  ctx.strokeStyle = metal(130);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-55, 0); ctx.lineTo(55, 0);
  ctx.stroke();
  // Truss lattice
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'rgba(150,158,172,0.45)';
  for (let x = -55; x < 55; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, -2.5); ctx.lineTo(x + 7, 2.5);
    ctx.moveTo(x, 2.5); ctx.lineTo(x + 7, -2.5);
    ctx.stroke();
  }

  // Habitat modules
  for (const mx of [-32, -14, 4, 22]) {
    const grad = ctx.createLinearGradient(mx, -6, mx, 6);
    grad.addColorStop(0, metal(195));
    grad.addColorStop(0.5, metal(130));
    grad.addColorStop(1, metal(58));
    ctx.fillStyle = grad;
    ctx.fillRect(mx, -6, 15, 12);
    ctx.strokeStyle = 'rgba(200,210,228,0.3)';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(mx, -6, 15, 12);
    ctx.strokeStyle = 'rgba(90,96,110,0.4)';
    ctx.beginPath();
    ctx.moveTo(mx + 7.5, -6); ctx.lineTo(mx + 7.5, 6);
    ctx.stroke();
  }

  // 4 large solar array wings
  for (const [sx, sy] of [[-18, -1], [-18, 1], [20, -1], [20, 1]] as [number, number][]) {
    ctx.save();
    ctx.translate(sx * 2, sy * 14);
    const ww = 36, wh = 16;
    const panGrad = ctx.createLinearGradient(0, -wh / 2, 0, wh / 2);
    panGrad.addColorStop(0, 'rgba(30,70,140,0.95)');
    panGrad.addColorStop(0.5, 'rgba(60,110,200,0.95)');
    panGrad.addColorStop(1, 'rgba(20,50,110,0.9)');
    ctx.fillStyle = panGrad;
    ctx.fillRect(-ww / 2, -wh / 2, ww, wh);
    ctx.strokeStyle = 'rgba(140,185,255,0.3)';
    ctx.lineWidth = 0.4;
    for (let ci = 1; ci < 5; ci++) {
      const gx = -ww / 2 + (ww / 5) * ci;
      ctx.beginPath(); ctx.moveTo(gx, -wh / 2); ctx.lineTo(gx, wh / 2); ctx.stroke();
    }
    for (let ri = 1; ri < 3; ri++) {
      const gy = -wh / 2 + (wh / 3) * ri;
      ctx.beginPath(); ctx.moveTo(-ww / 2, gy); ctx.lineTo(ww / 2, gy); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(-ww / 2, -wh / 2, ww, wh * 0.2);
    ctx.restore();
  }

  // Navigation lights
  if (fancy) {
    const blink = (col: string, px: number, py: number, i: number) => {
      const b = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(c.glowPhase + i * 1.9));
      ctx.globalAlpha = b * alpha * intensity;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fill();
    };
    blink('#ff4b4b', -55, 0, 0);
    blink('#38f0c0', 55, 0, 1);
    blink('#ffffff', 0, -8, 2);
  }

  ctx.restore();
}

// ── Deep-Space Probe ────────────────────────────────────────────────────
function drawProbe(ctx: CanvasRenderingContext2D, c: Craft, alpha: number, intensity: number, fancy: boolean): void {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.heading);
  ctx.scale(c.scale, c.scale);
  ctx.globalAlpha = alpha * intensity;

  const metal = (l: number, a = 0.95) => `rgba(${l},${l + 5},${l + 12},${a})`;

  // Central bus (compact box)
  const busGrad = ctx.createLinearGradient(-6, -5, 6, 5);
  busGrad.addColorStop(0, metal(210));
  busGrad.addColorStop(0.5, metal(145));
  busGrad.addColorStop(1, metal(80));
  ctx.fillStyle = busGrad;
  ctx.fillRect(-6, -5, 12, 10);
  ctx.strokeStyle = 'rgba(220,228,240,0.4)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-6, -5, 12, 10);

  // High-gain dish antenna
  ctx.fillStyle = metal(185, 0.9);
  ctx.beginPath();
  ctx.ellipse(10, -6, 6, 3.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = metal(120, 0.7);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(7, -4); ctx.lineTo(5, -1);
  ctx.stroke();

  // RTG boom arm (right)
  ctx.strokeStyle = metal(130);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-6, 0); ctx.lineTo(-22, 0);
  ctx.stroke();
  // RTG cylinder
  ctx.fillStyle = 'rgba(60,70,90,0.95)';
  ctx.beginPath();
  ctx.ellipse(-24, 0, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Warm nuclear glow
  if (fancy) {
    const rtgGlow = ctx.createRadialGradient(-24, 0, 0, -24, 0, 8);
    rtgGlow.addColorStop(0, 'rgba(255, 180, 60, 0.5)');
    rtgGlow.addColorStop(1, 'rgba(255, 120, 30, 0)');
    ctx.fillStyle = rtgGlow;
    ctx.beginPath();
    ctx.arc(-24, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Compact solar panel (one side only — probe is mostly RTG powered)
  const pw = 18, ph = 10;
  ctx.fillStyle = 'rgba(35,75,150,0.92)';
  ctx.fillRect(-pw / 2 + 2, 6, pw, ph);
  ctx.strokeStyle = 'rgba(130,180,255,0.3)';
  ctx.lineWidth = 0.4;
  for (let i = 1; i < 4; i++) {
    const gx = -pw / 2 + 2 + (pw / 4) * i;
    ctx.beginPath(); ctx.moveTo(gx, 6); ctx.lineTo(gx, 6 + ph); ctx.stroke();
  }

  // Thruster nozzle
  ctx.fillStyle = metal(90);
  ctx.beginPath();
  ctx.moveTo(-6, -2); ctx.lineTo(-11, -3); ctx.lineTo(-11, 3); ctx.lineTo(-6, 2); ctx.closePath();
  ctx.fill();
  if (fancy) {
    const flick = 0.5 + 0.5 * Math.sin(c.glowPhase);
    const eg = ctx.createRadialGradient(-11, 0, 0, -11, 0, 6 * flick);
    eg.addColorStop(0, 'rgba(160,240,255,0.85)');
    eg.addColorStop(1, 'rgba(60,140,255,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(-11, 0, 6 * flick, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export class SpacecraftLayer implements SpaceLayer {
  private craft: Craft[] = [];
  private spawnTimer = 0;
  private maxConcurrent = 2;
  private width = 0;
  private height = 0;

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.width = width;
    this.height = height;
    this.craft = [];
    if (theme === 'light') return;
    this.maxConcurrent = quality === 'low' ? 1 : quality === 'medium' ? 2 : 3;
    this.spawnTimer = randRange(rand, 4, 14);
  }

  private spawn(rand: () => number): void {
    const edge = Math.floor(rand() * 4);
    let x: number, y: number;
    const margin = 60;
    switch (edge) {
      case 0: x = -margin; y = rand() * this.height; break;
      case 1: x = this.width + margin; y = rand() * this.height; break;
      case 2: x = rand() * this.width; y = -margin; break;
      default: x = rand() * this.width; y = this.height + margin; break;
    }

    const targetX = this.width - x + randRange(rand, -this.width * 0.3, this.width * 0.3);
    const targetY = this.height - y + randRange(rand, -this.height * 0.3, this.height * 0.3);
    const heading = Math.atan2(targetY, targetX);
    const duration = randRange(rand, 22, 70);
    const dist = Math.hypot(targetX, targetY);
    const speed = dist / duration;
    const depth = randRange(rand, 0.25, 0.88);

    // Pick craft archetype — ISS modules rarer, probes common in deep space
    const roll = rand();
    const type: CraftType = roll < 0.45 ? 'shuttle' : roll < 0.72 ? 'probe' : 'iss_module';

    // ISS modules are slower and bigger
    const scaleBase = type === 'iss_module' ? 0.35 : type === 'probe' ? 0.55 : 0.5;

    this.craft.push({
      x, y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      heading,
      scale: randRange(rand, scaleBase, scaleBase + 0.45) * (0.5 + depth * 0.7),
      depth,
      life: duration + 5,
      maxLife: duration + 5,
      glowPhase: rand() * Math.PI * 2,
      trail: [],
      type,
    });
  }

  update(state: SceneState): void {
    const { dt, rand, theme } = state;
    if (theme === 'light') return;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.craft.length < this.maxConcurrent) {
      this.spawn(rand);
      this.spawnTimer = randRange(rand, 18, 50);
    } else if (this.spawnTimer <= 0) {
      this.spawnTimer = randRange(rand, 5, 14);
    }

    for (let i = this.craft.length - 1; i >= 0; i--) {
      const c = this.craft[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      c.glowPhase += dt * 5;
      c.trail.push({ x: c.x, y: c.y });
      if (c.trail.length > 16) c.trail.shift();
      if (c.life <= 0 || c.x < -200 || c.x > this.width + 200 || c.y < -200 || c.y > this.height + 200) {
        this.craft.splice(i, 1);
      }
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, intensity, quality, theme, journey } = state;
    if (theme === 'light') return;
    const fancy = quality !== 'low';

    ctx.save();
    for (const c of this.craft) {
      const fadeIn = Math.min(1, (c.maxLife - c.life) / 4);
      const fadeOut = Math.min(1, c.life / 4);
      const alpha = Math.min(fadeIn, fadeOut) * (0.35 + c.depth * 0.65);
      const ox = mouse.x * (8 + c.depth * 18) + journey.camera.swayX * c.depth * 0.5;
      const oy = mouse.y * (6 + c.depth * 12) - scrollY * (0.02 + c.depth * 0.06) + journey.camera.swayY * c.depth * 0.5;

      ctx.save();
      ctx.translate(ox, oy);
      switch (c.type) {
        case 'shuttle':   drawShuttle(ctx, c, alpha, intensity, fancy);    break;
        case 'iss_module': drawISSModule(ctx, c, alpha, intensity, fancy);  break;
        case 'probe':     drawProbe(ctx, c, alpha, intensity, fancy);      break;
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
