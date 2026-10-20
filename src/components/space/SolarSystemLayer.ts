/* ═══════════════════════════════════════════════════════════════════════════
   SolarSystemLayer — Cinematic rotating Solar System planets.
   Drives deterministic planetary encounters along the 2-minute journey
   (schedule authored on a canonical 3600 s mission clock, compressed 30×):
   Mercury & Venus → Earth & Moon → Mars & Moons → Jupiter & Galilean Moons →
   Saturn & Rings → Uranus → Neptune.
   Each planet features:
   - High-fidelity pre-rendered spherical surface textures (2x wrap strip)
   - Continuous realistic axial rotation
   - Dynamic atmospheric glow rims and day/night terminator shading
   - Earth: dual-layer rotating clouds + continents + orbiting Moon
   - Jupiter: differential cloud bands + Great Red Spot + 4 Galilean moons
   - Saturn: golden globe + magnificent tilted rings with Cassini division + shadows
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import type { GeoPoint } from '../worldLandmasses';
import { scaleSec, TIME_COMPRESSION } from './JourneyTimeline';

/**
 * Journey-coupled motion (axial spin, cloud drift, moon orbits) is driven by
 * the canonical 3600 s mission clock so that a flyby still plays its full
 * choreography inside its shortened window, rather than a 30× blur.
 *
 * `missionElapsed = elapsed * TIME_COMPRESSION` converts the live 2-minute
 * loop time back onto the canonical mission clock; dividing by MOTION_SLOWDOWN
 * leaves the motion running at 30/10 = 3× the original wall-clock rate — fast
 * enough that rotation and orbits are clearly perceptible inside a 4–13 s
 * flyby, slow enough to stay cinematic:
 *   - Jupiter (45 s period) turns ≈0.87× during its 13 s flyby
 *   - Earth (60 s period) turns ≈0.45× during its 9 s flyby
 *   - Phobos completes ≈1 full revolution during its 9 s flyby
 *
 * The motion clock is loop-local, so the scene stays perfectly deterministic:
 * every cycle replays the identical choreography.
 */
const MOTION_SLOWDOWN = 10;

/** Multiplier applied to live loop time to get the effective motion clock. */
const MOTION_RATE = TIME_COMPRESSION / MOTION_SLOWDOWN;

export type PlanetKey =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

interface PlanetConfig {
  key: PlanetKey;
  name: string;
  classification: string;
  startSec: number;
  endSec: number;
  baseRadius: number;
  rotPeriodSec: number; // axial rotation speed
  atmosphereColor: string;
  atmosphereGlow: number;
  // Trajectory in screen space: enters from startPos to endPos
  startPos: { xRatio: number; yRatio: number };
  peakPos: { xRatio: number; yRatio: number };
  endPos: { xRatio: number; yRatio: number };
  hasRings?: boolean;
  hasMoons?: boolean;
  hasClouds?: boolean;
}

const PLANET_CONFIGS: PlanetConfig[] = [
  {
    key: 'mercury',
    name: 'MERCURY',
    classification: 'Terrestrial · Metalliferous',
    startSec: scaleSec(320),
    endSec: scaleSec(460), // within 300..600
    baseRadius: 75,
    rotPeriodSec: 70,
    atmosphereColor: 'rgba(180, 170, 160, 0.15)',
    atmosphereGlow: 0.12,
    startPos: { xRatio: 1.15, yRatio: 0.8 },
    peakPos: { xRatio: 0.85, yRatio: 0.72 },
    endPos: { xRatio: 0.55, yRatio: 1.18 },
  },
  {
    key: 'venus',
    name: 'VENUS',
    classification: 'Terrestrial · Sulfuric Atmosphere',
    startSec: scaleSec(450),
    endSec: scaleSec(590), // within 300..600
    baseRadius: 105,
    rotPeriodSec: 90,
    atmosphereColor: 'rgba(240, 200, 130, 0.45)',
    atmosphereGlow: 0.65,
    startPos: { xRatio: -0.2, yRatio: 0.85 },
    peakPos: { xRatio: 0.14, yRatio: 0.76 },
    endPos: { xRatio: 0.45, yRatio: 1.25 },
  },
  {
    key: 'earth',
    name: 'TERRA (EARTH)',
    classification: 'Terrestrial · Biosphere Alpha',
    startSec: scaleSec(620),
    endSec: scaleSec(890), // within 600..900
    baseRadius: 155,
    rotPeriodSec: 60,
    atmosphereColor: 'rgba(65, 145, 255, 0.55)',
    atmosphereGlow: 0.85,
    startPos: { xRatio: 1.2, yRatio: 0.85 },
    peakPos: { xRatio: 0.82, yRatio: 0.76 },
    endPos: { xRatio: 0.4, yRatio: 1.25 },
    hasClouds: true,
    hasMoons: true,
  },
  {
    key: 'mars',
    name: 'MARS',
    classification: 'Terrestrial · Ferric Oxide Desert',
    startSec: scaleSec(920),
    endSec: scaleSec(1190), // within 900..1200
    baseRadius: 105,
    rotPeriodSec: 65,
    atmosphereColor: 'rgba(235, 110, 65, 0.35)',
    atmosphereGlow: 0.4,
    startPos: { xRatio: -0.15, yRatio: 0.75 },
    peakPos: { xRatio: 0.16, yRatio: 0.68 },
    endPos: { xRatio: 0.45, yRatio: 1.2 },
    hasMoons: true,
  },
  {
    key: 'jupiter',
    name: 'JUPITER',
    classification: 'Gas Giant · Hydrogen-Helium Mantle',
    startSec: scaleSec(1220),
    endSec: scaleSec(1610), // within 1200..1620
    baseRadius: 230,
    rotPeriodSec: 45,
    atmosphereColor: 'rgba(230, 185, 130, 0.45)',
    atmosphereGlow: 0.65,
    startPos: { xRatio: 1.28, yRatio: 0.18 },
    peakPos: { xRatio: 0.88, yRatio: 0.24 },
    endPos: { xRatio: 0.52, yRatio: -0.28 },
    hasMoons: true,
  },
  {
    key: 'saturn',
    name: 'SATURN',
    classification: 'Ringed Gas Giant · Chronos System',
    startSec: scaleSec(1640),
    endSec: scaleSec(2030), // within 1620..2040
    baseRadius: 165,
    rotPeriodSec: 50,
    atmosphereColor: 'rgba(235, 215, 150, 0.4)',
    atmosphereGlow: 0.55,
    startPos: { xRatio: -0.25, yRatio: 0.9 },
    peakPos: { xRatio: 0.16, yRatio: 0.8 },
    endPos: { xRatio: 0.55, yRatio: 1.28 },
    hasRings: true,
    hasMoons: true,
  },
  {
    key: 'uranus',
    name: 'URANUS',
    classification: 'Ice Giant · Cyan Methane Atmosphere',
    startSec: scaleSec(2050),
    endSec: scaleSec(2270), // within 2040..2280
    baseRadius: 130,
    rotPeriodSec: 75,
    atmosphereColor: 'rgba(120, 225, 225, 0.45)',
    atmosphereGlow: 0.5,
    startPos: { xRatio: 1.2, yRatio: 0.65 },
    peakPos: { xRatio: 0.84, yRatio: 0.62 },
    endPos: { xRatio: 0.45, yRatio: 1.2 },
    hasRings: true,
  },
  {
    key: 'neptune',
    name: 'NEPTUNE',
    classification: 'Ice Giant · Supersonic Azure Mantle',
    startSec: scaleSec(2290),
    endSec: scaleSec(2510), // within 2280..2520
    baseRadius: 130,
    rotPeriodSec: 70,
    atmosphereColor: 'rgba(70, 130, 255, 0.55)',
    atmosphereGlow: 0.6,
    startPos: { xRatio: 1.2, yRatio: 0.22 },
    peakPos: { xRatio: 0.86, yRatio: 0.2 },
    endPos: { xRatio: 0.48, yRatio: -0.25 },
    hasMoons: true,
  },
];

/* ───────────────────────────────────────────────────────────────────────────
   Procedural Texture Generators (Canvas 2D Offscreen)
   Each generator paints a seamless 2x-wide horizontal texture strip
   ─────────────────────────────────────────────────────────────────────────── */

function createMercuryTexture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size * 2;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;

  // Barren rocky base
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, '#58534d');
  bg.addColorStop(0.5, '#443f3a');
  bg.addColorStop(1, '#332f2b');
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, size);

  // Surface craters and ridges
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 8;
    g.beginPath();
    g.fillStyle = 'rgba(25, 23, 21, 0.65)';
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    // Crater bright rim
    g.beginPath();
    g.strokeStyle = 'rgba(170, 165, 155, 0.45)';
    g.lineWidth = 1;
    g.arc(x - 0.5, y - 0.5, r, Math.PI * 0.7, Math.PI * 1.8);
    g.stroke();
  }
  return c;
}

function createVenusTexture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size * 2;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;

  // Creamy amber/golden base
  g.fillStyle = '#b38848';
  g.fillRect(0, 0, c.width, size);

  // Swirling sulfuric cloud bands
  const bands = 14;
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * size;
    const h = size / bands * 1.5;
    const grad = g.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, 'rgba(245, 210, 140, 0.35)');
    grad.addColorStop(0.5, 'rgba(195, 140, 65, 0.4)');
    grad.addColorStop(1, 'rgba(140, 95, 40, 0.25)');
    g.fillStyle = grad;

    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 20) {
      const wave = Math.sin(x * 0.015 + i) * (size * 0.04) + Math.sin(x * 0.04) * 4;
      g.lineTo(x, y + wave);
    }
    g.lineTo(c.width, y + h);
    g.lineTo(0, y + h);
    g.closePath();
    g.fill();
  }
  return c;
}

