/* ═══════════════════════════════════════════════════════════════════════════
   JourneyTimeline — 2-minute deterministic cosmic voyage controller.
   Drives the entire outer-space environment along a predefined route:
   Space Station → Mercury/Venus → Earth → Mars → Jupiter → Saturn →
   Uranus → Neptune → Known Stars → Sun Encounter → Nebula & Asteroids →
   Spiral Galaxy → Hyperspace Jump → Seamless Loop back to Departure.

   The route is authored on a canonical 3600-second (60-minute) mission clock
   and compressed proportionally onto LOOP_SECONDS (120 s = 2 minutes), so every
   section — and therefore every planet, star and galaxy — is on screen at some
   point inside a single loop, in the original order.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Full loop duration in real seconds — the voyage repeats every 2 minutes. */
export const LOOP_SECONDS = 120;

/** Canonical mission-clock length the voyage schedule was authored against. */
export const MISSION_CLOCK_SECONDS = 3600;

/**
 * Compression ratio between the canonical mission clock and the live loop
 * (3600 s → 120 s = 30×). Used to (a) map authored schedule timestamps onto
 * the live loop via {@link scaleSec} and (b) drive journey-coupled motion
 * (axial spin, cloud drift, moon orbits) on the canonical cadence so every
 * encounter still plays its full choreography inside its shortened window.
 */
export const TIME_COMPRESSION = MISSION_CLOCK_SECONDS / LOOP_SECONDS;

/** Map a canonical mission-clock second onto the live 2-minute loop. */
export const scaleSec = (missionSec: number): number =>
  (missionSec * LOOP_SECONDS) / MISSION_CLOCK_SECONDS;

/**
 * Camera-sway cadence multiplier. Journey-coupled motion runs on the compressed
 * clock, but the Lissajous sway is a free-running comfort effect: at raw loop
 * time its slowest period (~480 s) would outlast the whole 2-minute loop and
 * the deck would feel frozen. 6× keeps the oscillation gentle (~16–80 s periods)
 * while still giving several visible drifts per loop.
 */
const SWAY_RATE_SCALE = 6;

export type JourneySectionId =
  | 'departure'
  | 'mercury_venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'deep_space_stars'
  | 'sun'
  | 'nebula_asteroids'
  | 'galaxy'
  | 'hyperspace';

export interface JourneySectionDef {
  id: JourneySectionId;
  name: string;
  sectorCode: string;
  startSec: number;
  endSec: number;
  startProg: number;
  endProg: number;
  ambientColor: [number, number, number]; // RGB bias [0..255]
  ambientBrightness: number;              // 0..1 multiplier
  description: string;
}

