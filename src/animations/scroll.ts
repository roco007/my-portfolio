import { animate, stagger } from 'animejs';

export interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  staggerDelay?: number;
  translateY?: number;
  duration?: number;
  reducedMotion?: boolean;
}

/**
 * Attaches an IntersectionObserver to an element or container to trigger
 * a graceful staggered reveal using Anime.js 4.
 */
export function setupScrollReveal(
  target: HTMLElement | null,
  options: ScrollRevealOptions = {}
): () => void {
  if (!target) return () => {};

  const {
    threshold = 0.15,
    rootMargin = '0px 0px -50px 0px',
    delay = 0,
    staggerDelay = 80,
    translateY = 30,
    duration = 750,
    reducedMotion = false,
  } = options;

  if (reducedMotion) {
    // Immediate visibility
    target.style.opacity = '1';
    target.style.transform = 'none';
    const children = target.querySelectorAll<HTMLElement>('[data-reveal]');
    children.forEach((c) => {
      c.style.opacity = '1';
      c.style.transform = 'none';
    });
    return () => {};
  }

  // Find children marked with data-reveal, or animate the container itself
  const revealItems = target.querySelectorAll<HTMLElement>('[data-reveal]');
  const itemsToAnimate: HTMLElement[] =
    revealItems.length > 0 ? Array.from(revealItems) : [target];

  // Set initial hidden state cleanly
  itemsToAnimate.forEach((item) => {
    item.style.opacity = '0';
    item.style.transform = `translateY(${translateY}px)`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(itemsToAnimate, {
            opacity: [0, 1],
            translateY: [translateY, 0],
            duration,
            delay: itemsToAnimate.length > 1 ? stagger(staggerDelay, { start: delay }) : delay,
            ease: 'outExpo',
          });

          // Unobserve once revealed to conserve performance and prevent repeated jarring
          observer.unobserve(target);
        }
      });
    },
    { threshold, rootMargin }
  );

  observer.observe(target);

  return () => {
    observer.disconnect();
  };
}