const FALLBACK_LANDMASSES: GeoPoint[][] = [
  // North America
  [[15, -95], [30, -120], [50, -125], [60, -140], [70, -100], [50, -60], [25, -80], [15, -95]],
  // South America
  [[10, -75], [-5, -80], [-20, -70], [-55, -70], [-35, -55], [-10, -35], [5, -52], [10, -75]],
  // Eurasia
  [[35, -10], [55, -5], [65, 20], [70, 60], [65, 140], [35, 120], [20, 105], [10, 75], [25, 60], [35, 35], [35, -10]],
  // Africa
  [[35, -5], [30, 32], [12, 45], [-12, 40], [-35, 20], [-5, 10], [5, 0], [15, -17], [35, -5]],
  // Australia
  [[-15, 130], [-12, 142], [-28, 153], [-38, 145], [-35, 115], [-20, 115], [-15, 130]],
];

function createEarthTexture(size: number, landmasses?: GeoPoint[][]): {
  surface: HTMLCanvasElement;
  clouds: HTMLCanvasElement;
  nightLights: HTMLCanvasElement;
} {
  const width = size * 2;
  const height = size;
  const rings = landmasses && landmasses.length > 0 ? landmasses : FALLBACK_LANDMASSES;

  // 1. Surface canvas (oceans, shallow coastal shelves, continents, biomes, mountain ranges, polar ice)
  const s = document.createElement('canvas');
  s.width = width;
  s.height = height;
  const sg = s.getContext('2d');

  if (sg) {
    // A. Deep Oceanic Gradient with realistic ocean trench depths
    const ocean = sg.createLinearGradient(0, 0, 0, height);
    ocean.addColorStop(0, '#061a32');    // Arctic ocean navy
    ocean.addColorStop(0.25, '#0a2a54'); // North Atlantic / Pacific
    ocean.addColorStop(0.5, '#0c3568');  // Equatorial azure
    ocean.addColorStop(0.75, '#09254c'); // South Atlantic / Pacific
    ocean.addColorStop(1, '#051426');    // Southern ocean abyssal navy
    sg.fillStyle = ocean;
    sg.fillRect(0, 0, width, height);

    // Bathymetric mid-ocean ridge glow (Mid-Atlantic Ridge & East Pacific Rise)
    sg.strokeStyle = 'rgba(20, 80, 140, 0.3)';
    sg.lineWidth = 14;
    for (let wrap = 0; wrap < 2; wrap++) {
      const xOff = wrap * size;
      sg.beginPath();
      sg.moveTo(xOff + size * 0.44, size * 0.12);
      sg.bezierCurveTo(
        xOff + size * 0.42, size * 0.35,
        xOff + size * 0.48, size * 0.6,
        xOff + size * 0.45, size * 0.88
      );
      sg.stroke();
    }

    // B. Draw Geographic Landmasses
    for (let wrap = 0; wrap < 2; wrap++) {
      const xOff = wrap * size;

      // First pass: Turquoise shallow-water continental shelf glow around all coastlines
      // (Caribbean, Bahamas, Great Barrier Reef, North Sea, Indonesian shallows)
      sg.save();
      sg.strokeStyle = 'rgba(26, 145, 172, 0.55)';
      sg.lineWidth = 6;
      sg.lineJoin = 'round';
      sg.lineCap = 'round';
      for (const ring of rings) {
        if (ring.length < 3) continue;
        sg.beginPath();
        let started = false;
        let prevLon = 0;
        for (let i = 0; i < ring.length; i++) {
          const [lat, lon] = ring[i];
          if (i > 0 && Math.abs(lon - prevLon) > 180) {
            sg.stroke();
            sg.beginPath();
            started = false;
          }
          const x = xOff + ((lon + 180) / 360) * size;
          const y = ((90 - lat) / 180) * size;
          if (!started) {
            sg.moveTo(x, y);
            started = true;
          } else {
            sg.lineTo(x, y);
          }
          prevLon = lon;
        }
        if (started) sg.stroke();
      }

      // Second pass: Crisp bright turquoise coastal rim
      sg.strokeStyle = 'rgba(40, 185, 205, 0.7)';
      sg.lineWidth = 2.5;
      for (const ring of rings) {
        if (ring.length < 3) continue;
        sg.beginPath();
        let started = false;
        let prevLon = 0;
        for (let i = 0; i < ring.length; i++) {
          const [lat, lon] = ring[i];
          if (i > 0 && Math.abs(lon - prevLon) > 180) {
            sg.stroke();
            sg.beginPath();
            started = false;
          }
          const x = xOff + ((lon + 180) / 360) * size;
          const y = ((90 - lat) / 180) * size;
          if (!started) {
            sg.moveTo(x, y);
            started = true;
          } else {
            sg.lineTo(x, y);
          }
          prevLon = lon;
        }
        if (started) sg.stroke();
      }

      // Third pass: Base continent landmass fill (lush vegetation)
      sg.fillStyle = '#264e22';
      for (const ring of rings) {
        if (ring.length < 3) continue;
        sg.beginPath();
        let started = false;
        let prevLon = 0;
        for (let i = 0; i < ring.length; i++) {
          const [lat, lon] = ring[i];
          if (i > 0 && Math.abs(lon - prevLon) > 180) {
            sg.closePath();
            sg.fill();
            sg.beginPath();
            started = false;
          }
          const x = xOff + ((lon + 180) / 360) * size;
          const y = ((90 - lat) / 180) * size;
          if (!started) {
            sg.moveTo(x, y);
            started = true;
          } else {
            sg.lineTo(x, y);
          }
          prevLon = lon;
        }
        if (started) {
          sg.closePath();
          sg.fill();
        }
      }
      sg.restore();

      // C. Biome and Climatic Shading:
      // Sahara & Sahel & Arabian desert
      const saharaGrad = sg.createLinearGradient(
        xOff + size * 0.44, size * 0.33,
        xOff + size * 0.62, size * 0.46
      );
      saharaGrad.addColorStop(0, 'rgba(215, 175, 105, 0.85)');
      saharaGrad.addColorStop(0.5, 'rgba(195, 150, 85, 0.9)');
      saharaGrad.addColorStop(1, 'rgba(175, 130, 70, 0.85)');
      sg.fillStyle = saharaGrad;
      sg.beginPath();
      sg.ellipse(xOff + size * 0.54, size * 0.38, size * 0.08, size * 0.065, 0.15, 0, Math.PI * 2);
      sg.fill();
      // Arabian peninsula
      sg.beginPath();
      sg.ellipse(xOff + size * 0.62, size * 0.38, size * 0.035, size * 0.045, 0.3, 0, Math.PI * 2);
      sg.fill();

      // Australian Outback desert
      sg.fillStyle = 'rgba(185, 95, 45, 0.85)';
      sg.beginPath();
      sg.ellipse(xOff + size * 0.87, size * 0.64, size * 0.05, size * 0.04, 0, 0, Math.PI * 2);
      sg.fill();

      // Gobi / Taklamakan / Central Asian arid steppes
      sg.fillStyle = 'rgba(180, 150, 95, 0.75)';
      sg.beginPath();
      sg.ellipse(xOff + size * 0.74, size * 0.3, size * 0.07, size * 0.035, 0.05, 0, Math.PI * 2);
      sg.fill();

      // Kalahari / Namib desert (Southern Africa)
      sg.fillStyle = 'rgba(175, 115, 65, 0.75)';
      sg.beginPath();
      sg.ellipse(xOff + size * 0.56, size * 0.62, size * 0.025, size * 0.035, 0, 0, Math.PI * 2);
      sg.fill();

      // Amazon basin & Congo deep rainforest greens
      sg.fillStyle = 'rgba(16, 62, 22, 0.8)';
      // Amazon
      sg.beginPath();
      sg.ellipse(xOff + size * 0.32, size * 0.52, size * 0.06, size * 0.05, 0.2, 0, Math.PI * 2);
      sg.fill();
      // Congo
      sg.beginPath();
      sg.ellipse(xOff + size * 0.56, size * 0.5, size * 0.035, size * 0.035, 0, 0, Math.PI * 2);
      sg.fill();

      // Mountain Ranges (rugged relief with snow-capped peaks):
      // Himalayas (north of India)
      sg.strokeStyle = 'rgba(245, 250, 255, 0.85)';
      sg.lineWidth = 2.5;
      sg.beginPath();
      sg.moveTo(xOff + size * 0.7, size * 0.33);
      sg.quadraticCurveTo(xOff + size * 0.74, size * 0.31, xOff + size * 0.79, size * 0.35);
      sg.stroke();
      // Andes (western South America)
      sg.beginPath();
      sg.moveTo(xOff + size * 0.29, size * 0.44);
      sg.lineTo(xOff + size * 0.28, size * 0.58);
      sg.lineTo(xOff + size * 0.31, size * 0.75);
      sg.stroke();
      // Rocky Mountains (western North America)
      sg.beginPath();
      sg.moveTo(xOff + size * 0.2, size * 0.22);
      sg.lineTo(xOff + size * 0.22, size * 0.35);
      sg.stroke();

      // D. Glaciers and Polar Ice Sheets
      // Greenland ice sheet
      sg.fillStyle = '#f0f6fa';
      sg.beginPath();
      sg.ellipse(xOff + size * 0.39, size * 0.1, size * 0.035, size * 0.05, -0.15, 0, Math.PI * 2);
      sg.fill();

      // Arctic polar ice cap (North Pole)
      const arcticGrad = sg.createLinearGradient(0, 0, 0, size * 0.08);
      arcticGrad.addColorStop(0, '#ffffff');
      arcticGrad.addColorStop(0.7, '#e4f0f6');
      arcticGrad.addColorStop(1, 'rgba(215, 235, 245, 0)');
      sg.fillStyle = arcticGrad;
      sg.fillRect(xOff, 0, size, size * 0.08);

      // Antarctic ice sheet (South Pole)
      const antarcticGrad = sg.createLinearGradient(0, size * 0.82, 0, size);
      antarcticGrad.addColorStop(0, 'rgba(215, 235, 245, 0)');
      antarcticGrad.addColorStop(0.3, '#e4f0f6');
      antarcticGrad.addColorStop(1, '#ffffff');
      sg.fillStyle = antarcticGrad;
      sg.fillRect(xOff, size * 0.82, size, size * 0.18);
    }
  }

  // 2. Realistic Dynamic Cloud Layer (cl)
  const cl = document.createElement('canvas');
  cl.width = width;
  cl.height = height;
  const cg = cl.getContext('2d');

  if (cg) {
    cg.clearRect(0, 0, width, height);

    for (let wrap = 0; wrap < 2; wrap++) {
      const xOff = wrap * size;

      // A. Intertropical Convergence Zone (ITCZ) equatorial cloud band
      cg.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let i = 0; i < 28; i++) {
        const cx = xOff + (i / 28) * size;
        const cy = size * (0.47 + Math.sin(i * 0.8) * 0.03);
        const rx = size * (0.025 + Math.random() * 0.03);
        const ry = size * (0.008 + Math.random() * 0.012);
        cg.beginPath();
        cg.ellipse(cx, cy, rx, ry, 0.05, 0, Math.PI * 2);
        cg.fill();
      }

      // B. Cyclonic Storm Vortices (Logarithmic Spiral Hurricane & Depressions)
      const stormCenters = [
        // Hurricane in North Atlantic
        { x: xOff + size * 0.35, y: size * 0.34, r: size * 0.075, arms: 3, rotSpeed: -1 },
        // Super-Typhoon in Western Pacific
        { x: xOff + size * 0.78, y: size * 0.36, r: size * 0.085, arms: 4, rotSpeed: -1 },
        // Mid-latitude cyclone off British Isles / Europe
        { x: xOff + size * 0.48, y: size * 0.26, r: size * 0.09, arms: 2, rotSpeed: -1 },
        // Roaring Forties southern ocean cyclones
        { x: xOff + size * 0.28, y: size * 0.72, r: size * 0.08, arms: 2, rotSpeed: 1 },
        { x: xOff + size * 0.68, y: size * 0.74, r: size * 0.085, arms: 3, rotSpeed: 1 },
      ];

      for (const st of stormCenters) {
        // Spiral arms
        for (let a = 0; a < st.arms; a++) {
          const baseA = (a / st.arms) * Math.PI * 2;
          for (let p = 0; p < 18; p++) {
            const frac = p / 18;
            const dist = frac * st.r;
            const theta = baseA + frac * Math.PI * 2.2 * st.rotSpeed;
            const px = st.x + Math.cos(theta) * dist;
            const py = st.y + Math.sin(theta) * dist * 0.85;
            const pr = (1 - frac * 0.5) * (st.r * 0.22);
            cg.fillStyle = `rgba(255, 255, 255, ${0.45 + (1 - frac) * 0.35})`;
            cg.beginPath();
            cg.arc(px, py, pr, 0, Math.PI * 2);
            cg.fill();
          }
        }
        // Eye of the storm
        cg.save();
        cg.globalCompositeOperation = 'destination-out';
        cg.beginPath();
        cg.arc(st.x, st.y, st.r * 0.08, 0, Math.PI * 2);
        cg.fill();
        cg.restore();
      }

      // C. Trade Wind Cumulus & Wispy Cirrus Fields
      cg.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 60; i++) {
        const cx = xOff + Math.random() * size;
        const cy = size * 0.12 + Math.random() * size * 0.76;
        const rx = size * (0.015 + Math.random() * 0.045);
        const ry = size * (0.005 + Math.random() * 0.015);
        const rot = (Math.random() - 0.5) * 0.5;
        cg.beginPath();
        cg.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
        cg.fill();
      }
    }
  }

  // 3. Earth Night-Side City Lights Canvas (nl)
  const nl = document.createElement('canvas');
  nl.width = width;
  nl.height = height;
  const ng = nl.getContext('2d');

  if (ng) {
    ng.clearRect(0, 0, width, height);

    // Major human megalopolis city clusters [lat, lon, sizeRadius, brightness]
    const cityCenters: [number, number, number, number][] = [
      // North America
      [40.7, -74.0, 10, 1.0],  // NYC / Mid-Atlantic
      [42.3, -71.0, 6, 0.9],   // Boston
      [38.9, -77.0, 7, 0.9],   // Washington DC / Baltimore
      [41.8, -87.6, 9, 0.95],  // Chicago / Great Lakes
      [34.0, -118.2, 10, 0.95],// Los Angeles / SoCal
      [37.7, -122.4, 7, 0.9],  // SF Bay Area
      [25.7, -80.2, 6, 0.85],  // Miami / Florida
      [47.6, -122.3, 5, 0.8],   // Seattle
      [29.7, -95.3, 7, 0.85],  // Houston / Texas Triangle
      // Western & Central Europe
      [51.5, -0.1, 9, 1.0],    // London
      [48.8, 2.3, 8, 1.0],     // Paris
      [52.5, 13.4, 6, 0.9],    // Berlin
      [50.9, 6.9, 11, 1.0],    // Ruhr Valley / Benelux
      [45.4, 9.1, 7, 0.9],     // Milan / Po Valley
      [40.4, -3.7, 6, 0.85],   // Madrid
      [55.7, 37.6, 7, 0.9],    // Moscow
      // Asia & Far East
      [35.6, 139.6, 12, 1.0],  // Tokyo / Yokohama megalopolis
      [34.6, 135.5, 9, 0.95],  // Osaka / Kyoto / Kobe
      [37.5, 126.9, 8, 0.95],  // Seoul
      [31.2, 121.4, 11, 1.0],  // Shanghai / Yangtze Delta
      [39.9, 116.4, 9, 0.95],  // Beijing
      [22.3, 114.1, 11, 1.0],  // Hong Kong / Pearl River Delta
      [25.0, 121.5, 6, 0.85],  // Taipei
      // South Asia & Middle East
      [28.6, 77.2, 10, 0.95],  // New Delhi / Ganges Plain
      [19.0, 72.8, 8, 0.9],    // Mumbai
      [12.9, 77.5, 7, 0.85],   // Bangalore
      [30.0, 31.2, 9, 0.95],   // Cairo / Nile Delta & River
      [25.2, 55.2, 7, 0.9],    // Dubai / UAE coast
      [24.7, 46.6, 6, 0.85],   // Riyadh
      // South America, Africa, Australia
      [-23.5, -46.6, 9, 0.9],  // São Paulo
      [-22.9, -43.1, 7, 0.85], // Rio de Janeiro
      [-34.6, -58.3, 7, 0.85], // Buenos Aires
      [-26.2, 28.0, 6, 0.8],   // Johannesburg
      [-33.8, 151.2, 7, 0.85], // Sydney
      [-37.8, 144.9, 6, 0.8],  // Melbourne
    ];

    for (let wrap = 0; wrap < 2; wrap++) {
      const xOff = wrap * size;

      for (const [lat, lon, r, bright] of cityCenters) {
        const cx = xOff + ((lon + 180) / 360) * size;
        const cy = ((90 - lat) / 180) * size;

        // Golden city cluster glow
        const rad = ng.createRadialGradient(cx, cy, 0.5, cx, cy, r * (size / 384));
        rad.addColorStop(0, `rgba(255, 245, 190, ${0.95 * bright})`);
        rad.addColorStop(0.3, `rgba(255, 185, 70, ${0.75 * bright})`);
        rad.addColorStop(0.7, `rgba(240, 120, 20, ${0.35 * bright})`);
        rad.addColorStop(1, 'rgba(200, 80, 10, 0)');
        ng.fillStyle = rad;
        ng.beginPath();
        ng.arc(cx, cy, r * (size / 384), 0, Math.PI * 2);
        ng.fill();

        // Sub-dots for suburbs
        for (let s = 0; s < 5; s++) {
          const subAngle = (s / 5) * Math.PI * 2 + s * 0.4;
          const subDist = (0.5 + Math.random() * 0.8) * (r * 0.7);
          const sx = cx + Math.cos(subAngle) * subDist;
          const sy = cy + Math.sin(subAngle) * subDist * 0.7;
          ng.fillStyle = `rgba(255, 210, 100, ${0.65 * bright})`;
          ng.beginPath();
          ng.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ng.fill();
        }
      }
    }
  }

  return { surface: s, clouds: cl, nightLights: nl };
}