export const JOURNEY_SECTIONS: JourneySectionDef[] = [
  {
    id: 'departure',
    name: 'Orbital Departure & Space Station',
    sectorCode: 'SEC-01 · ORBITAL APEX',
    startSec: scaleSec(0),
    endSec: scaleSec(300), // canonical 05:00 → 00:10
    startProg: 0 / 3600,
    endProg: 300 / 3600,
    ambientColor: [14, 20, 36],
    ambientBrightness: 1.0,
    description: 'Undocking from Earth orbital station, aligning cruise trajectory',
  },
  {
    id: 'mercury_venus',
    name: 'Inner System: Mercury & Venus',
    sectorCode: 'SEC-02 · INNER HELIO',
    startSec: scaleSec(300),
    endSec: scaleSec(600), // canonical 10:00 → 00:20
    startProg: 300 / 3600,
    endProg: 600 / 3600,
    ambientColor: [32, 24, 18],
    ambientBrightness: 1.08,
    description: 'Cruising through inner rocky orbits past Mercury and veiled Venus',
  },
  {
    id: 'earth',
    name: 'Terra & Luna Orbital Corridor',
    sectorCode: 'SEC-03 · TERRA MATRIX',
    startSec: scaleSec(600),
    endSec: scaleSec(900), // canonical 15:00 → 00:30
    startProg: 600 / 3600,
    endProg: 900 / 3600,
    ambientColor: [12, 28, 48],
    ambientBrightness: 1.05,
    description: 'Observation of the blue marble Earth and its lunar companion',
  },
  {
    id: 'mars',
    name: 'Martian Approach & Phobos',
    sectorCode: 'SEC-04 · ARES CORRIDOR',
    startSec: scaleSec(900),
    endSec: scaleSec(1200), // canonical 20:00 → 00:40
    startProg: 900 / 3600,
    endProg: 1200 / 3600,
    ambientColor: [36, 16, 12],
    ambientBrightness: 1.0,
    description: 'Crimson rust plains, Valles Marineris and Olympus Mons',
  },
  {
    id: 'jupiter',
    name: 'Jovian Giant & Galilean Moons',
    sectorCode: 'SEC-05 · JOVIAN APEX',
    startSec: scaleSec(1200),
    endSec: scaleSec(1620), // canonical 27:00 → 00:54
    startProg: 1200 / 3600,
    endProg: 1620 / 3600,
    ambientColor: [30, 22, 16],
    ambientBrightness: 1.1,
    description: 'Colossal gas giant with rotating cloud belts and Great Red Spot',
  },
  {
    id: 'saturn',
    name: 'Chronos Rings & Titan Corridor',
    sectorCode: 'SEC-06 · RING SPHERE',
    startSec: scaleSec(1620),
    endSec: scaleSec(2040), // canonical 34:00 → 01:08
    startProg: 1620 / 3600,
    endProg: 2040 / 3600,
    ambientColor: [28, 26, 20],
    ambientBrightness: 1.05,
    description: 'Spectacular icy ring system with Cassini division and hazy Titan',
  },
  {
    id: 'uranus',
    name: 'Uranus Ice Giant Drift',
    sectorCode: 'SEC-07 · CYAN VOID',
    startSec: scaleSec(2040),
    endSec: scaleSec(2280), // canonical 38:00 → 01:16
    startProg: 2040 / 3600,
    endProg: 2280 / 3600,
    ambientColor: [10, 32, 38],
    ambientBrightness: 0.95,
    description: 'Aquamarine methane atmospheres tilted on planetary axis',
  },
  {
    id: 'neptune',
    name: 'Neptunian Deep Azure',
    sectorCode: 'SEC-08 · POSEIDON REACH',
    startSec: scaleSec(2280),
    endSec: scaleSec(2520), // canonical 42:00 → 01:24
    startProg: 2280 / 3600,
    endProg: 2520 / 3600,
    ambientColor: [8, 18, 48],
    ambientBrightness: 0.95,
    description: 'Ultramarine ice giant with dynamic supersonic high-altitude storms',
  },
  {
    id: 'deep_space_stars',
    name: 'Interstellar Stellar Nav Beacons',
    sectorCode: 'SEC-09 · STELLAR WAY',
    startSec: scaleSec(2520),
    endSec: scaleSec(2820), // canonical 47:00 → 01:34
    startProg: 2520 / 3600,
    endProg: 2820 / 3600,
    ambientColor: [12, 14, 28],
    ambientBrightness: 0.92,
    description: 'Cruising past iconic stellar waypoints: Sirius, Betelgeuse, Rigel',
  },
  {
    id: 'sun',
    name: 'Solar Perihelion Slingshot',
    sectorCode: 'SEC-10 · SOL SURGE',
    startSec: scaleSec(2820),
    endSec: scaleSec(3120), // canonical 52:00 → 01:44
    startProg: 2820 / 3600,
    endProg: 3120 / 3600,
    ambientColor: [55, 38, 16],
    ambientBrightness: 1.35,
    description: 'Blazing close pass around Sol with radiant corona and solar flares',
  },
  {
    id: 'nebula_asteroids',
    name: 'Carina Nebula & Asteroid Belt',
    sectorCode: 'SEC-11 · COSMIC REEF',
    startSec: scaleSec(3120),
    endSec: scaleSec(3360), // canonical 56:00 → 01:52
    startProg: 3120 / 3600,
    endProg: 3360 / 3600,
    ambientColor: [36, 14, 44],
    ambientBrightness: 1.15,
    description: 'Vibrant emission cloud gas pillars with tumbling rocky asteroids',
  },
  {
    id: 'galaxy',
    name: 'Deep Cosmos & Grand Spiral Galaxy',
    sectorCode: 'SEC-12 · GALAXY ABYSS',
    startSec: scaleSec(3360),
    endSec: scaleSec(3540), // canonical 59:00 → 01:58
    startProg: 3360 / 3600,
    endProg: 3540 / 3600,
    ambientColor: [16, 12, 32],
    ambientBrightness: 1.0,
    description: 'Observation of a luminous majestic spiral galaxy rotating in deep space',
  },
  {
    id: 'hyperspace',
    name: 'Warp Drive Fold & Cycle Jump',
    sectorCode: 'SEC-13 · FTL TRANSLATION',
    startSec: scaleSec(3540),
    endSec: scaleSec(3600), // canonical 60:00 → 02:00
    startProg: 3540 / 3600,
    endProg: 1.0,
    ambientColor: [24, 42, 68],
    ambientBrightness: 1.4,
    description: 'Hyperspace transition singularity, looping smoothly back to origin',
  },
];

