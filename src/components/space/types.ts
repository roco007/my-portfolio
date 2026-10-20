import type { JourneyState } from './JourneyTimeline';

/** Adaptive quality tier — drives particle/object counts & pixel-ratio caps. */
export type QualityTier = 'high' | 'medium' | 'low';

/** Current theme of the host application. */
export type SpaceTheme = 'dark' | 'light';

/**
 * Depth-weighted parallax vector for a single layer, already scaled by that
 * layer's parallax strength. `ox`/`oy` are pixel offsets applied to drawing.
 */
export interface ParallaxOffset {
  ox: number;
  oy: number;
}

/** Immutable-ish per-frame scene context passed to every layer's draw pass. */
export interface SceneState {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Monotonic time in seconds since the scene started. */
  time: number;
  /** Delta time in seconds since the previous frame (clamped). */
  dt: number;
  /** Raw scroll position (px) for scroll-coupled drift. */
  scrollY: number;
  /** Smoothed mouse offset, normalized to roughly [-1, 1] on each axis. */
  mouse: { x: number; y: number };
  theme: SpaceTheme;
  quality: QualityTier;
  /** Deterministic PRNG seeded per-mount so layouts are reproducible. */
  rand: () => number;
  /** Reduce visual intensity (used for light theme readability). */
  intensity: number;
  /** 60-minute deterministic space journey timeline state. */
  journey: JourneyState;
}

/**
 * A single environment layer. Layers are self-contained modules that build
 * their own internal state on init and render back-to-front each frame.
 */
export interface SpaceLayer {
  /** (Re)build internal state. Called on mount and on resize. */
  init(state: SceneState): void;
  /** Advance animation. Optional — static layers (e.g. starfield) omit it. */
  update?(state: SceneState): void;
  /** Render the layer. Always called, even under reduced motion. */
  draw(state: SceneState): void;
  /** Optional cleanup for offscreen canvases / timers. */
  dispose?(): void;
}
