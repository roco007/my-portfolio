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
 * a futuristic 3D holographic decode & laser scan reveal using Anime.js 4.
 */
export function setupScrollReveal(
  target: HTMLElement | null,
  options: ScrollRevealOptions = {}
): () => void {
  if (!target) return () => {};

  const {
    threshold = 0.12,
    rootMargin = '0px 0px -40px 0px',
    delay = 0,
    staggerDelay = 90,
    translateY = 40,
    duration = 850,
    reducedMotion = false,
  } = options;

  if (reducedMotion) {
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

  // Set initial futuristic hidden state: 3D tilted backward with subtle blur
  itemsToAnimate.forEach((item) => {
    item.style.opacity = '0';
    item.style.transform = `perspective(1000px) rotateX(10deg) translateY(${translateY}px) scale(0.96)`;
    item.style.filter = 'blur(4px)';
    item.style.transition = 'filter 0.5s ease-out';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(itemsToAnimate, {
            opacity: [0, 1],
            translateY: [translateY, 0],
            rotateX: [10, 0],
            scale: [0.96, 1],
            duration,
            delay: itemsToAnimate.length > 1 ? stagger(staggerDelay, { start: delay }) : delay,
            ease: 'outExpo',
            onComplete: () => {
              itemsToAnimate.forEach((item) => {
                item.style.filter = 'none';
                item.classList.add('futuristic-scan-revealed');
              });
            },
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