function createMarsTexture(size: number): HTMLCanvasElement {
  const width = size * 2;
  const height = size;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  if (!g) return c;

  // 1. Multi-tier Martian Base Terrain (Rust, Ochre & Ancient Basalt)
  const bg = g.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#5a1f0e');    // North polar dark sand border
  bg.addColorStop(0.15, '#8c3a1c'); // Vastitas Borealis lowlands
  bg.addColorStop(0.32, '#ac4824'); // Northern plains (Acidalia / Utopia)
  bg.addColorStop(0.5, '#c2582e');  // Equatorial volcanic highlands (Tharsis)
  bg.addColorStop(0.7, '#923a1a');  // Cratered southern highlands (Noachis)
  bg.addColorStop(0.88, '#6a2412'); // Southern sub-polar rugged terrain
  bg.addColorStop(1, '#42140a');    // South polar collar
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);

  // 2. High-Fidelity Albedo Regions for Both Wraps
  for (let wrap = 0; wrap < 2; wrap++) {
    const xOff = wrap * size;

    // Helper: convert Mars [lat (-90..90), lon (0..360)] to texture [x, y]
    const mPos = (lat: number, lon: number) => ({
      x: xOff + (lon / 360) * size,
      y: ((90 - lat) / 180) * size,
    });

    // A. Syrtis Major Planum (Iconic Dark Triangular Basaltic Shield, ~10°N, 70°E)
    const sm = mPos(10, 70);
    g.fillStyle = '#2c0f08';
    g.beginPath();
    g.moveTo(sm.x, sm.y - size * 0.08); // Northern apex
    g.bezierCurveTo(
      sm.x + size * 0.05, sm.y - size * 0.02,
      sm.x + size * 0.06, sm.y + size * 0.06,
      sm.x + size * 0.03, sm.y + size * 0.09
    ); // Eastern flank
    g.lineTo(sm.x - size * 0.04, sm.y + size * 0.07); // Southern base
    g.bezierCurveTo(
      sm.x - size * 0.05, sm.y + size * 0.02,
      sm.x - size * 0.03, sm.y - size * 0.05,
      sm.x, sm.y - size * 0.08
    ); // Western flank
    g.closePath();
    g.fill();

    // Nili Patera caldera in Syrtis Major center
    g.fillStyle = '#180704';
    g.beginPath();
    g.ellipse(sm.x, sm.y, size * 0.012, size * 0.015, 0.2, 0, Math.PI * 2);
    g.fill();

    // B. Hellas Planitia (Giant 2,300 km Southern Impact Basin, ~42°S, 70°E)
    const hp = mPos(-42, 70);
    // Basin rim (darker ejecta ring)
    g.strokeStyle = '#481c10';
    g.lineWidth = size * 0.015;
    g.beginPath();
    g.ellipse(hp.x, hp.y, size * 0.09, size * 0.075, 0, 0, Math.PI * 2);
    g.stroke();
    // Basin floor (filled with bright golden-ochre dust)
    const hellasDust = g.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, size * 0.085);
    hellasDust.addColorStop(0, '#d27c44');
    hellasDust.addColorStop(0.7, '#bf6834');
    hellasDust.addColorStop(1, '#923c1c');
    g.fillStyle = hellasDust;
    g.beginPath();
    g.ellipse(hp.x, hp.y, size * 0.085, size * 0.07, 0, 0, Math.PI * 2);
    g.fill();

    // C. Acidalia Planitia & Chryse Planitia (~45°N, 330°E)
    const ap = mPos(45, 330);
    g.fillStyle = 'rgba(56, 20, 12, 0.75)';
    g.beginPath();
    g.ellipse(ap.x, ap.y, size * 0.1, size * 0.07, -0.2, 0, Math.PI * 2);
    g.fill();

    // D. Argyre Planitia (~50°S, 316°E)
    const arg = mPos(-50, 316);
    g.fillStyle = 'rgba(70, 26, 14, 0.65)';
    g.beginPath();
    g.ellipse(arg.x, arg.y, size * 0.045, size * 0.038, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#b86232';
    g.beginPath();
    g.ellipse(arg.x, arg.y, size * 0.035, size * 0.028, 0, 0, Math.PI * 2);
    g.fill();

    // E. Dark Sinuous Highland Belts (Terra Sabaea & Tyrrhena Terra)
    g.strokeStyle = 'rgba(48, 16, 10, 0.7)';
    g.lineWidth = size * 0.028;
    g.beginPath();
    const ts1 = mPos(-15, 10);
    const ts2 = mPos(-20, 50);
    const ts3 = mPos(-12, 100);
    g.moveTo(ts1.x, ts1.y);
    g.quadraticCurveTo(ts2.x, ts2.y, ts3.x, ts3.y);
    g.stroke();

    // F. Valles Marineris — The Grand Canyon of Mars (14°S, 260°E to 320°E)
    const vmWest = mPos(-14, 260); // Noctis Labyrinthus
    const vmMid = mPos(-14, 285);  // Melas / Candor Chasma
    const vmEast = mPos(-12, 315); // Coprates Chasma -> Chryse outflow
    
    // Noctis Labyrinthus canyon fractures
    g.strokeStyle = '#220804';
    g.lineWidth = 1.5;
    for (let f = 0; f < 5; f++) {
      g.beginPath();
      g.moveTo(vmWest.x - 6 + f * 3, vmWest.y - 4 + (f % 2) * 8);
      g.lineTo(vmWest.x + f * 4, vmWest.y + (f % 3) * 3);
      g.stroke();
    }

    // Main Chasma Trough (Deep shadowed canyon floor)
    g.strokeStyle = '#180603';
    g.lineWidth = size * 0.018;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(vmWest.x, vmWest.y);
    g.quadraticCurveTo(vmMid.x, vmMid.y + size * 0.012, vmEast.x, vmEast.y);
    g.stroke();

    // Parallel canyon wall rims
    g.strokeStyle = 'rgba(215, 115, 60, 0.7)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(vmWest.x, vmWest.y - size * 0.01);
    g.quadraticCurveTo(vmMid.x, vmMid.y, vmEast.x, vmEast.y - size * 0.008);
    g.stroke();
    g.beginPath();
    g.moveTo(vmWest.x, vmWest.y + size * 0.01);
    g.quadraticCurveTo(vmMid.x, vmMid.y + size * 0.022, vmEast.x, vmEast.y + size * 0.01);
    g.stroke();

    // Branching side canyons (Ius, Tithonium, Ophir Chasmata)
    g.strokeStyle = '#240a05';
    g.lineWidth = size * 0.008;
    g.beginPath();
    g.moveTo(vmMid.x - size * 0.02, vmMid.y);
    g.lineTo(vmMid.x - size * 0.035, vmMid.y - size * 0.022);
    g.stroke();
    g.beginPath();
    g.moveTo(vmMid.x + size * 0.015, vmMid.y);
    g.lineTo(vmMid.x + size * 0.03, vmMid.y - size * 0.025);
    g.stroke();

    // G. The Colossal Volcanoes of Mars
    // 1. Olympus Mons (18.65°N, 226.2°E) — The Largest Volcano in the Solar System
    const om = mPos(18.65, 226.2);
    // Outer basal scarp / cliff ring
    g.strokeStyle = '#3e150a';
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(om.x, om.y, size * 0.045, 0, Math.PI * 2);
    g.stroke();
    // Volcanic shield dome flank
    const omDome = g.createRadialGradient(om.x, om.y, 0, om.x, om.y, size * 0.044);
    omDome.addColorStop(0, '#c85e30');
    omDome.addColorStop(0.65, '#b04e24');
    omDome.addColorStop(0.9, '#7c2e14');
    omDome.addColorStop(1, '#3e150a');
    g.fillStyle = omDome;
    g.beginPath();
    g.arc(om.x, om.y, size * 0.044, 0, Math.PI * 2);
    g.fill();
    // Radiating basaltic lava ridges
    g.strokeStyle = 'rgba(75, 25, 12, 0.45)';
    g.lineWidth = 1;
    for (let r = 0; r < 8; r++) {
      const a = (r / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(om.x + Math.cos(a) * (size * 0.01), om.y + Math.sin(a) * (size * 0.01));
      g.lineTo(om.x + Math.cos(a) * (size * 0.038), om.y + Math.sin(a) * (size * 0.038));
      g.stroke();
    }
    // Summit Caldera: Nested multi-ring volcanic depression pit
    g.fillStyle = '#1c0602';
    g.beginPath();
    g.arc(om.x, om.y, size * 0.009, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#d47242';
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(om.x, om.y, size * 0.009, 0, Math.PI * 2);
    g.stroke();
    // High-altitude orographic water-ice cloud crown over summit
    g.fillStyle = 'rgba(220, 238, 255, 0.45)';
    g.beginPath();
    g.ellipse(om.x + 2, om.y - 1, size * 0.02, size * 0.012, 0.2, 0, Math.PI * 2);
    g.fill();

    // 2. Tharsis Montes Trio (Ascraeus, Pavonis, Arsia Mons)
    const tharsis = [
      { name: 'Arsia Mons', ...mPos(-8.4, 239.0), r: size * 0.024 },
      { name: 'Pavonis Mons', ...mPos(0.8, 247.0), r: size * 0.022 },
      { name: 'Ascraeus Mons', ...mPos(11.9, 255.5), r: size * 0.025 },
    ];
    for (const tm of tharsis) {
      const tGrad = g.createRadialGradient(tm.x, tm.y, 0, tm.x, tm.y, tm.r);
      tGrad.addColorStop(0, '#c25828');
      tGrad.addColorStop(0.8, '#8c3516');
      tGrad.addColorStop(1, '#48190c');
      g.fillStyle = tGrad;
      g.beginPath();
      g.arc(tm.x, tm.y, tm.r, 0, Math.PI * 2);
      g.fill();
      // Summit caldera
      g.fillStyle = '#1e0703';
      g.beginPath();
      g.arc(tm.x, tm.y, tm.r * 0.22, 0, Math.PI * 2);
      g.fill();
      // Delicate orographic frost cloud
      g.fillStyle = 'rgba(215, 232, 255, 0.35)';
      g.beginPath();
      g.ellipse(tm.x + 1, tm.y - 1, tm.r * 0.6, tm.r * 0.35, 0.1, 0, Math.PI * 2);
      g.fill();
    }

    // H. Impact Craters with Rims and Central Peaks
    const craters = [
      { ...mPos(-3, 17), r: size * 0.022 },   // Schiaparelli Crater (460km)
      { ...mPos(-14, 55), r: size * 0.018 },  // Huygens Crater
      { ...mPos(-5, 137), r: size * 0.012 },  // Gale Crater
      { ...mPos(18, 77), r: size * 0.011 },   // Jezero Crater
      { ...mPos(-30, 200), r: size * 0.014 }, // Newton Crater
      { ...mPos(-40, 240), r: size * 0.013 },
    ];
    for (const cr of craters) {
      // Raised rim
      g.strokeStyle = '#d47242';
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2);
      g.stroke();
      // Floor shadow
      g.fillStyle = 'rgba(32, 10, 6, 0.65)';
      g.beginPath();
      g.arc(cr.x, cr.y, cr.r * 0.85, 0, Math.PI * 2);
      g.fill();
      // Central peak
      g.fillStyle = '#e08452';
      g.beginPath();
      g.arc(cr.x, cr.y, cr.r * 0.2, 0, Math.PI * 2);
      g.fill();
      // Downwind windblown dust tail
      g.strokeStyle = 'rgba(215, 125, 75, 0.35)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(cr.x + cr.r, cr.y);
      g.lineTo(cr.x + cr.r * 2.5, cr.y + cr.r * 0.4);
      g.stroke();
    }

    // I. Polar Ice Caps
    // 1. North Polar Cap (Planum Boreum): Brilliant white with spiral pinwheel chasm troughs
    g.fillStyle = '#260c06'; // Olympia Undae dune sea border
    g.fillRect(xOff, size * 0.045, size, size * 0.025);

    // North ice sheet
    const northIce = g.createLinearGradient(0, 0, 0, size * 0.06);
    northIce.addColorStop(0, '#ffffff');
    northIce.addColorStop(0.65, '#f4f8fa');
    northIce.addColorStop(1, '#dfeaf0');
    g.fillStyle = northIce;
    g.beginPath();
    g.ellipse(xOff + size * 0.5, size * 0.025, size * 0.45, size * 0.045, 0, 0, Math.PI * 2);
    g.fill();

    // Spiral Chasma Boreale dark chasm grooves cutting into the ice
    g.strokeStyle = 'rgba(60, 22, 12, 0.75)';
    g.lineWidth = 1.2;
    for (let sp = 0; sp < 6; sp++) {
      const spX = xOff + size * (0.2 + sp * 0.11);
      g.beginPath();
      g.moveTo(spX, 0);
      g.quadraticCurveTo(spX + 15, size * 0.025, spX + 35, size * 0.05);
      g.stroke();
    }

    // 2. South Polar Cap (Planum Australe): Compact brilliant white dry-ice frost cap
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(xOff + size * 0.5, size * 0.975, size * 0.3, size * 0.038, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(220, 235, 245, 0.8)';
    g.lineWidth = 1;
    g.stroke();
  }

  return c;
}

function createJupiterTexture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size * 2;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;

  // 13-stop warm Jovian atmospheric base with precise belt/zone layers
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0,    '#3e2618');
  bg.addColorStop(0.06, '#5a3a22');
  bg.addColorStop(0.12, '#8c5e3c');
  bg.addColorStop(0.19, '#c4aa7a');
  bg.addColorStop(0.26, '#9c5e35');
  bg.addColorStop(0.33, '#d4bc90');
  bg.addColorStop(0.40, '#a06238');
  bg.addColorStop(0.50, '#e8d8b4');
  bg.addColorStop(0.58, '#8c4422');
  bg.addColorStop(0.66, '#c8b080');
  bg.addColorStop(0.74, '#7c4830');
  bg.addColorStop(0.84, '#5a3822');
  bg.addColorStop(1,    '#3a2214');
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, size);

  // 28 turbulent atmospheric wave striations with harmonic superposition
  const numBands = 28;
  for (let b = 0; b < numBands; b++) {
    const yCenter = (b / numBands) * size;
    const bandH = (size / numBands) * 1.35;
    const isDark = b % 2 === 1;
    const ampScale = 1 + 1.5 * Math.exp(-Math.pow((b / numBands - 0.5) * 4, 2));
    g.fillStyle = isDark ? 'rgba(65, 28, 10, 0.30)' : 'rgba(255, 242, 218, 0.24)';
    g.beginPath();
    g.moveTo(0, yCenter);
    for (let x = 0; x <= c.width; x += 8) {
      const wave =
        Math.sin(x * 0.016 + b * 1.42) * (size * 0.016 * ampScale) +
        Math.sin(x * 0.048 - b * 0.76) * (size * 0.007 * ampScale) +
        Math.sin(x * 0.095 + b * 0.31) * (size * 0.003);
      g.lineTo(x, yCenter + wave);
    }
    g.lineTo(c.width, yCenter + bandH);
    g.lineTo(0, yCenter + bandH);
    g.closePath();
    g.fill();
  }

  // NEB festoons — dark finger-like projections into the Equatorial Zone
  g.fillStyle = 'rgba(88, 40, 14, 0.42)';
  for (let x = 0; x < c.width; x += 80) {
    const festoonX = x + Math.sin(x * 0.02) * 15;
    g.beginPath();
    g.ellipse(festoonX, size * 0.44, 8, 16, 0.15, 0, Math.PI * 2);
    g.fill();
  }

  // Equatorial Zone dark barges (cyclonic ovals in NEB)
  for (let x = 55; x < c.width; x += 145) {
    g.fillStyle = 'rgba(70, 32, 10, 0.38)';
    g.beginPath();
    g.ellipse(x, size * 0.42, 22, 8, 0.05, 0, Math.PI * 2);
    g.fill();
  }

  // North polar vortex with hexagonal turbulence arms
  for (let wrap = 0; wrap < 2; wrap++) {
    const pvx = c.width * (0.3 + wrap * 0.5);
    const pvy = size * 0.05;
    const pvGrad = g.createRadialGradient(pvx, pvy, 2, pvx, pvy, size * 0.07);
    pvGrad.addColorStop(0, 'rgba(100, 60, 35, 0.7)');
    pvGrad.addColorStop(0.5, 'rgba(70, 40, 20, 0.4)');
    pvGrad.addColorStop(1, 'rgba(50, 28, 14, 0)');
    g.fillStyle = pvGrad;
    g.beginPath();
    g.arc(pvx, pvy, size * 0.07, 0, Math.PI * 2);
    g.fill();
    for (let arm = 0; arm < 6; arm++) {
      const a = (arm / 6) * Math.PI * 2;
      g.strokeStyle = 'rgba(80, 45, 20, 0.3)';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(pvx, pvy);
      g.lineTo(pvx + Math.cos(a) * size * 0.055, pvy + Math.sin(a) * size * 0.04);
      g.stroke();
    }
  }

  // South polar vortex
  for (let wrap = 0; wrap < 2; wrap++) {
    const pvx = c.width * (0.55 + wrap * 0.5);
    const pvy = size * 0.94;
    const pvGrad = g.createRadialGradient(pvx, pvy, 1, pvx, pvy, size * 0.055);
    pvGrad.addColorStop(0, 'rgba(80, 48, 28, 0.65)');
    pvGrad.addColorStop(1, 'rgba(50, 30, 15, 0)');
    g.fillStyle = pvGrad;
    g.beginPath();
    g.arc(pvx, pvy, size * 0.055, 0, Math.PI * 2);
    g.fill();
  }

  // South hemisphere anticyclonic white ovals ("pearls") with dark rings
  for (let x = 20; x < c.width; x += 115) {
    const wy = size * 0.76 + Math.sin(x * 0.06) * 5;
    const wg = g.createRadialGradient(x, wy, 1, x, wy, 9);
    wg.addColorStop(0, 'rgba(255, 255, 248, 0.72)');
    wg.addColorStop(0.5, 'rgba(235, 230, 215, 0.35)');
    wg.addColorStop(1, 'rgba(200, 195, 180, 0)');
    g.fillStyle = wg;
    g.beginPath();
    g.ellipse(x, wy, 9, 4.5, 0.08, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(70, 38, 14, 0.28)';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(x, wy, 11, 5.5, 0.08, 0, Math.PI * 2);
    g.stroke();
  }

  // Oval BA — "Red Spot Jr" in South Tropical Zone
  for (let wrap = 0; wrap < 2; wrap++) {
    const bax = c.width * (0.65 + wrap * 0.5);
    const bay = size * 0.72;
    const baGrad = g.createRadialGradient(bax, bay, 1, bax, bay, size * 0.045);
    baGrad.addColorStop(0, '#d44020');
    baGrad.addColorStop(0.5, '#b83015');
    baGrad.addColorStop(0.85, '#882210');
    baGrad.addColorStop(1, 'rgba(100, 30, 10, 0)');
    g.fillStyle = baGrad;
    g.beginPath();
    g.ellipse(bax, bay, size * 0.045, size * 0.025, -0.05, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(240, 160, 100, 0.5)';
    g.beginPath();
    g.ellipse(bax - 1, bay - 0.5, size * 0.018, size * 0.01, -0.05, 0, Math.PI * 2);
    g.fill();
  }

  // Great Red Spot — ultra-detailed with spiral arms, collar, and bright eye
  const grsX1 = c.width * 0.35;
  const grsX2 = grsX1 + c.width * 0.5;
  [grsX1, grsX2].forEach((gx) => {
    const gy = size * 0.60;
    // Dark collar
    const grsCollar = g.createRadialGradient(gx, gy, size * 0.09, gx, gy, size * 0.155);
    grsCollar.addColorStop(0, 'rgba(60, 20, 6, 0.22)');
    grsCollar.addColorStop(1, 'rgba(60, 20, 6, 0)');
    g.fillStyle = grsCollar;
    g.beginPath();
    g.ellipse(gx, gy, size * 0.155, size * 0.085, -0.06, 0, Math.PI * 2);
    g.fill();
    // Outer storm
    const grsOuter = g.createRadialGradient(gx, gy, size * 0.04, gx, gy, size * 0.13);
    grsOuter.addColorStop(0, '#c44020');
    grsOuter.addColorStop(0.4, '#a83214');
    grsOuter.addColorStop(0.75, '#7e2008');
    grsOuter.addColorStop(1, 'rgba(90, 25, 6, 0)');
    g.fillStyle = grsOuter;
    g.beginPath();
    g.ellipse(gx, gy, size * 0.13, size * 0.072, -0.06, 0, Math.PI * 2);
    g.fill();
    // Spiral arm rings
    for (let ring = 0; ring < 4; ring++) {
      const rf = 1 - ring * 0.22;
      g.strokeStyle = `rgba(${100 + ring * 15}, ${25 + ring * 5}, 8, 0.22)`;
      g.lineWidth = 1.5 + ring * 0.5;
      g.beginPath();
      g.ellipse(gx + ring * 1.5, gy + ring * 0.5, size * 0.12 * rf, size * 0.065 * rf, -0.06 + ring * 0.04, 0, Math.PI * 2);
      g.stroke();
    }
    // Inner eye
    const grsInner = g.createRadialGradient(gx, gy, 1, gx, gy, size * 0.068);
    grsInner.addColorStop(0, '#e85a38');
    grsInner.addColorStop(0.6, '#c2381c');
    grsInner.addColorStop(1, '#8e2210');
    g.fillStyle = grsInner;
    g.beginPath();
    g.ellipse(gx, gy, size * 0.075, size * 0.042, -0.06, 0, Math.PI * 2);
    g.fill();
    // Bright cream anticyclone eye
    const grsEye = g.createRadialGradient(gx - 2, gy - 1.5, 0, gx - 2, gy - 1.5, size * 0.028);
    grsEye.addColorStop(0, 'rgba(255, 240, 218, 0.82)');
    grsEye.addColorStop(0.5, 'rgba(245, 215, 180, 0.45)');
    grsEye.addColorStop(1, 'rgba(230, 190, 140, 0)');
    g.fillStyle = grsEye;
    g.beginPath();
    g.ellipse(gx - 2, gy - 1.5, size * 0.028, size * 0.015, -0.08, 0, Math.PI * 2);
    g.fill();
  });

  return c;
}

function createSaturnTexture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size * 2;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;

  // 11-stop warm golden amber multi-layered base
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0,    '#4a3820');   // North Polar Hood
  bg.addColorStop(0.06, '#6a5038');   // North Polar Region
  bg.addColorStop(0.15, '#8a6a48');   // North North Temperate
  bg.addColorStop(0.28, '#c4a46e');   // North Temperate Zone
  bg.addColorStop(0.38, '#a08050');   // North Equatorial Belt
  bg.addColorStop(0.50, '#e2cc9c');   // Equatorial Zone (golden cream)
  bg.addColorStop(0.62, '#b89a60');   // South Equatorial Belt
  bg.addColorStop(0.74, '#c8ae78');   // South Temperate Zone
  bg.addColorStop(0.84, '#8a6c44');   // South South Temperate
  bg.addColorStop(0.92, '#6a5038');   // South Polar Region
  bg.addColorStop(1,    '#4a3820');   // South Polar Hood
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, size);

  // 22 delicate golden atmospheric stripes with harmonic wave edges
  const bands = 22;
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * size;
    const h = (size / bands) * 1.25;
    g.fillStyle = i % 2 === 0 ? 'rgba(170, 138, 85, 0.24)' : 'rgba(255, 238, 195, 0.20)';
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 14) {
      const wave = Math.sin(x * 0.02 + i * 0.9) * 3.5 + Math.sin(x * 0.055 - i * 0.5) * 1.5;
      g.lineTo(x, y + wave);
    }
    g.lineTo(c.width, y + h);
    g.lineTo(0, y + h);
    g.closePath();
    g.fill();
  }

  // North Polar hexagonal jet stream (Saturn's famous polar hexagon)
  for (let wrap = 0; wrap < 2; wrap++) {
    const hx = c.width * (0.35 + wrap * 0.5);
    const hy = size * 0.06;
    g.strokeStyle = 'rgba(160, 130, 80, 0.4)';
    g.lineWidth = 2;
    g.beginPath();
    for (let v = 0; v <= 6; v++) {
      const a = (v / 6) * Math.PI * 2 - Math.PI / 2;
      const px = hx + Math.cos(a) * size * 0.055;
      const py = hy + Math.sin(a) * size * 0.038;
      if (v === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.stroke();
    // Central polar cyclone
    const pcGrad = g.createRadialGradient(hx, hy, 1, hx, hy, size * 0.035);
    pcGrad.addColorStop(0, 'rgba(100, 75, 40, 0.6)');
    pcGrad.addColorStop(1, 'rgba(80, 60, 30, 0)');
    g.fillStyle = pcGrad;
    g.beginPath();
    g.arc(hx, hy, size * 0.035, 0, Math.PI * 2);
    g.fill();
  }

  // Great White Spot storm (periodically observed)
  for (let wrap = 0; wrap < 2; wrap++) {
    const swx = c.width * (0.45 + wrap * 0.5);
    const swy = size * 0.36;
    const swGrad = g.createRadialGradient(swx, swy, 1, swx, swy, size * 0.05);
    swGrad.addColorStop(0, 'rgba(255, 252, 240, 0.65)');
    swGrad.addColorStop(0.5, 'rgba(240, 230, 200, 0.3)');
    swGrad.addColorStop(1, 'rgba(220, 210, 180, 0)');
    g.fillStyle = swGrad;
    g.beginPath();
    g.ellipse(swx, swy, size * 0.05, size * 0.028, 0.05, 0, Math.PI * 2);
    g.fill();
  }

  // Ammonia ice crystal clouds (subtle bright spots)
  for (let x = 40; x < c.width; x += 100) {
    const cy = size * (0.25 + Math.sin(x * 0.03) * 0.15);
    g.fillStyle = 'rgba(255, 248, 225, 0.25)';
    g.beginPath();
    g.ellipse(x, cy, 12, 3, Math.sin(x * 0.01) * 0.3, 0, Math.PI * 2);
    g.fill();
  }

  return c;
}

function createUranusTexture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size * 2;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;

  // Rich cyan-teal methane ice giant atmosphere with multi-stop gradient
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0,    '#44a09e');   // North Polar (slightly darker teal)
  bg.addColorStop(0.15, '#58bbb8');
  bg.addColorStop(0.35, '#6cd0cc');
  bg.addColorStop(0.50, '#7ae0dc');   // Equatorial (brightest)
  bg.addColorStop(0.65, '#6cd0cc');
  bg.addColorStop(0.85, '#58bbb8');
  bg.addColorStop(1,    '#44a09e');   // South Polar
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, size);

  // Subtle methane haze banding (Uranus has very faint banding)
  for (let b = 0; b < 8; b++) {
    const by = (b / 8) * size + size * 0.06;
    g.fillStyle = b % 2 === 0 ? 'rgba(255, 255, 255, 0.06)' : 'rgba(80, 180, 178, 0.08)';
    g.fillRect(0, by, c.width, size * 0.06);
  }

  // South Polar cap — brighter methane haze region
  const capGrad = g.createRadialGradient(c.width * 0.5, size, size * 0.05, c.width * 0.5, size, size * 0.28);
  capGrad.addColorStop(0, 'rgba(140, 240, 235, 0.35)');
  capGrad.addColorStop(0.5, 'rgba(120, 220, 218, 0.15)');
  capGrad.addColorStop(1, 'rgba(100, 200, 200, 0)');
  g.fillStyle = capGrad;
  g.fillRect(0, size * 0.72, c.width, size * 0.28);

  // Polar collar — darker ring around the pole
  g.strokeStyle = 'rgba(50, 140, 138, 0.25)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, size * 0.82);
  for (let x = 0; x <= c.width; x += 15) {
    g.lineTo(x, size * 0.82 + Math.sin(x * 0.03) * 2);
  }
  g.stroke();

  // Bright cloud features (rare but observed by Hubble/Keck)
  g.fillStyle = 'rgba(200, 250, 248, 0.30)';
  for (let i = 0; i < 5; i++) {
    const cx = (i * 0.2 + 0.08) * c.width;
    const cy2 = size * (0.3 + Math.sin(i * 1.5) * 0.18);
    g.beginPath();
    g.ellipse(cx, cy2, 8, 2.5, i * 0.3, 0, Math.PI * 2);
    g.fill();
  }

  return c;
}


