/* ═══════════════════════════════════════════════════════════════════════════
   KnownStarsLayer — Real catalogued stellar beacons & subtle HUD tracking.
   Highlights iconic real stars throughout deep space corridors:
   Sirius, Canopus, Alpha Centauri, Vega, Betelgeuse, Rigel, Polaris, Aldebaran, Arcturus.
   Renders accurate blackbody stellar colors, diffraction spikes, and a very
   delicate spaceship HUD telemetry classification bracket.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';

interface KnownStarDef {
  name: string;
  designation: string;
  mag: string;
  dist: string;
  specClass: string;
  color: string;
  spikeColor: string;
  radius: number;
  screenPos: { xRatio: number; yRatio: number };
  activeSectionIds: string[];
  depth: number;
}

const KNOWN_STARS: KnownStarDef[] = [
  {
    name: 'SIRIUS',
    designation: 'α Canis Majoris',
    mag: '-1.46',
    dist: '8.60 LY',
    specClass: 'A1V Diamond White',
    color: '#eef4ff',
    spikeColor: 'rgba(190, 220, 255, 0.75)',
    radius: 3.5,
    screenPos: { xRatio: 0.82, yRatio: 0.28 },
    activeSectionIds: ['departure', 'deep_space_stars'],
    depth: 0.45,
  },
  {
    name: 'BETELGEUSE',
    designation: 'α Orionis',
    mag: '+0.50',
    dist: '642.5 LY',
    specClass: 'M1-2Ia Red Supergiant',
    color: '#ff7a36',
    spikeColor: 'rgba(255, 120, 60, 0.65)',
    radius: 4.2,
    screenPos: { xRatio: 0.16, yRatio: 0.35 },
    activeSectionIds: ['deep_space_stars', 'nebula_asteroids'],
    depth: 0.35,
  },
  {
    name: 'RIGEL',
    designation: 'β Orionis',
    mag: '+0.13',
    dist: '863 LY',
    specClass: 'B8Ia Blue Supergiant',
    color: '#b0d4ff',
    spikeColor: 'rgba(150, 210, 255, 0.7)',
    radius: 3.8,
    screenPos: { xRatio: 0.78, yRatio: 0.72 },
    activeSectionIds: ['deep_space_stars'],
    depth: 0.38,
  },
  {
    name: 'VEGA',
    designation: 'α Lyrae',
    mag: '+0.03',
    dist: '25.04 LY',
    specClass: 'A0V Azure White',
    color: '#dce8ff',
    spikeColor: 'rgba(180, 215, 255, 0.6)',
    radius: 3.2,
    screenPos: { xRatio: 0.22, yRatio: 0.78 },
    activeSectionIds: ['deep_space_stars', 'galaxy'],
    depth: 0.42,
  },
  {
    name: 'ALPHA CENTAURI',
    designation: 'Rigil Kentaurus',
    mag: '-0.27',
    dist: '4.37 LY',
    specClass: 'G2V Solar Twin',
    color: '#fff3d1',
    spikeColor: 'rgba(255, 230, 160, 0.65)',
    radius: 3.4,
    screenPos: { xRatio: 0.88, yRatio: 0.48 },
    activeSectionIds: ['departure', 'mercury_venus', 'deep_space_stars'],
    depth: 0.5,
  },
  {
    name: 'POLARIS',
    designation: 'α Ursae Minoris',
    mag: '+1.98',
    dist: '433 LY',
    specClass: 'F7Ib Navigational True North',
    color: '#f8f4e6',
    spikeColor: 'rgba(230, 225, 200, 0.5)',
    radius: 2.8,
    screenPos: { xRatio: 0.48, yRatio: 0.12 },
    activeSectionIds: ['deep_space_stars'],
    depth: 0.3,
  },
  {
    name: 'ALDEBARAN',
    designation: 'α Tauri',
    mag: '+0.85',
    dist: '65.3 LY',
    specClass: 'K5III Orange Giant',
    color: '#ff9944',
    spikeColor: 'rgba(255, 150, 70, 0.55)',
    radius: 3.2,
    screenPos: { xRatio: 0.12, yRatio: 0.52 },
    activeSectionIds: ['mars', 'deep_space_stars'],
    depth: 0.4,
  },
];

export class KnownStarsLayer implements SpaceLayer {
  init(_state: SceneState): void {}

  draw(state: SceneState): void {
    const { ctx, theme, intensity, journey, width, height, mouse, time } = state;
    if (theme === 'light') return;

    const currentSecId = journey.currentSection.id;

    for (const star of KNOWN_STARS) {
      const isActive = star.activeSectionIds.includes(currentSecId);
      if (!isActive) continue;

      // Parallax mouse and camera sway
      const px = mouse.x * (10 + star.depth * 18) + journey.camera.swayX * star.depth * 0.4;
      const py = mouse.y * (8 + star.depth * 12) + journey.camera.swayY * star.depth * 0.4;

      const sx = star.screenPos.xRatio * width + px;
      const sy = star.screenPos.yRatio * height + py;

      // Twinkle & pulse
      const pulse = 1.0 + Math.sin(time * 1.8 + star.depth * 10) * 0.18;
      const r = star.radius * pulse;

      ctx.save();
      ctx.globalAlpha = intensity;

      // 1. Soft Color Halo
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 5);
      halo.addColorStop(0, star.color);
      halo.addColorStop(0.35, star.spikeColor);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 5, 0, Math.PI * 2);
      ctx.fill();

      // 2. 4-point Diffraction Spikes
      ctx.strokeStyle = star.spikeColor;
      ctx.lineWidth = 0.8;
      const spikeLen = r * 4.5;
      ctx.beginPath();
      ctx.moveTo(sx - spikeLen, sy);
      ctx.lineTo(sx + spikeLen, sy);
      ctx.moveTo(sx, sy - spikeLen);
      ctx.lineTo(sx, sy + spikeLen);
      ctx.stroke();

      // 3. Stellar Brilliant Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // 4. Subtle Spaceship HUD Classification Bracket (fades in when in deep space)
      if (currentSecId === 'deep_space_stars') {
        const hudAlpha = 0.35 * intensity;
        this.renderHudTag(ctx, star, sx, sy, hudAlpha);
      }

      ctx.restore();
    }
  }

  private renderHudTag(
    ctx: CanvasRenderingContext2D,
    star: KnownStarDef,
    sx: number,
    sy: number,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.45)';
    ctx.fillStyle = 'rgba(170, 220, 255, 0.85)';
    ctx.font = '9px "JetBrains Mono", Menlo, monospace';

    const tx = sx + 16;
    const ty = sy - 14;

    // HUD L-bracket
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx + 6, sy - 6);
    ctx.lineTo(tx - 4, ty + 10);
    ctx.lineTo(tx + 60, ty + 10);
    ctx.stroke();

    ctx.fillText(star.name, tx, ty);
    ctx.fillStyle = 'rgba(160, 190, 220, 0.6)';
    ctx.font = '8px "JetBrains Mono", Menlo, monospace';
    ctx.fillText(`${star.designation} · MAG ${star.mag}`, tx, ty + 10);
    ctx.fillText(`${star.dist} · ${star.specClass}`, tx, ty + 20);

    ctx.restore();
  }
}
