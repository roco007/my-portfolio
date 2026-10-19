/* ═══════════════════════════════════════════════════════════════════════════
   Adaptive quality detection.
   Scales star/object counts and pixel-ratio caps so the environment stays
   smooth on mobile / weaker GPUs while remaining rich on capable desktops.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { QualityTier } from './types';

interface QualityProfile {
  tier: QualityTier;
  /** Pixel-ratio cap for canvas backing store. */
  maxDpr: number;
  /** Multiplier applied to star counts (0–1). */
  starScale: number;
  /** Multiplier applied to object counts (satellites, asteroids, etc.). */
  objectScale: number;
  /** Whether to render expensive glow / atmosphere passes. */
  fancy: boolean;
}

const PROFILES: Record<QualityTier, QualityProfile> = {
  high:   { tier: 'high',   maxDpr: 2,   starScale: 1.0,  objectScale: 1.0,  fancy: true  },
  medium: { tier: 'medium', maxDpr: 1.75, starScale: 0.6, objectScale: 0.65, fancy: true  },
  low:    { tier: 'low',    maxDpr: 1,   starScale: 0.32, objectScale: 0.35, fancy: false },
};

/**
 * Heuristic device-capability detection. Conservative by design — the
 * background is decorative, so we bias toward performance.
 */
export function detectQuality(): QualityProfile {
  if (typeof window === 'undefined') return PROFILES.high;

  const dpr = window.devicePixelRatio || 1;
  const cores = navigator.hardwareConcurrency || 4;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // Explicit downgrade paths.
  if (isMobileUA || (isCoarse && shortSide < 820)) {
    // Modern flagship phones still get "medium"; weak ones fall to "low".
    if (cores >= 6 && dpr >= 2 && shortSide >= 380) return PROFILES.medium;
    return PROFILES.low;
  }

  // Desktop / laptop heuristics.
  if (cores <= 2) return PROFILES.low;
  if (cores <= 4 || dpr > 2.5) return PROFILES.medium;
  return PROFILES.high;
}

export function getProfile(tier: QualityTier): QualityProfile {
  return PROFILES[tier];
}

/**
 * Clamp device pixel ratio against the tier cap. Keeps the backing store
 * small enough for 60 FPS while staying crisp on retina displays.
 */
export function cappedDpr(tier: QualityTier): number {
  const raw = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(raw, PROFILES[tier].maxDpr);
}