function createNeptuneTexture(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size * 2;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;

  // 9-stop vivid deep azure blue — the most intensely blue planet
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0,    '#0e2d80');   // North Polar (darkest)
  bg.addColorStop(0.12, '#1440aa');
  bg.addColorStop(0.28, '#1c55c8');
  bg.addColorStop(0.42, '#2268e0');
  bg.addColorStop(0.50, '#2870e8');   // Equatorial (brightest azure)
  bg.addColorStop(0.62, '#2060d8');
  bg.addColorStop(0.76, '#1848b8');
  bg.addColorStop(0.90, '#1230a0');
  bg.addColorStop(1,    '#0a2080');   // South Polar
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, size);

  // 12 faint atmospheric bands (Neptune has visible banding)
  for (let b = 0; b < 12; b++) {
    const by = (b / 12) * size;
    const bh = (size / 12) * 1.15;
    g.fillStyle = b % 2 === 0 ? 'rgba(30, 80, 180, 0.12)' : 'rgba(80, 140, 255, 0.10)';
    g.beginPath();
    g.moveTo(0, by);
    for (let x = 0; x <= c.width; x += 12) {
      g.lineTo(x, by + Math.sin(x * 0.025 + b * 0.8) * 2.5);
    }
    g.lineTo(c.width, by + bh);
    g.lineTo(0, by + bh);
    g.closePath();
    g.fill();
  }

  // Fast-moving east-west wind streaks (Neptune has fastest winds in solar system)
  for (let i = 0; i < 6; i++) {
    const wy = size * (0.2 + i * 0.12);
    g.strokeStyle = `rgba(100, 170, 255, ${0.12 + i * 0.02})`;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(0, wy);
    for (let x = 0; x <= c.width; x += 10) {
      g.lineTo(x, wy + Math.sin(x * 0.035 + i * 0.6) * 3);
    }
    g.stroke();
  }

  // Great Dark Spot — deep vortex storm (Voyager 2 feature)
  for (let wrap = 0; wrap < 2; wrap++) {
    const gdsx = c.width * (0.38 + wrap * 0.5);
    const gdsy = size * 0.42;
    // Dark core
    const gdsGrad = g.createRadialGradient(gdsx, gdsy, 1, gdsx, gdsy, size * 0.085);
    gdsGrad.addColorStop(0, 'rgba(5, 12, 55, 0.80)');
    gdsGrad.addColorStop(0.5, 'rgba(8, 18, 70, 0.55)');
    gdsGrad.addColorStop(0.8, 'rgba(10, 22, 80, 0.25)');
    gdsGrad.addColorStop(1, 'rgba(12, 25, 90, 0)');
    g.fillStyle = gdsGrad;
    g.beginPath();
    g.ellipse(gdsx, gdsy, size * 0.085, size * 0.05, -0.12, 0, Math.PI * 2);
    g.fill();
    // Bright companion cloud (just south of GDS, white methane cirrus)
    g.fillStyle = 'rgba(255, 255, 255, 0.58)';
    g.beginPath();
    g.ellipse(gdsx + size * 0.06, gdsy + size * 0.04, size * 0.03, size * 0.012, -0.12, 0, Math.PI * 2);
    g.fill();
  }

  // "Scooter" — fast-moving bright cloud feature at ~-42° latitude
  for (let wrap = 0; wrap < 2; wrap++) {
    const scx = c.width * (0.6 + wrap * 0.5);
    const scy = size * 0.63;
    g.fillStyle = 'rgba(255, 255, 255, 0.48)';
    g.beginPath();
    g.ellipse(scx, scy, 18, 4, 0.05, 0, Math.PI * 2);
    g.fill();
  }

  // High-altitude white cirrus storm clouds (methane ice)
  for (let i = 0; i < 10; i++) {
    const cx = (i * 0.19 + 0.03) * c.width;
    const cy = size * (0.25 + Math.sin(i * 0.7) * 0.22);
    g.fillStyle = `rgba(255, 255, 255, ${0.25 + Math.sin(i * 1.3) * 0.12})`;
    g.beginPath();
    g.ellipse(cx, cy, 20 + i * 2, 3, 0.04 + i * 0.01, 0, Math.PI * 2);
    g.fill();
  }

  return c;
}


