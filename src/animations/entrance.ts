import { createTimeline, animate, stagger } from 'animejs';

interface HeroEntranceElements {
  badge?: HTMLElement | null;
  titleLines?: (HTMLElement | null)[];
  subtitle?: HTMLElement | null;
  actions?: HTMLElement | null;
  telemetry?: HTMLElement | null;
}

/**
 * Choreographs the initial hero page entrance using Anime.js 4.
 */
export function playHeroEntrance(
  elements: HeroEntranceElements,
  reducedMotion: boolean = false
) {
  if (reducedMotion) {
    // If reduced motion is requested, ensure everything is fully visible with no transitions
    Object.values(elements).forEach((el) => {
      if (Array.isArray(el)) {
        el.forEach((subEl) => {
          if (subEl) {
            subEl.style.opacity = '1';
            subEl.style.transform = 'none';
          }
        });
      } else if (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
    return null;
  }

  const tl = createTimeline({
    defaults: {
      ease: 'outExpo',
      duration: 800,
    },
  });

  // 1. Status telemetry badge entrance
  if (elements.badge) {
    tl.add(elements.badge, {
      opacity: [0, 1],
      translateY: [-15, 0],
      duration: 600,
    });
  }

  // 2. Headline lines staggered entrance
  const validLines = (elements.titleLines || []).filter(Boolean) as HTMLElement[];
  if (validLines.length > 0) {
    tl.add(
      validLines,
      {
        opacity: [0, 1],
        translateY: [35, 0],
        duration: 900,
        delay: stagger(120),
      },
      '-=400'
    );
  }

  // 3. Subtitle paragraph entrance
  if (elements.subtitle) {
    tl.add(
      elements.subtitle,
      {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
      },
      '-=500'
    );
  }

  // 4. CTA buttons stagger entrance
  if (elements.actions) {
    const actionBtns = elements.actions.querySelectorAll('button, a');
    if (actionBtns.length > 0) {
      tl.add(
        actionBtns,
        {
          opacity: [0, 1],
          translateY: [15, 0],
          scale: [0.96, 1],
          duration: 600,
          delay: stagger(100),
        },
        '-=450'
      );
    }
  }

  // 5. Telemetry HUD bar entrance
  if (elements.telemetry) {
    tl.add(
      elements.telemetry,
      {
        opacity: [0, 1],
        translateY: [25, 0],
        duration: 800,
      },
      '-=400'
    );
  }

  return tl;
}

/**
 * Text reveal animation utility.
 */
export function animateTextReveal(
  target: HTMLElement,
  options?: { delay?: number; duration?: number }
) {
  return animate(target, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: options?.duration ?? 700,
    delay: options?.delay ?? 0,
    ease: 'outCubic',
  });
}
