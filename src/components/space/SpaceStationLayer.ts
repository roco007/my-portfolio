/* ═══════════════════════════════════════════════════════════════════════════
   SpaceStationLayer — large modular orbital structures.
   A futuristic station built from cylindrical habitat modules, docking rings,
   a central truss, large solar arrays, communication antennae and a slowly
   rotating habitat ring with navigation lights. Positioned deep in the scene
   and slowly orbiting so it never obstructs content. Lit directionally
   (sun upper-left) with a deep-shadow opposite side.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';
import { scaleSec } from './JourneyTimeline';

interface Station {
  cx: number; cy: number;   // current center
  driftX: number; driftY: number;
  scale: number;
  rot: number;              // whole-station slow rotation
  rotSpeed: number;
  ringRot: number;          // rotating habitat section
  ringSpeed: number;
  depth: number;
  lightPhase: number;
  baseX: number; baseY: number;
}

function drawStation(ctx: CanvasRenderingContext2D, s: Station, t: number, intensity: number, fancy: boolean): void {
  ctx.save();
  ctx.translate(s.cx, s.cy);
  ctx.rotate(s.rot);
  ctx.scale(s.scale, s.scale);
  ctx.globalAlpha = (0.4 + s.depth * 0.6) * intensity;

  const metal = (l: number) => `rgba(${l},${l + 6},${l + 14},0.95)`;

  // ── Central truss (spine) ──────────────────────────────────────────────
  ctx.strokeStyle = metal(120);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-70, 0); ctx.lineTo(70, 0);
  ctx.stroke();
  // Lattice cross-bracing.
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = 'rgba(150,158,172,0.5)';
  for (let x = -70; x < 70; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, -3); ctx.lineTo(x + 8, 3);
    ctx.moveTo(x, 3); ctx.lineTo(x + 8, -3);
    ctx.stroke();
  }

  // ── Habitat modules (stacked cylinders along the truss) ────────────────
  const mods = [-46, -20, 6, 34];
  for (const mx of mods) {
    const mw = 16, mh = 12;
    const grad = ctx.createLinearGradient(mx, -mh / 2, mx, mh / 2);
    grad.addColorStop(0, metal(190));   // lit top
    grad.addColorStop(0.55, metal(120));
    grad.addColorStop(1, metal(55));    // shadow bottom
    ctx.fillStyle = grad;
    ctx.fillRect(mx, -mh / 2, mw, mh);
    ctx.strokeStyle = 'rgba(220,226,236,0.35)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(mx, -mh / 2, mw, mh);
    // Module seam lines.
    ctx.strokeStyle = 'rgba(80,88,100,0.5)';
    ctx.beginPath();
    ctx.moveTo(mx + mw / 2, -mh / 2); ctx.lineTo(mx + mw / 2, mh / 2);
    ctx.stroke();
  }

  // ── Docking node (front) ───────────────────────────────────────────────
  ctx.fillStyle = metal(160);
  ctx.beginPath();
  ctx.arc(74, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,226,236,0.5)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // ── Rotating habitat ring ──────────────────────────────────────────────
  ctx.save();
  ctx.translate(-20, 0);
  ctx.rotate(s.ringRot);
  ctx.strokeStyle = metal(150);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  // Spokes.
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(140,148,162,0.7)';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
    ctx.stroke();
  }
  ctx.restore();

  // ── Large solar arrays (two wings) ─────────────────────────────────────
  for (const side of [-1, 1]) {
    const wx = side * 92;
    const ww = 40, wh = 20;
    const grad = ctx.createLinearGradient(wx, -wh / 2, wx, wh / 2);
    grad.addColorStop(0, 'rgba(30,70,140,0.95)');
    grad.addColorStop(0.5, 'rgba(60,110,190,0.95)');
    grad.addColorStop(1, 'rgba(20,45,100,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(wx - ww / 2, -wh / 2, ww, wh);
    // Panel grid.
    ctx.strokeStyle = 'rgba(150,195,255,0.3)';
    ctx.lineWidth = 0.4;
    for (let i = 1; i < 5; i++) {
      const gx = wx - ww / 2 + (ww / 5) * i;
      ctx.beginPath(); ctx.moveTo(gx, -wh / 2); ctx.lineTo(gx, wh / 2); ctx.stroke();
    }
    for (let j = 1; j < 3; j++) {
      const gy = -wh / 2 + (wh / 3) * j;
      ctx.beginPath(); ctx.moveTo(wx - ww / 2, gy); ctx.lineTo(wx + ww / 2, gy); ctx.stroke();
    }
    // Connector to truss.
    ctx.strokeStyle = metal(130);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(side * 70, 0); ctx.lineTo(wx - (ww / 2) * side, 0);
    ctx.stroke();
  }

  // ── Communication antennae ─────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(200,206,218,0.6)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(20, -6); ctx.lineTo(28, -22);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(28, -22, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // ── Navigation lights (blinking, red/green/white) ──────────────────────
  if (fancy) {
    const lights: [number, number, string][] = [
      [-70, 0, '#ff4b4b'],
      [70, 0, '#38f0c0'],
      [0, -8, '#ffffff'],
    ];
    lights.forEach(([lx, ly, col], i) => {
      const blink = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.lightPhase + t * 2 + i * 1.7));
      ctx.globalAlpha = blink * (0.4 + s.depth * 0.6) * intensity;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(lx, ly, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = blink * 0.3 * (0.4 + s.depth * 0.6) * intensity;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 6);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

export class SpaceStationLayer implements SpaceLayer {
  private stations: Station[] = [];

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.stations = [];
    if (theme === 'light') return;

    // 1–2 stations; keep them in the upper/background region.
    const count = quality === 'low' ? 1 : quality === 'medium' ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const depth = randRange(rand, 0.1, 0.4);
      const baseX = randRange(rand, width * 0.15, width * 0.85);
      const baseY = randRange(rand, height * 0.08, height * 0.45);
      this.stations.push({
        baseX, baseY,
        cx: baseX, cy: baseY,
        driftX: randRange(rand, -6, 6),
        driftY: randRange(rand, -3, 3),
        scale: randRange(rand, 0.5, 0.95) * (0.6 + depth),
        rot: randRange(rand, -0.3, 0.3),
        rotSpeed: randRange(rand, 0.004, 0.012) * (rand() < 0.5 ? 1 : -1),
        ringRot: rand() * Math.PI * 2,
        ringSpeed: randRange(rand, 0.05, 0.15),
        depth,
        lightPhase: rand() * Math.PI * 2,
      });
    }
  }

  update(state: SceneState): void {
    const { dt, time } = state;
    for (const s of this.stations) {
      // Very slow orbital drift around the base point.
      s.cx = s.baseX + Math.sin(time * 0.02) * s.driftX;
      s.cy = s.baseY + Math.cos(time * 0.015) * s.driftY;
      s.rot += s.rotSpeed * dt;
      s.ringRot += s.ringSpeed * dt;
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, time, intensity, quality, journey } = state;
    const fancy = quality !== 'low';

    // The orbital station is prominently visible during departure (00:00 – 05:00)
    // and gradually recedes as the spaceship leaves orbit.
    // Windows are canonical mission-clock seconds mapped onto the live loop.
    const departEnd = scaleSec(300); // 05:00 → 00:10
    const fadeEnd = scaleSec(420);   // 07:00 → 00:14
    let stationAlpha = 1.0;
    if (journey.elapsed < departEnd) {
      // 00:00 – 05:00
      stationAlpha = 1.0 - (journey.elapsed / departEnd) * 0.4;
    } else if (journey.elapsed < fadeEnd) {
      // 05:00 – 07:00 fading into deep distance
      stationAlpha = (1 - (journey.elapsed - departEnd) / (fadeEnd - departEnd)) * 0.6;
    } else {
      // Not in departure orbital window
      return;
    }

    ctx.save();
    for (const s of this.stations) {
      const ox = mouse.x * (6 + s.depth * 18) + journey.camera.swayX * s.depth * 0.4;
      const oy = mouse.y * (4 + s.depth * 12) - scrollY * (0.015 + s.depth * 0.05) + journey.camera.swayY * s.depth * 0.4;
      ctx.save();
      ctx.translate(ox, oy);
      drawStation(ctx, s, time, intensity * stationAlpha, fancy);
      ctx.restore();
    }
    ctx.restore();
  }
}