export class SolarSystemLayer implements SpaceLayer {
  private textures = new Map<PlanetKey, HTMLCanvasElement>();
  private earthClouds: HTMLCanvasElement | null = null;
  private earthNightLights: HTMLCanvasElement | null = null;

  init(_state: SceneState): void {
    // Pre-render textures at crisp high resolution (384 for Earth & Mars)
    const texSize = 384;
    if (!this.textures.has('mercury')) {
      this.textures.set('mercury', createMercuryTexture(texSize));
      this.textures.set('venus', createVenusTexture(texSize));
      const earthTex = createEarthTexture(texSize);
      this.textures.set('earth', earthTex.surface);
      this.earthClouds = earthTex.clouds;
      this.earthNightLights = earthTex.nightLights;

      // Asynchronously load real-world high-resolution coastlines & landmasses
      void import('../worldLandmasses').then(({ WORLD_LANDMASSES }) => {
        const detailedEarth = createEarthTexture(texSize, WORLD_LANDMASSES);
        this.textures.set('earth', detailedEarth.surface);
        this.earthClouds = detailedEarth.clouds;
        this.earthNightLights = detailedEarth.nightLights;
      });

      this.textures.set('mars', createMarsTexture(texSize));
      this.textures.set('jupiter', createJupiterTexture(texSize));
      this.textures.set('saturn', createSaturnTexture(texSize));
      this.textures.set('uranus', createUranusTexture(texSize));
      this.textures.set('neptune', createNeptuneTexture(texSize));
    }
  }

