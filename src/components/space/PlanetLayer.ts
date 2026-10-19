/* ═══════════════════════════════════════════════════════════════════════════
   PlanetLayer — rare, large, partially-visible planets.
   Each planet is pre-rendered to an offscreen canvas (sphere shading +
   atmosphere rim + subtle surface banding), then composited with slow axial
   rotation via horizontal texture scrolling inside a circular clip. Planets
   are positioned to graze viewport corners so they never sit behind content.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

interface Planet {
  cx: number; cy: number;   // screen-space center (may be offscreen)
  r: number;                // radius px
  baseR: number;            // radius in offscreen texture px
  surface: HTMLCanvasElement;
  rot: number;              // rotation offset into texture
  rotSpeed: number;
  depth: number;            // parallax factor
  glowColor: string;        // atmosphere color
  glowStrength: number;
}

const PALETTES: { bands: string[]; base: string; glow: string }[] = [
  { base: '#1a3a6b', bands: ['#26538f', '#1d4478', '#2f629e', '#173a63'], glow: 'rgba(90,160,255,0.5)' },   // blue earth-like
  { base: '#6b2f22', bands: ['#7d3a28', '#5c281d', '#8a4530', '#4e2218'], glow: 'rgba(255,140,90,0.35)' },  // red planet
  { base: '#4a3a2a', bands: ['#5c4a34', '#3d3023', '#6b563d', '#2e2418'], glow: 'rgba(255,200,140,0.3)' },   // gas giant (warm)
  { base: '#2a4a52', bands: ['#356068', '#244048', '#3f7078', '#1c343c'], glow: 'rgba(150,230,255,0.4)' },   // icy planet
];

function buildPlanetTexture(size: number, pal: (typeof PALETTES)[number], rand: () => number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size * 2; // 2x wide for seamless horizontal scroll
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;

  // Base sphere fill across the full strip.
  g.fillStyle = pal.base;
  g.fillRect(0, 0, c.width, c.height);

  // Horizontal cloud/band stripes for a gas-giant / terrestrial look.
  const bands = 7 + Math.floor(rand() * 6);
  for (let i = 0; i < bands; i++) {
    const y = rand() * size;
    const h = randRange(rand, size * 0.03, size * 0.12);
    const col = pal.bands[Math.floor(rand() * pal.bands.length)];
    g.globalAlpha = randRange(rand, 0.15, 0.4);
    g.fillStyle = col;
    // Wavy band via a few overlapping ellipses.
    let x = 0;
    while (x < c.width) {
      const w = randRange(rand, size * 0.2, size * 0.5);
      g.beginPath();
      g.ellipse(x + w / 2, y + Math.sin(x * 0.02) * size * 0.03, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      x += w * 0.8;
    }
  }

  // Subtle noise speckle.
  g.globalAlpha = 0.06;
  for (let i = 0; i < size * 6; i++) {
    g.fillStyle = rand() < 0.5 ? '#ffffff' : '#000000';
    g.fillRect(rand() * c.width, rand() * size, 1, 1);
  }
  g.globalAlpha = 1;
  return c;
}

export class PlanetLayer implements SpaceLayer {
  private planets: Planet[] = [];

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.planets = [];
    if (theme === 'light') return; // Planets don't read on the light theme.

    // Decide how many planets this device gets (rare by design).
    const want = quality === 'low' ? 1 : quality === 'medium' ? 1 : 2;
    // Corner anchors: keep planets out of the content center.
    const corners = [
      { x: width * 1.02, y: height * 0.98 },  // bottom-right
      { x: -width * 0.04, y: height * 0.06 }, // top-left
      { x: width * 0.98, y: -height * 0.02 }, // top-right
      { x: -width * 0.02, y: height * 1.0 },  // bottom-left
    ];

    for (let i = 0; i < want; i++) {
      const pal = PALETTES[Math.floor(rand() * PALETTES.length)];
      const corner = corners[i % corners.length];
      const baseR = quality === 'low' ? 90 : quality === 'medium' ? 130 : 170;
      const surface = buildPlanetTexture(baseR, pal, rand);
      this.planets.push({
        cx: corner.x + randRange(rand, -width * 0.05, width * 0.05),
        cy: corner.y + randRange(rand, -height * 0.05, height * 0.05),
        r: baseR * randRange(rand, 1.4, 2.6),
        baseR,
        surface,
        rot: rand() * Math.PI * 2,
        rotSpeed: randRange(rand, 0.008, 0.03), // very slow axial spin
        depth: randRange(rand, 0.04, 0.12),
        glowColor: pal.glow,
        glowStrength: randRange(rand, 0.5, 0.9),
      });
    }
  }

  update(state: SceneState): void {
    for (const p of this.planets) p.rot += p.rotSpeed * state.dt;
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, theme, intensity } = state;
    if (theme === 'light') return;

    for (const p of this.planets) {
      const px = mouse.x * p.depth * 20;
      const py = mouse.y * p.depth * 14 - scrollY * p.depth * 0.05;
      const cx = p.cx + px;
      const cy = p.cy + py;

      // ── Atmosphere glow (behind sphere) ─────────────────────────────────
      ctx.save();
      ctx.globalAlpha = p.glowStrength * 0.5 * intensity;
      const atmo = ctx.createRadialGradient(cx, cy, p.r * 0.92, cx, cy, p.r * 1.14);
      atmo.addColorStop(0, p.glowColor);
      atmo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = atmo;
      ctx.beginPath();
      ctx.arc(cx, cy, p.r * 1.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Sphere with scrolling surface texture inside a circular clip ────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
      ctx.clip();

      // Draw the texture strip, scrolling horizontally to simulate rotation.
      const texW = p.surface.width; // 2 * baseR
      const scale = p.r / p.baseR;
      const offset = (p.rot % 1) * p.baseR * scale;
      const drawW = texW * scale;
      const drawH = p.surface.height * scale;
      ctx.globalAlpha = intensity;
      ctx.drawImage(p.surface, cx - p.r - offset, cy - p.r, drawW, drawH);
      // Second copy to cover the wrap seam.
      ctx.drawImage(p.surface, cx - p.r - offset + texW * scale, cy - p.r, drawW, drawH);

      // ── Terminator shading (day/night): darken the side away from sun ───
      // Sun assumed upper-left; shadow to lower-right.
      const shade = ctx.createRadialGradient(cx - p.r * 0.4, cy - p.r * 0.4, p.r * 0.1, cx, cy, p.r * 1.15);
      shade.addColorStop(0, 'rgba(255,255,255,0.08)');   // lit side
      shade.addColorStop(0.45, 'rgba(0,0,0,0)');
      shade.addColorStop(0.75, 'rgba(0,0,0,0.55)');
      shade.addColorStop(1, 'rgba(0,0,0,0.92)');          // deep night side
      ctx.fillStyle = shade;
      ctx.fillRect(cx - p.r, cy - p.r, p.r * 2, p.r * 2);
      ctx.restore();

      // ── Crisp atmospheric rim (drawn on top edge) ───────────────────────
      ctx.save();
      ctx.globalAlpha = p.glowStrength * 0.6 * intensity;
      ctx.strokeStyle = p.glowColor;
      ctx.lineWidth = Math.max(1, p.r * 0.012);
      ctx.beginPath();
      ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  dispose(): void {
    this.planets = [];
  }
}