export interface JourneyState {
  /** 0..1 normalized overall 2-minute progress */
  progress: number;
  /** Elapsed seconds within the current 2-minute cycle (0..120) */
  elapsed: number;
  /** Monotonic total elapsed seconds since engine start */
  totalElapsed: number;
  /** Which section of the voyage we are currently in */
  currentSection: JourneySectionDef;
  /** Next section transitioning into */
  nextSection: JourneySectionDef;
  /** 0..1 normalized progress within current section */
  sectionProgress: number;
  /** Number of full 2-minute cycles completed */
  loopCount: number;
  /** Dynamic blended ambient color tint [r, g, b] */
  ambientColor: [number, number, number];
  /** Ambient light intensity multiplier (warms near Sun, dims in deep space) */
  ambientBrightness: number;
  /** Cruising velocity string (e.g. "0.42c") */
  velocity: string;
  /** Formatted mission chronometer MM:SS */
  chronoString: string;
  /** Subtle camera banking and drift */
  camera: {
    swayX: number;
    swayY: number;
    bankAngle: number;
    forwardSpeed: number;
  };
  /** Hyperspace intensity 0..1 (only > 0 during hyperspace section) */
  hyperspaceIntensity: number;
}

export class JourneyTimeline {
  private manualProgress: number | null = null;