  draw(state: SceneState): void {
    const { ctx, theme, intensity, journey, width, height, mouse } = state;
    if (theme === 'light') return; // Dark deep-space aesthetic

    const elapsed = journey.elapsed;
    // Journey-coupled motion runs on the slowed mission clock (see MOTION_RATE)
    // so rotation and orbits stay legible inside the shortened flyby windows.
    const motion = elapsed * MOTION_RATE;

    // Check each planet's deterministic voyage window
    for (const config of PLANET_CONFIGS) {
      if (elapsed < config.startSec || elapsed > config.endSec) {
        continue;
      }

      const texture = this.textures.get(config.key);
      if (!texture) continue;

      // Local progress within this planet's flyby window (0..1)
      const duration = config.endSec - config.startSec;
      const flybyProg = Math.max(0, Math.min(1, (elapsed - config.startSec) / duration));

      // Smooth easing in and out across the screen
      // Quadratic bezier curve from startPos through peakPos to endPos
      const t = flybyProg;
      const invT = 1 - t;
      const xRatio = invT * invT * config.startPos.xRatio + 2 * invT * t * config.peakPos.xRatio + t * t * config.endPos.xRatio;
      const yRatio = invT * invT * config.startPos.yRatio + 2 * invT * t * config.peakPos.yRatio + t * t * config.endPos.yRatio;

      // Parallax mouse offset
      const px = mouse.x * 14;
      const py = mouse.y * 10;

      const cx = xRatio * width + px;
      const cy = yRatio * height + py;

      // Scale up slightly at closest approach (t=0.5)
      const scaleApproach = 1.0 + Math.sin(flybyProg * Math.PI) * 0.35;
      const radius = config.baseRadius * scaleApproach * (width < 768 ? 0.75 : 1.0);

      // Axial rotation calculation (continuous rotation requirement)
      const rot = (motion / config.rotPeriodSec) % 1;

      // Opacity fades in at entrance and out at exit
      let alpha = 1.0;
      if (flybyProg < 0.1) alpha = flybyProg / 0.1;
      else if (flybyProg > 0.9) alpha = (1 - flybyProg) / 0.1;
      alpha *= intensity;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Draw Planet
      this.renderPlanetBody(ctx, config, texture, cx, cy, radius, rot, motion, intensity);

      // Draw Saturn Rings
      if (config.hasRings && config.key === 'saturn') {
        this.renderSaturnRings(ctx, cx, cy, radius, intensity);
      }

      // Draw Moons
      if (config.hasMoons) {
        this.renderMoons(ctx, config.key, cx, cy, radius, motion);
      }

      // Draw Subtle Scientific HUD Classification Tag (very faint, non-intrusive)
      if (flybyProg > 0.2 && flybyProg < 0.8) {
        const tagAlpha = Math.sin((flybyProg - 0.2) / 0.6 * Math.PI) * 0.35 * intensity;
        this.renderPlanetHud(ctx, config, cx, cy, radius, tagAlpha);
      }

      ctx.restore();
    }
  }

