/* ═══════════════════════════════════════════════════════════════════════════
   AsteroidLayer — rich debris field: rocky asteroids + metallic chunks.
   Features:
   - Irregular polygon outlines with realistic directional shading
   - Multiple crater details with raised rims and central peaks
   - Two material types: carbonaceous (dark) and metallic (bright)
   - Dust trails for fast-moving large rocks
   - Speed surge when passing through the asteroid belt section
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

type AsteroidMaterial = 'carbonaceous' | 'metallic' | 'silicaceous';

interface Crater {
  cx: number; cy: number; r: number;
}

interface Asteroid {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  rot: number;
  rotSpeed: number;
  depth: number;
  verts: { a: number; r: number }[];
  material: AsteroidMaterial;
  tone: number;
  craters: Crater[];
  dustTrail: { x: number; y: number }[];
}

const MATERIAL_TONES: Record<AsteroidMaterial, { base: number; variance: number; highlight: number }> = {
  carbonaceous: { base: 52,  variance: 20,  highlight: 90 },
  silicaceous:  { base: 90,  variance: 35,  highlight: 155 },
  metallic:     { base: 130, variance: 40,  highlight: 230 },
};

function buildAsteroid(rand: () => number, depth: number): Asteroid {
  const n = 8 + Math.floor(rand() * 5);
  const verts: { a: number; r: number }[] = [];
  for (let i = 0; i < n; i++) {
    verts.push({
      a: (i / n) * Math.PI * 2 + (rand() - 0.5) * (Math.PI / n) * 0.6,
      r: randRange(rand, 0.6, 1.18),
    });
  }

  const radius = randRange(rand, 3.5, 15) * (0.45 + depth * 1.0);

  // Material distribution
  const matRoll = rand();
  const material: AsteroidMaterial = matRoll < 0.55 ? 'carbonaceous' : matRoll < 0.82 ? 'silicaceous' : 'metallic';
  const { base, variance } = MATERIAL_TONES[material];
  const tone = base + rand() * variance;

  // Craters — larger rocks get more craters
  const craterCount = radius > 8 ? 2 + Math.floor(rand() * 4) : Math.floor(rand() * 2);
  const craters: Crater[] = [];
  for (let c = 0; c < craterCount; c++) {
    const ca = rand() * Math.PI * 2;
    const cd = rand() * radius * 0.55;
    craters.push({
      cx: Math.cos(ca) * cd,
      cy: Math.sin(ca) * cd,
      r: randRange(rand, radius * 0.08, radius * 0.22),
    });
  }

  return {
    x: 0, y: 0,
    vx: randRange(rand, -5, 5),
    vy: randRange(rand, -2.5, 2.5),
    radius,
    rot: rand() * Math.PI * 2,
    rotSpeed: randRange(rand, 0.04, 0.38) * (rand() < 0.5 ? 1 : -1),
    depth,
    verts,
    material,
    tone,
    craters,
    dustTrail: [],
  };
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid, intensity: number): void {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);

  const alpha = (0.28 + a.depth * 0.65) * intensity;
  ctx.globalAlpha = alpha;

  const { highlight } = MATERIAL_TONES[a.material];
  const t = Math.round(a.tone);

  // Body with directional shading (lit upper-left)
  const grad = ctx.createLinearGradient(-a.radius, -a.radius, a.radius * 0.7, a.radius * 0.7);
  grad.addColorStop(0, `rgb(${Math.min(255, t + 45)},${Math.min(255, t + 44)},${Math.min(255, t + 42)})`);
  grad.addColorStop(0.45, `rgb(${t},${t - 2},${Math.max(0, t - 5)})`);
  grad.addColorStop(1, `rgb(${Math.max(0, t - 45)},${Math.max(0, t - 46)},${Math.max(0, t - 48)})`);
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

  // Rim light (sunward edge)
  if (a.material === 'metallic') {
    ctx.strokeStyle = `rgba(${highlight},${highlight},${highlight},0.55)`;
  } else {
    ctx.strokeStyle = 'rgba(200,195,190,0.22)';
  }
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Craters with raised rim shading
  for (const cr of a.craters) {
    if (cr.r < 0.8) continue;
    // Dark crater floor
    const crGrad = ctx.createRadialGradient(cr.cx, cr.cy, 0, cr.cx, cr.cy, cr.r);
    crGrad.addColorStop(0, `rgba(${Math.max(0, t - 55)},${Math.max(0, t - 56)},${Math.max(0, t - 58)},0.75)`);
    crGrad.addColorStop(0.7, `rgba(${Math.max(0, t - 30)},${Math.max(0, t - 30)},${Math.max(0, t - 32)},0.4)`);
    crGrad.addColorStop(1, `rgba(${t},${t},${t},0)`);
    ctx.fillStyle = crGrad;
    ctx.beginPath();
    ctx.arc(cr.cx, cr.cy, cr.r, 0, Math.PI * 2);
    ctx.fill();

    // Raised rim highlight (upper-left sunlit arc)
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = `rgba(${Math.min(255, t + 50)},${Math.min(255, t + 48)},${Math.min(255, t + 45)},0.45)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cr.cx - cr.r * 0.15, cr.cy - cr.r * 0.15, cr.r * 1.02, Math.PI * 0.6, Math.PI * 1.85);
    ctx.stroke();

    // Central peak for large craters
    if (cr.r > a.radius * 0.15) {
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = `rgba(${Math.min(255, t + 30)},${Math.min(255, t + 28)},${Math.min(255, t + 25)},0.55)`;
      ctx.beginPath();
      ctx.arc(cr.cx, cr.cy, cr.r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
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

    const count = quality === 'low' ? 10 : quality === 'medium' ? 20 : 32;
    for (let i = 0; i < count; i++) {
      const depth = randRange(rand, 0.08, 0.95);
      const a = buildAsteroid(rand, depth);
      a.x = rand() * width;
      a.y = rand() * height;
      a.vx *= 0.5 + depth;
      a.vy *= 0.5 + depth;
      this.rocks.push(a);
    }
  }

  update(state: SceneState): void {
    const { dt, journey } = state;
    let speedMult = 0.8;
    if (journey.currentSection.id === 'nebula_asteroids') {
      speedMult = 0.8 + Math.sin(journey.sectionProgress * Math.PI) * 2.2;
    } else if (journey.currentSection.id === 'hyperspace') {
      speedMult = 4.0;
    }

    for (const a of this.rocks) {
      a.x += a.vx * dt * speedMult;
      a.y += a.vy * dt * speedMult;
      a.rot += a.rotSpeed * dt * speedMult;

      // Record dust trail for fast-moving large rocks
      if (speedMult > 1.5 && a.radius > 8) {
        a.dustTrail.push({ x: a.x, y: a.y });
        if (a.dustTrail.length > 10) a.dustTrail.shift();
      } else if (a.dustTrail.length > 0) {
        a.dustTrail.shift();
      }

      if (a.x < -50) a.x = this.width + 50;
      else if (a.x > this.width + 50) a.x = -50;
      if (a.y < -50) a.y = this.height + 50;
      else if (a.y > this.height + 50) a.y = -50;
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, intensity, theme, journey } = state;
    if (theme === 'light') return;

    let sectionMult = 0.6;
    if (journey.currentSection.id === 'nebula_asteroids') {
      sectionMult = 0.6 + Math.sin(journey.sectionProgress * Math.PI) * 0.85;
    }

    ctx.save();
    for (const a of this.rocks) {
      const ox = mouse.x * (8 + a.depth * 22) + journey.camera.swayX * a.depth * 0.5;
      const oy = mouse.y * (6 + a.depth * 16) - scrollY * (0.02 + a.depth * 0.08) + journey.camera.swayY * a.depth * 0.5;

      // Dust trail
      if (a.dustTrail.length > 1) {
        ctx.save();
        ctx.translate(ox, oy);
        for (let i = 1; i < a.dustTrail.length; i++) {
          const f = i / a.dustTrail.length;
          ctx.globalAlpha = f * 0.18 * intensity * sectionMult;
          ctx.fillStyle = 'rgba(200,185,160,1)';
          ctx.beginPath();
          ctx.arc(a.dustTrail[i].x, a.dustTrail[i].y, a.radius * (0.2 + f * 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.save();
      ctx.translate(ox, oy);
      drawAsteroid(ctx, a, intensity * sectionMult);
      ctx.restore();
    }
    ctx.restore();
  }
}