  constructor() {
    // Check URL search params for test override: ?journey=0.5 or ?t=0.5
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const jParam = params.get('journey') ?? params.get('t');
      if (jParam !== null) {
        const parsed = parseFloat(jParam);
        if (!isNaN(parsed)) {
          this.manualProgress = Math.max(0, Math.min(1, parsed));
        }
      }
    }
  }

  /** Allow dev scrubber to override progress (0..1) or pass null to resume live time */
  setManualProgress(p: number | null): void {
    if (p === null) {
      this.manualProgress = null;
    } else {
      this.manualProgress = Math.max(0, Math.min(0.999999, p));
    }
  }

  getManualProgress(): number | null {
    return this.manualProgress;
  }

  /** Compute the current journey state given monotonic time in seconds */
  getState(timeSec: number): JourneyState {
    let progress: number;
    let elapsed: number;
    let loopCount: number;

    if (this.manualProgress !== null) {
      progress = this.manualProgress;
      elapsed = progress * LOOP_SECONDS;
      loopCount = 0;
    } else {
      loopCount = Math.floor(timeSec / LOOP_SECONDS);
      elapsed = timeSec % LOOP_SECONDS;
      progress = elapsed / LOOP_SECONDS;
    }

    // Identify current section
    let currentIdx = 0;
    for (let i = 0; i < JOURNEY_SECTIONS.length; i++) {
      const s = JOURNEY_SECTIONS[i];
      if (elapsed >= s.startSec && elapsed < s.endSec) {
        currentIdx = i;
        break;
      }
    }
    // Edge case at 1.0 (or 120s)
    if (elapsed >= LOOP_SECONDS) {
      currentIdx = JOURNEY_SECTIONS.length - 1;
    }

    const currentSection = JOURNEY_SECTIONS[currentIdx];
    const nextSection = JOURNEY_SECTIONS[(currentIdx + 1) % JOURNEY_SECTIONS.length];

    const secDuration = currentSection.endSec - currentSection.startSec;
    const sectionProgress = Math.max(0, Math.min(1, (elapsed - currentSection.startSec) / secDuration));

    // Smooth ambient color blending between current and next section (last 20% of section blends into next)
    const blendThreshold = 0.8;
    let blendFactor = 0;
    if (sectionProgress > blendThreshold) {
      blendFactor = (sectionProgress - blendThreshold) / (1 - blendThreshold);
      // smoothstep blend
      blendFactor = blendFactor * blendFactor * (3 - 2 * blendFactor);
    }

    const c1 = currentSection.ambientColor;
    const c2 = nextSection.ambientColor;
    const ambientColor: [number, number, number] = [
      Math.round(c1[0] + (c2[0] - c1[0]) * blendFactor),
      Math.round(c1[1] + (c2[1] - c1[1]) * blendFactor),
      Math.round(c1[2] + (c2[2] - c1[2]) * blendFactor),
    ];

    const b1 = currentSection.ambientBrightness;
    const b2 = nextSection.ambientBrightness;
    const ambientBrightness = b1 + (b2 - b1) * blendFactor;

    // Chrono string MM:SS
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const chronoString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Cruising velocity varies slightly per section
    let velocity = '0.42c';
    if (currentSection.id === 'departure') velocity = '0.12c';
    else if (currentSection.id === 'sun') velocity = '0.68c';
    else if (currentSection.id === 'deep_space_stars' || currentSection.id === 'galaxy') velocity = '0.55c';
    else if (currentSection.id === 'hyperspace') {
      const warpFrac = Math.min(1, sectionProgress * 1.5);
      velocity = `${(1.0 + warpFrac * 98.4).toFixed(1)}c`;
    }

    // Subtle spaceship cruising sway: gentle Lissajous banking curve
    // Creates the sensation of riding inside a massive cruising starship.
    // The sway clock runs SWAY_RATE_SCALE× faster than raw loop time so a
    // 2-minute loop still contains several gentle oscillations instead of
    // one near-static arc.
    const swayT = elapsed * SWAY_RATE_SCALE;
    const swayX = Math.sin(swayT * 0.05) * 8 + Math.sin(swayT * 0.019) * 4;
    const swayY = Math.cos(swayT * 0.038) * 6 + Math.cos(swayT * 0.013) * 3;
    const bankAngle = Math.sin(swayT * 0.04) * 0.008; // very gentle radians banking

    // Forward starfield streaming speed
    let forwardSpeed = 1.0;
    let hyperspaceIntensity = 0;

    if (currentSection.id === 'hyperspace') {
      // 01:58 - 02:00 hyperspace ramp (final 2 s of the loop)
      // First half chargeup, then full warp tunnel, last 8% pulse & drop
      if (sectionProgress < 0.5) {
        hyperspaceIntensity = sectionProgress * 2 * 0.4; // 0..0.4
        forwardSpeed = 1.0 + sectionProgress * 6.0;
      } else if (sectionProgress < 0.92) {
        const warpPhase = (sectionProgress - 0.5) / 0.42;
        hyperspaceIntensity = 0.4 + warpPhase * 0.6; // 0.4..1.0
        forwardSpeed = 7.0 + warpPhase * 25.0;
      } else {
        // Flash singularity & transition
        const flashPhase = (sectionProgress - 0.92) / 0.08;
        hyperspaceIntensity = 1.0 - flashPhase * 0.8;
        forwardSpeed = 32.0 * (1 - flashPhase) + 1.0 * flashPhase;
      }
    }

    return {
      progress,
      elapsed,
      totalElapsed: timeSec,
      currentSection,
      nextSection,
      sectionProgress,
      loopCount,
      ambientColor,
      ambientBrightness,
      velocity,
      chronoString,
      camera: {
        swayX,
        swayY,
        bankAngle,
        forwardSpeed,
      },
      hyperspaceIntensity,
    };
  }
}