  private renderPlanetBody(
    ctx: CanvasRenderingContext2D,
    config: PlanetConfig,
    texture: HTMLCanvasElement,
    cx: number,
    cy: number,
    radius: number,
    rot: number,
    motion: number,
    intensity: number
  ): void {
    // 1. Atmosphere Radial Glow behind planet
    ctx.save();
    ctx.globalAlpha = config.atmosphereGlow * 0.75 * intensity;
    const atmoGrad = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.25);
    atmoGrad.addColorStop(0, config.atmosphereColor);
    atmoGrad.addColorStop(0.6, config.atmosphereColor.replace(/[\d\.]+\)$/, '0.2)'));
    atmoGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Spherical Texture Mapping via Circular Clip & Horizontal Scrolling
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Scrolling 2x texture strip
    const texHalfW = texture.width / 2;
    const texH = texture.height;
    const scale = (radius * 2) / texH;
    const drawW = texture.width * scale;
    const drawH = texture.height * scale;
    const offset = rot * texHalfW * scale;

    ctx.drawImage(texture, cx - radius - offset, cy - radius, drawW, drawH);
    ctx.drawImage(texture, cx - radius - offset + drawW, cy - radius, drawW, drawH);

    // If Earth: layer rotating clouds with drop shadow on surface + specular glint
    if (config.hasClouds && this.earthClouds) {
      const cloudRot = (motion / 45) % 1; // clouds drift faster
      const cOffset = cloudRot * texHalfW * scale;

      // Cloud shadow cast onto surface beneath (offset slightly down-right)
      ctx.save();
      ctx.globalAlpha = 0.28 * intensity;
      ctx.drawImage(this.earthClouds, cx - radius - cOffset + radius * 0.015, cy - radius + radius * 0.015, drawW, drawH);
      ctx.drawImage(this.earthClouds, cx - radius - cOffset + drawW + radius * 0.015, cy - radius + radius * 0.015, drawW, drawH);
      ctx.restore();

      // Crisp clouds
      ctx.globalAlpha = 0.68 * intensity;
      ctx.drawImage(this.earthClouds, cx - radius - cOffset, cy - radius, drawW, drawH);
      ctx.drawImage(this.earthClouds, cx - radius - cOffset + drawW, cy - radius, drawW, drawH);
      ctx.globalAlpha = 1.0;
    }

    // Specular ocean sun glint (sunlight reflection on water on sunlit hemisphere)
    if (config.key === 'earth') {
      ctx.save();
      const glint = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        0,
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.5
      );
      glint.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      glint.addColorStop(0.3, 'rgba(180, 225, 255, 0.15)');
      glint.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glint;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
    }

    // 3. Realistic Day/Night Terminator Shading
    // Light source assumed upper-left; night shadow lower-right
    const term = ctx.createRadialGradient(
      cx - radius * 0.42,
      cy - radius * 0.42,
      radius * 0.15,
      cx,
      cy,
      radius * 1.15
    );
    term.addColorStop(0, 'rgba(255,255,255,0.08)');
    term.addColorStop(0.48, 'rgba(0,0,0,0)');
    term.addColorStop(0.72, 'rgba(0,0,0,0.65)');
    term.addColorStop(1, 'rgba(0,0,0,0.96)');
    ctx.fillStyle = term;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    // If Earth: Night-side human city lights glowing on the dark side of the terminator
    if (config.key === 'earth' && this.earthNightLights) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.85 * intensity;
      ctx.drawImage(this.earthNightLights, cx - radius - offset, cy - radius, drawW, drawH);
      ctx.drawImage(this.earthNightLights, cx - radius - offset + drawW, cy - radius, drawW, drawH);
      ctx.restore();
    }

    // If Mars: Blue twilight limb scattering (the famous Martian blue twilight)
    if (config.key === 'mars') {
      ctx.save();
      const blueTwilight = ctx.createRadialGradient(
        cx - radius * 0.42,
        cy - radius * 0.42,
        radius * 0.8,
        cx - radius * 0.42,
        cy - radius * 0.42,
        radius * 1.18
      );
      blueTwilight.addColorStop(0, 'rgba(0,0,0,0)');
      blueTwilight.addColorStop(0.55, 'rgba(120, 180, 235, 0.18)');
      blueTwilight.addColorStop(0.85, 'rgba(80, 140, 210, 0.1)');
      blueTwilight.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = blueTwilight;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
    }

    ctx.restore();

    // 4. Double-layer Rayleigh scattering atmospheric rim
    ctx.save();
    if (config.key === 'earth') {
      // Outer deep sapphire atmospheric glow
      ctx.strokeStyle = 'rgba(25, 95, 230, 0.4)';
      ctx.lineWidth = Math.max(1.5, radius * 0.038);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + ctx.lineWidth * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Inner razor-sharp electric cyan rim
      ctx.strokeStyle = 'rgba(70, 200, 255, 0.85)';
      ctx.lineWidth = Math.max(1, radius * 0.016);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (config.key === 'mars') {
      // Outer soft dusty salmon-pink haze
      ctx.strokeStyle = 'rgba(235, 115, 65, 0.4)';
      ctx.lineWidth = Math.max(1.5, radius * 0.032);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + ctx.lineWidth * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Inner razor-sharp rust-orange rim
      ctx.strokeStyle = 'rgba(255, 145, 85, 0.75)';
      ctx.lineWidth = Math.max(1, radius * 0.014);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = config.atmosphereColor;
      ctx.lineWidth = Math.max(1, radius * 0.015);
      ctx.globalAlpha = config.atmosphereGlow * intensity;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderSaturnRings(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    intensity: number
  ): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35); // 20 degree ring tilt

    const ringRx = radius * 2.3;
    const ringRy = radius * 0.65;
    const innerRx = radius * 1.25;
    const innerRy = radius * 0.35;

    // Draw back half of rings (behind planet)
    // Note: in 2D we draw the rings with semi-transparent concentric ellipses
    ctx.globalAlpha = 0.85 * intensity;

    // Ring A & B gradient
    const ringGrad = ctx.createRadialGradient(0, 0, innerRx, 0, 0, ringRx);
    ringGrad.addColorStop(0, 'rgba(160, 140, 100, 0.25)'); // C Ring (crepe)
    ringGrad.addColorStop(0.2, 'rgba(215, 195, 150, 0.85)'); // B Ring (dense, bright)
    ringGrad.addColorStop(0.62, 'rgba(190, 170, 130, 0.85)');
    ringGrad.addColorStop(0.66, 'rgba(20, 15, 10, 0.1)'); // Cassini Division gap!
    ringGrad.addColorStop(0.72, 'rgba(185, 165, 125, 0.7)'); // A Ring
    ringGrad.addColorStop(0.98, 'rgba(150, 135, 105, 0.5)');
    ringGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = ringGrad;

    // Draw full ring ellipse with center cutout
    ctx.beginPath();
    ctx.ellipse(0, 0, ringRx, ringRy, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 0, innerRx, innerRy, 0, 0, Math.PI * 2, true); // counter-clockwise cutout
    ctx.fill();

    // Planet Shadow onto the back portion of the rings
    ctx.save();
    ctx.rotate(0.35); // un-tilt for shadow direction
    const shadowGrad = ctx.createLinearGradient(0, 0, radius * 1.5, radius * 1.5);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.8, 0.2, 1.2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  private renderMoons(
    ctx: CanvasRenderingContext2D,
    key: PlanetKey,
    cx: number,
    cy: number,
    radius: number,
    motion: number
  ): void {
    ctx.save();

    if (key === 'earth') {
      // The Moon (Luna) with maria, Tycho rays, and terminator shading
      const moonDist = radius * 1.8;
      const moonAngle = motion * 0.08;
      const mx = cx + Math.cos(moonAngle) * moonDist;
      const my = cy + Math.sin(moonAngle) * moonDist * 0.35;
      const mr = radius * 0.18;

      // Orbit guide track
      ctx.strokeStyle = 'rgba(120, 180, 255, 0.05)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, moonDist, moonDist * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Moon highland crust base
      ctx.fillStyle = '#d0cbbf';
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();

      // Lunar Maria (Dark basaltic plains: Oceanus Procellarum, Mare Tranquillitatis)
      ctx.fillStyle = '#6e6962';
      ctx.beginPath();
      ctx.ellipse(mx - mr * 0.2, my - mr * 0.15, mr * 0.35, mr * 0.28, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(mx + mr * 0.15, my - mr * 0.1, mr * 0.28, mr * 0.22, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(mx + mr * 0.2, my + mr * 0.18, mr * 0.24, mr * 0.18, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Tycho crater with bright ray system
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx - mr * 0.15, my + mr * 0.45, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.5;
      for (let r = 0; r < 4; r++) {
        const ra = (r / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(mx - mr * 0.15, my + mr * 0.45);
        ctx.lineTo(mx - mr * 0.15 + Math.cos(ra) * mr * 0.45, my + mr * 0.45 + Math.sin(ra) * mr * 0.45);
        ctx.stroke();
      }

      // Moon day/night terminator shading (light from upper-left)
      const moonTerm = ctx.createRadialGradient(
        mx - mr * 0.35, my - mr * 0.35, mr * 0.2,
        mx, my, mr * 1.15
      );
      moonTerm.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      moonTerm.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      moonTerm.addColorStop(0.75, 'rgba(0, 0, 0, 0.7)');
      moonTerm.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = moonTerm;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    } else if (key === 'jupiter') {
      // 4 Galilean Moons: Io, Europa, Ganymede, Callisto
      const moons = [
        { name: 'IO', dist: radius * 1.35, speed: 0.14, r: 3, col: '#f4c542' },
        { name: 'EUROPA', dist: radius * 1.7, speed: 0.09, r: 2.5, col: '#dfe6e9' },
        { name: 'GANYMEDE', dist: radius * 2.1, speed: 0.06, r: 4, col: '#a4b0be' },
        { name: 'CALLISTO', dist: radius * 2.6, speed: 0.035, r: 3.5, col: '#747d8c' },
      ];

      for (const m of moons) {
        const angle = motion * m.speed;
        const mx = cx + Math.cos(angle) * m.dist;
        const my = cy + Math.sin(angle) * m.dist * 0.25;

        ctx.fillStyle = m.col;
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();

        // Delicate moon orbit hint line
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, m.dist, m.dist * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (key === 'saturn') {
      // Titan moon
      const titanDist = radius * 3.0;
      const angle = motion * 0.045;
      const mx = cx + Math.cos(angle) * titanDist;
      const my = cy + Math.sin(angle) * titanDist * 0.3;

      ctx.fillStyle = '#e5a742'; // hazy orange nitrogen atmosphere
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (key === 'mars') {
      // Both Moons of Mars: Phobos (fast, irregular) and Deimos (outer, smooth)
      // 1. Phobos
      const pDist = radius * 1.38;
      const pAngle = motion * 0.22;
      const px = cx + Math.cos(pAngle) * pDist;
      const py = cy + Math.sin(pAngle) * pDist * 0.38;

      // Phobos orbit guide track
      ctx.strokeStyle = 'rgba(255, 180, 130, 0.06)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, pDist, pDist * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Irregular potato shape (elongated along orbit tangent)
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pAngle + Math.PI / 2);
      ctx.fillStyle = '#7a7268';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.2, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Stickney crater indentation
      ctx.fillStyle = 'rgba(20, 16, 12, 0.65)';
      ctx.beginPath();
      ctx.arc(1.2, -0.4, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Deimos
      const dDist = radius * 2.15;
      const dAngle = motion * 0.09;
      const dx = cx + Math.cos(dAngle) * dDist;
      const dy = cy + Math.sin(dAngle) * dDist * 0.38;

      // Deimos orbit guide track
      ctx.strokeStyle = 'rgba(255, 180, 130, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, dDist, dDist * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Deimos reddish-grey speck
      ctx.fillStyle = '#9e8e82';
      ctx.beginPath();
      ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderPlanetHud(
    ctx: CanvasRenderingContext2D,
    config: PlanetConfig,
    cx: number,
    cy: number,
    radius: number,
    alpha: number
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(160, 220, 255, 0.85)';
    ctx.strokeStyle = 'rgba(100, 190, 255, 0.4)';
    ctx.font = '9px "JetBrains Mono", Menlo, monospace';

    const tx = cx - radius * 0.9;
    const ty = cy + radius + 18;

    // Small HUD corner bracket
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx - 6, ty - 10);
    ctx.lineTo(tx - 6, ty + 12);
    ctx.lineTo(tx + 4, ty + 12);
    ctx.stroke();

    ctx.fillText(config.name, tx, ty);
    ctx.fillStyle = 'rgba(180, 200, 220, 0.6)';
    ctx.font = '8px "JetBrains Mono", Menlo, monospace';
    ctx.fillText(config.classification, tx, ty + 11);

    ctx.restore();
  }

  dispose(): void {
    this.textures.clear();
    this.earthClouds = null;
  }
}
