import { animate } from 'animejs';

/**
 * 3D card tilt & dynamic glare effect.
 * Attaches pointer movement listener with requestAnimationFrame smoothing.
 */
export function setupCardTilt(cardEl: HTMLElement | null, reducedMotion: boolean = false) {
  if (!cardEl || reducedMotion) return () => {};

  let rafId: number | null = null;
  let targetRotateX = 0;
  let targetRotateY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;

  const handlePointerMove = (e: PointerEvent) => {
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 8 degrees tilt for refined, non-distracting elevation
    targetRotateX = ((y - centerY) / centerY) * -7;
    targetRotateY = ((x - centerX) / centerX) * 7;

    cardEl.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    cardEl.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);

    if (!rafId) {
      rafId = requestAnimationFrame(updateTilt);
    }
  };

  const updateTilt = () => {
    currentRotateX += (targetRotateX - currentRotateX) * 0.12;
    currentRotateY += (targetRotateY - currentRotateY) * 0.12;

    cardEl.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) translateZ(4px)`;

    if (
      Math.abs(targetRotateX - currentRotateX) > 0.05 ||
      Math.abs(targetRotateY - currentRotateY) > 0.05
    ) {
      rafId = requestAnimationFrame(updateTilt);
    } else {
      rafId = null;
    }
  };

  const handlePointerLeave = () => {
    targetRotateX = 0;
    targetRotateY = 0;
    animate(cardEl, {
      rotateX: 0,
      rotateY: 0,
      translateZ: 0,
      duration: 500,
      ease: 'outExpo',
    });
  };

  cardEl.addEventListener('pointermove', handlePointerMove);
  cardEl.addEventListener('pointerleave', handlePointerLeave);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    cardEl.removeEventListener('pointermove', handlePointerMove);
    cardEl.removeEventListener('pointerleave', handlePointerLeave);
  };
}

/**
 * Cyber Scramble Text Decryption Effect.
 * Scrambles characters rapidly with matrix glyphs before resolving to original text.
 */
export function scrambleText(
  element: HTMLElement | null,
  originalText: string,
  duration: number = 700
) {
  if (!element) return;
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  const startTime = performance.now();
  let frameId: number;

  const update = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const resolvedIndex = Math.floor(progress * originalText.length);

    let output = '';
    for (let i = 0; i < originalText.length; i++) {
      if (i < resolvedIndex) {
        output += originalText[i];
      } else if (originalText[i] === ' ') {
        output += ' ';
      } else {
        output += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    element.textContent = output;

    if (progress < 1) {
      frameId = requestAnimationFrame(update);
    } else {
      element.textContent = originalText;
    }
  };

  frameId = requestAnimationFrame(update);
  return () => cancelAnimationFrame(frameId);
}

/**
 * Animate project filter transition.
 */
export function animateFilterTransition(container: HTMLElement | null) {
  if (!container) return;
  const cards = container.querySelectorAll<HTMLElement>('.project-card');
  animate(cards, {
    opacity: [0, 1],
    scale: [0.97, 1],
    translateY: [15, 0],
    duration: 400,
    ease: 'outCubic',
  });
}
