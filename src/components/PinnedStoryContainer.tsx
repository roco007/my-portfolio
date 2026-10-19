import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowDown, Copy, Check, Terminal, Play, Mail, Github, Linkedin, Instagram, ExternalLink } from 'lucide-react';
import { PERSONAL_INFO, SOCIAL_LINKS, PROJECTS, SocialLink } from '../data/portfolio';
import { MorphingVisualizer } from './MorphingVisualizer';
import { OrbitalProjectsSolarSystem } from './OrbitalProjectsSolarSystem';
import { OrbitalSocialSolarSystem } from './OrbitalSocialSolarSystem';
import { Experience } from '../sections/Experience';
import { STORY_CHAPTERS, getNearestStoryChapter } from '../data/storyChapters';
import styles from './PinnedStoryContainer.module.css';

const isScrollable = (el: HTMLElement | null, deltaY: number): boolean => {
  let cur: HTMLElement | null = el;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    if (
      cur.getAttribute('role') === 'dialog' ||
      cur.getAttribute('aria-modal') === 'true' ||
      cur.getAttribute('data-inspector-modal') === 'true' ||
      cur.classList.contains('terminal')
    ) {
      return true;
    }
    const style = window.getComputedStyle(cur);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight + 4) {
      if (deltaY > 0 && cur.scrollTop + cur.clientHeight < cur.scrollHeight - 4) {
        return true;
      }
      if (deltaY < 0 && cur.scrollTop > 4) {
        return true;
      }
    }
    cur = cur.parentElement;
  }
  return false;
};

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case 'github':
      return <Github size={13} />;
    case 'linkedin':
      return <Linkedin size={13} />;
    case 'x':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.301-.15-1.782-.88-2.058-.98-.276-.101-.477-.15-.678.15-.2.302-.778.98-.954 1.181-.176.2-.351.226-.653.075-.301-.15-1.272-.469-2.424-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.527-.075-.15-.678-1.632-.929-2.236-.244-.588-.492-.508-.678-.518-.176-.009-.376-.011-.577-.011-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.512 0 1.482 1.079 2.914 1.23 3.115.15.2 2.123 3.242 5.143 4.547.718.311 1.279.497 1.716.636.721.23 1.377.197 1.896.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.125-.276-.2-.577-.35zM12.042 21.928c-1.787 0-3.535-.48-5.07-1.391l-.364-.216-3.768.988 1.006-3.673-.237-.377A9.88 9.88 0 012.16 12.04c0-5.46 4.44-9.9 9.897-9.9 2.645 0 5.131 1.03 6.999 2.902a9.85 9.85 0 012.898 6.998c0 5.462-4.442 9.902-9.912 9.902zm7.07-16.97A9.953 9.953 0 0012.042 2C6.505 2 2 6.506 2 12.042c0 1.77.462 3.498 1.338 5.018L2 22l5.097-1.337a9.99 9.99 0 004.945 1.289h.005c5.536 0 10.042-4.506 10.042-10.042 0-2.684-1.045-5.207-2.977-7.052z"/>
        </svg>
      );
    case 'instagram':
      return <Instagram size={13} />;
    case 'email':
      return <Mail size={13} />;
    default:
      return null;
  }
};

interface PinnedStoryContainerProps {
  onOpenTerminal: () => void;
  onReplayIntro: () => void;
  onProgressChange?: (progress: number, activeChapter: string) => void;
}

export const PinnedStoryContainer: React.FC<PinnedStoryContainerProps> = ({
  onOpenTerminal,
  onReplayIntro,
  onProgressChange,
}) => {
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const [smoothProgress, setSmoothProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const targetProgressRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const prevChapterRef = useRef<string>('HEADING');
  const storyContainerRef = useRef<HTMLDivElement | null>(null);
  const rightColumnRef = useRef<HTMLDivElement | null>(null);
  const [globeOffsetPx, setGlobeOffsetPx] = useState<number>(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 900) return 0;
    return 260;
  });

  useEffect(() => {
    const updateOffset = () => {
      if (!storyContainerRef.current || !rightColumnRef.current) return;
      const storyRect = storyContainerRef.current.getBoundingClientRect();
      const rightRect = rightColumnRef.current.getBoundingClientRect();
      const storyCenter = storyRect.left + storyRect.width / 2;
      const rightCenter = rightRect.left + rightRect.width / 2;
      const diff = Math.round(rightCenter - storyCenter);
      setGlobeOffsetPx(Math.abs(diff) < 5 ? 0 : diff);
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && storyContainerRef.current) {
      resizeObserver = new ResizeObserver(updateOffset);
      resizeObserver.observe(storyContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateOffset);
      resizeObserver?.disconnect();
    };
  }, []);

  // Rotary disc synchronized state driven by horizontal project cards scroll
  const [discRotationAngle, setDiscRotationAngle] = useState<number>(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState<number>(0);
  const [activeProjectTitle, setActiveProjectTitle] = useState<string>(
    PROJECTS[0]?.title || ''
  );

  const handleProjectRotate = useCallback(
    (angle: number, index: number, title: string) => {
      setDiscRotationAngle(angle);
      setActiveProjectIndex(index);
      setActiveProjectTitle(title);
    },
    []
  );

  // Active social channel synchronized state driven by vertical top-to-bottom orbital globe
  const socialChannels = SOCIAL_LINKS.filter((s) => s.platform !== 'email');
  const [activeSocialIndex, setActiveSocialIndex] = useState<number>(0);
  const activeSocialChannel = socialChannels[activeSocialIndex] || socialChannels[0];

  const handleSocialChannelSelect = useCallback((_channel: SocialLink, index: number) => {
    setActiveSocialIndex(index);
  }, []);


  // Section gating and momentum lock refs
  const targetChapterIndexRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const isLockedRef = useRef<boolean>(false);
  const isWheelActiveRef = useRef<boolean>(false);
  const wheelEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWheelDeltaRef = useRef<number>(0);
  const lastWheelDirectionRef = useRef<number>(0);
  const accumulatedDeltaRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchConsumedRef = useRef<boolean>(false);
  const touchInScrollableRef = useRef<boolean>(false);
  const expectedScrollYRef = useRef<number>(0);

  const goToChapterIndex = useCallback((index: number) => {
    const clampedIndex = Math.min(Math.max(index, 0), STORY_CHAPTERS.length - 1);
    targetChapterIndexRef.current = clampedIndex;

    const scrollEl = document.scrollingElement || document.documentElement || document.body;
    const maxScroll = Math.max(0, scrollEl.scrollHeight - window.innerHeight);
    const targetY = STORY_CHAPTERS[clampedIndex].target * maxScroll;
    const startY = window.scrollY || window.pageYOffset || 0;
    const distance = targetY - startY;

    if (Math.abs(distance) < 2) {
      isAnimatingRef.current = false;
      return;
    }

    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }

    isAnimatingRef.current = true;
    isLockedRef.current = true;

    const startTime = performance.now();
    const duration = 720;
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const prevScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      const currentY = startY + distance * eased;
      expectedScrollYRef.current = currentY;
      window.scrollTo(0, currentY);

      if (progress < 1) {
        autoScrollRafRef.current = requestAnimationFrame(animate);
      } else {
        expectedScrollYRef.current = targetY;
        window.scrollTo(0, targetY);
        autoScrollRafRef.current = null;
        document.documentElement.style.scrollBehavior = prevScrollBehavior;
        isAnimatingRef.current = false;

        // Release lock only after gesture momentum has subsided
        if (!isWheelActiveRef.current) {
          isLockedRef.current = false;
          accumulatedDeltaRef.current = 0;
        }
      }
    };

    autoScrollRafRef.current = requestAnimationFrame(animate);
  }, []);

  // Unified Section-by-Section Scroll Gating & Lerp Engine
  useEffect(() => {
    const getScrollProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrollEl = document.scrollingElement || document.documentElement || document.body;
      const maxScroll = Math.max(1, scrollEl.scrollHeight - window.innerHeight);
      return Math.min(Math.max(scrollY / maxScroll, 0), 1);
    };

    // Initialize current chapter index based on starting position
    const initialProgress = getScrollProgress();
    const initialChapter = getNearestStoryChapter(initialProgress);
    const initialIndex = STORY_CHAPTERS.findIndex((c) => c.id === initialChapter.id);
    if (initialIndex >= 0) {
      targetChapterIndexRef.current = initialIndex;
    }

    const handleScroll = () => {
      const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      targetProgressRef.current = getScrollProgress();

      // If user clicked navbar or scrubber during animation, yield cleanly
      if (isAnimatingRef.current && Math.abs(currentY - expectedScrollYRef.current) > 35) {
        if (autoScrollRafRef.current) {
          cancelAnimationFrame(autoScrollRafRef.current);
          autoScrollRafRef.current = null;
        }
        isAnimatingRef.current = false;
        document.documentElement.style.scrollBehavior = '';
      }

      if (!isAnimatingRef.current) {
        const chapter = getNearestStoryChapter(targetProgressRef.current);
        const idx = STORY_CHAPTERS.findIndex((c) => c.id === chapter.id);
        if (idx >= 0) {
          targetChapterIndexRef.current = idx;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Wheel event interceptor: strictly moves only to next or previous section
    const handleWheel = (e: WheelEvent) => {
      // If any project inspector modal or dialog is open, NEVER navigate story sections!
      const isInspectorModalOpen =
        !!document.querySelector('[data-inspector-modal="true"]') ||
        !!(e.target as HTMLElement)?.closest?.('[data-inspector-modal="true"], [role="dialog"]');

      if (isInspectorModalOpen || isScrollable(e.target as HTMLElement, e.deltaY)) {
        return;
      }

      // Intercept wheel so native multi-section flinging never occurs
      e.preventDefault();

      const deltaY = e.deltaY;
      const absDelta = Math.abs(deltaY);

      // Track active gesture and set 220ms debounce silence timer
      isWheelActiveRef.current = true;
      if (wheelEndTimerRef.current) clearTimeout(wheelEndTimerRef.current);
      wheelEndTimerRef.current = setTimeout(() => {
        isWheelActiveRef.current = false;
        accumulatedDeltaRef.current = 0;
        lastWheelDeltaRef.current = 0;
        if (!isAnimatingRef.current) {
          isLockedRef.current = false;
        }
      }, 220);

      // If locked, check if intentional unlock conditions are met:
      if (isLockedRef.current) {
        if (!isAnimatingRef.current) {
          const prevDir = lastWheelDirectionRef.current;
          const currentDir = deltaY > 0 ? 1 : -1;

          // Reversal: user intentionally scrolled the opposite direction after settling
          const isReversal = prevDir !== 0 && currentDir !== prevDir && absDelta > 20;

          // Sharp second flick: new acceleration spike over decaying inertia
          const isSharpSecondFlick =
            currentDir === prevDir && absDelta > 60 && absDelta > lastWheelDeltaRef.current * 2.5;

          if (isReversal || isSharpSecondFlick) {
            isLockedRef.current = false;
            accumulatedDeltaRef.current = 0;
          }
        }

        if (isLockedRef.current) {
          lastWheelDeltaRef.current = absDelta;
          return;
        }
      }

      accumulatedDeltaRef.current += deltaY;
      lastWheelDeltaRef.current = absDelta;

      const ACCUMULATION_THRESHOLD = 20;

      if (Math.abs(accumulatedDeltaRef.current) >= ACCUMULATION_THRESHOLD) {
        const direction = accumulatedDeltaRef.current > 0 ? 1 : -1;
        lastWheelDirectionRef.current = direction;
        accumulatedDeltaRef.current = 0;

        const currentIndex = targetChapterIndexRef.current;
        const nextIndex = Math.min(Math.max(currentIndex + direction, 0), STORY_CHAPTERS.length - 1);

        if (nextIndex !== currentIndex) {
          goToChapterIndex(nextIndex);
        } else {
          // At page boundaries
          isLockedRef.current = true;
          setTimeout(() => {
            if (!isWheelActiveRef.current) {
              isLockedRef.current = false;
            }
          }, 250);
        }
      }
    };

    // Mobile touch gating
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (
        document.querySelector('[data-inspector-modal="true"]') ||
        (e.target as HTMLElement)?.closest?.('[data-inspector-modal="true"], [role="dialog"]')
      ) {
        return;
      }
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
      touchConsumedRef.current = false;
      touchInScrollableRef.current = isScrollable(e.target as HTMLElement, 0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (
        document.querySelector('[data-inspector-modal="true"]') ||
        (e.target as HTMLElement)?.closest?.('[data-inspector-modal="true"], [role="dialog"]')
      ) {
        return;
      }
      if (touchConsumedRef.current) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      const curY = e.touches[0].clientY;
      const curX = e.touches[0].clientX;
      const diffY = curY - touchStartYRef.current;
      const diffX = curX - touchStartXRef.current;

      if (touchInScrollableRef.current && isScrollable(e.target as HTMLElement, -diffY)) {
        return;
      }

      if (Math.abs(diffY) > Math.abs(diffX) * 1.2) {
        if (e.cancelable) e.preventDefault();

        const SWIPE_THRESHOLD = 45;
        if (Math.abs(diffY) > SWIPE_THRESHOLD) {
          touchConsumedRef.current = true;
          const direction = diffY < 0 ? 1 : -1; // swipe up = next (+1), swipe down = prev (-1)

          if (!isLockedRef.current) {
            const currentIndex = targetChapterIndexRef.current;
            const nextIndex = Math.min(Math.max(currentIndex + direction, 0), STORY_CHAPTERS.length - 1);
            if (nextIndex !== currentIndex) {
              goToChapterIndex(nextIndex);
            }
          }
        }
      }
    };

    const handleTouchEnd = () => {
      touchConsumedRef.current = false;
      touchInScrollableRef.current = false;
    };

    // Keyboard gating
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        document.querySelector('[data-inspector-modal="true"]') ||
        (activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.getAttribute('contenteditable') === 'true' ||
            activeEl.closest?.('[role="dialog"], [data-inspector-modal="true"]')))
      ) {
        return;
      }

      if (e.code === 'ArrowDown' || e.code === 'PageDown' || (e.code === 'Space' && !e.shiftKey)) {
        e.preventDefault();
        if (!isLockedRef.current) {
          const nextIndex = Math.min(targetChapterIndexRef.current + 1, STORY_CHAPTERS.length - 1);
          if (nextIndex !== targetChapterIndexRef.current) {
            goToChapterIndex(nextIndex);
          }
        }
      } else if (e.code === 'ArrowUp' || e.code === 'PageUp' || (e.code === 'Space' && e.shiftKey)) {
        e.preventDefault();
        if (!isLockedRef.current) {
          const nextIndex = Math.max(targetChapterIndexRef.current - 1, 0);
          if (nextIndex !== targetChapterIndexRef.current) {
            goToChapterIndex(nextIndex);
          }
        }
      } else if (e.code === 'Home') {
        e.preventDefault();
        if (!isLockedRef.current) {
          goToChapterIndex(0);
        }
      } else if (e.code === 'End') {
        e.preventDefault();
        if (!isLockedRef.current) {
          goToChapterIndex(STORY_CHAPTERS.length - 1);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    // Lerp loop for buttery, immediate 120fps motion
    let current = targetProgressRef.current;
    const updateProgress = () => {
      const target = getScrollProgress();
      targetProgressRef.current = target;
      current += (target - current) * 0.55;

      if (Math.abs(target - current) < 0.0006) {
        current = target;
      }

      setSmoothProgress(current);

      const chapter = getNearestStoryChapter(current).label;
      if (prevChapterRef.current !== chapter) {
        prevChapterRef.current = chapter;
        onProgressChange?.(current, chapter);
      }

      rafIdRef.current = requestAnimationFrame(updateProgress);
    };

    rafIdRef.current = requestAnimationFrame(updateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
      if (wheelEndTimerRef.current) clearTimeout(wheelEndTimerRef.current);
    };
  }, [goToChapterIndex, onProgressChange]);

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText('npx roco007');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // --------------------------------------------------------------------------
  // Clean, Non-Ghosting Chapter Transitions
  // Each chapter has a dedicated zone with directional translateY entrance/exit
  // --------------------------------------------------------------------------
  const p = smoothProgress;

  // Chapter 0: [0.00, 0.20]
  const op0 = p <= 0.16 ? 1 : p <= 0.20 ? Math.max(0, 1 - (p - 0.16) / 0.04) : 0;
  const ty0 = p <= 0.16 ? 0 : -((p - 0.16) / 0.04) * 35;

  // Chapter 1: [0.20, 0.42]
  const op1 = p < 0.20 || p > 0.42 ? 0 : p < 0.24 ? (p - 0.20) / 0.04 : p > 0.38 ? (0.42 - p) / 0.04 : 1;
  const ty1 = p < 0.24 ? (1 - (p - 0.20) / 0.04) * 35 : p > 0.38 ? -((p - 0.38) / 0.04) * 35 : 0;

  const clampUnit = (value: number) => Math.min(1, Math.max(0, value));
  const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
  const easeInOutCubic = (value: number) => (
    value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
  );

  // Chapter 2: [0.42, 0.66] (TOOLBOX)
  const skillsExit = easeInOutCubic(clampUnit((0.66 - p) / 0.10));
  const op2 = p < 0.42 || p > 0.66 ? 0 : p < 0.46 ? (p - 0.42) / 0.04 : p > 0.56 ? skillsExit : 1;
  const ty2 = p < 0.46 ? (1 - (p - 0.42) / 0.04) * 35 : p > 0.56 ? -(1 - skillsExit) * 35 : 0;

  // Chapter 3: SYSTEMS. Project chrome gives the hand-off globe room to
  // establish itself before the cards clear, avoiding a blank transition beat.
  const projectsEntry = easeOutCubic(clampUnit((p - 0.64) / 0.08));
  const projectsExit = easeInOutCubic(clampUnit((0.78 - p) / 0.04));
  const op3 = p < 0.64 || p > 0.78 ? 0 : Math.min(projectsEntry, projectsExit);
  const ty3 = p < 0.72
    ? (1 - projectsEntry) * 35
    : p > 0.74 ? -(1 - projectsExit) * 35
    : 0;

  // Physical genesis & 3D unfurling progression for the Orbital Projects Solar System
  // Begins at p = 0.58 as cylinder rings start contracting together, fully blooming by 0.72
  const projectsEntryProgress = clampUnit((p - 0.58) / 0.14);

  // Chapter 4: EXPERIENCE. Cross-fades seamlessly with Projects exit and
  // Contact entrance. No blank delay zones.
  const experienceEntry = easeOutCubic(clampUnit((p - 0.76) / 0.05));
  const experienceExit = easeInOutCubic(clampUnit((0.92 - p) / 0.03));
  const op4 = p < 0.76 || p > 0.92 ? 0 : Math.min(experienceEntry, experienceExit);

  // Chapter 5: CONTACT. Starts entering at 0.92 as Experience clears.
  const contactEntry = easeOutCubic(clampUnit((p - 0.92) / 0.04));
  const op5 = p < 0.92 ? 0 : contactEntry;
  const ty5 = (1 - op5) * 20;

  // The Experience globe is the transition globe. Reusing that exact canvas
  // avoids the double-sphere artifact that occurs when two globe renderers
  // are cross-faded over each other.
  const projectToExperienceProgress = clampUnit((p - 0.74) / 0.08);
  const experienceToContactProgress = clampUnit((p - 0.89) / 0.065);
  const experienceHandoff = p >= 0.74 && p < 0.82
    ? 'from-project'
    : p >= 0.89 && p < 0.955
      ? 'to-contact'
      : undefined;
  const experienceHandoffProgress = experienceHandoff === 'from-project'
    ? projectToExperienceProgress
    : experienceToContactProgress;
  const experienceHandoffOpacity = experienceHandoff === 'to-contact'
    ? 1 - easeInOutCubic(clampUnit((p - 0.945) / 0.015))
    : 1;
  const experienceLandmassOpacity = experienceHandoff === 'from-project'
    ? easeOutCubic(clampUnit((p - 0.75) / 0.06))
    : experienceHandoff === 'to-contact'
      ? 1 - easeInOutCubic(clampUnit((p - 0.90) / 0.045))
      : 1;
  const experienceIsRevealed = p >= 0.79 && p < 0.90;
  const experienceHandoffEntry = easeOutCubic(clampUnit((p - 0.74) / 0.016));
  const experienceLayerOpacity = p >= 0.74 && p < 0.96
    ? experienceHandoffEntry
    : op4;
  const contactIsRevealed = p >= 0.94;

  // The chapter-specific globes yield to Experience's travelling canvas at
  // either end of its hand-off. Keeping these fades tight makes the source
  // and destination feel continuous without ever exposing two full spheres.
  const projectGlobeOpacity = p < 0.74
    ? 1
    : 1 - easeOutCubic(clampUnit((p - 0.74) / 0.016));
  const projectChromeOpacity = p < 0.74 ? 1 : projectsExit;
  const projectLayerOpacity =
    p < 0.58
      ? 0
      : p < 0.74
        ? easeOutCubic(clampUnit((p - 0.58) / 0.10))
        : p < 0.78
          ? 1
          : op3;
  const contactGlobeOpacity = p < 0.945
    ? 0
    : easeInOutCubic(clampUnit((p - 0.945) / 0.015));
  const contactLayerOpacity = p >= 0.945 ? 1 : 0;

  // Visualizer transitions seamlessly into Projects orbital solar system.
  // Between 0.54 and 0.68, the exploded cylinder layers collapse into a tight glowing core.
  // The visualizer fades out as the collapsing core hands off to the newborn globe between 0.60 and 0.68.
  const visualizerOpacity =
    p <= 0.60
      ? 1
      : p < 0.68
        ? 1 - easeInOutCubic((p - 0.60) / 0.08)
        : 0;

  return (
    <div ref={scrollTrackRef} className={styles.scrollTrack} id="story-track">
      <div className={styles.stickyViewport}>
        <div ref={storyContainerRef} className={styles.storyContainer}>
          {/* Left Column: Cross-Fading Chapter Content */}
          <div className={styles.leftColumn}>
            {/* -----------------------------------------------------------
                CHAPTER 0: HEADING // Core Systems Architect
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              aria-hidden={op0 <= 0.4}
              inert={op0 <= 0.4 || undefined}
              style={{
                opacity: op0,
                pointerEvents: op0 > 0.1 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty0.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={styles.statusDot} />
                  v2.0 // FULL-STACK ENGINEER &amp; AI ARCHITECT
                </span>
              </div>

              <h1 className={styles.headline}>
                Architecting
                <br />
                intelligent{' '}
                <span className={styles.headlineLineHighlight}>systems.</span>
              </h1>

              <p className={styles.subtitle}>
                {PERSONAL_INFO.role} based in {PERSONAL_INFO.location}. Building
                production-grade multi-agent evaluation frameworks, privacy-first developer
                suites, and high-performance interactive web experiences.
              </p>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.copyCommandBtn}
                  onClick={handleCopyCommand}
                  title="Copy developer command to clipboard"
                  aria-label="Copy npx roco007 CLI command"
                >
                  <span className={styles.commandPrompt}>$</span>
                  <span>npx roco007</span>
                  {copied ? (
                    <span style={{ color: '#00ffaa', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                      <Check size={13} /> COPIED
                    </span>
                  ) : (
                    <Copy size={13} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => goToChapterIndex(1)}
                  className={styles.exploreBtn}
                >
                  <span>EXPLORE ENGINE</span>
                  <ArrowDown size={14} />
                </button>

                <button
                  type="button"
                  className={styles.terminalBtn}
                  onClick={onOpenTerminal}
                  title="Launch Developer CLI (Ctrl + `)"
                >
                  <Terminal size={14} />
                  <span>CLI &gt;_</span>
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 1: ARCHITECTURE // 3D Extrusion
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              aria-hidden={op1 <= 0.4}
              inert={op1 <= 0.4 || undefined}
              style={{
                opacity: op1,
                pointerEvents: op1 > 0.1 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty1.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={`${styles.statusDot} ${styles.statusDotGreen}`} />
                  <span>01 // THE CORE ENGINE</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>The Core AI &amp;</span>
                <br />
                <span className={styles.headlineLineHighlight}>Edge Engine.</span>
              </h2>

              <p className={styles.subtitle}>
                Engineered for sub-millisecond execution, event-driven streaming, and
                distributed edge computing. Powered by Cloudflare Workers, Durable Objects,
                and low-latency vector embeddings.
              </p>

              <div className={styles.metricRow}>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>12,400+</span>
                  <span className={styles.metricKey}>Ops / Sec</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>&lt; 15ms</span>
                  <span className={styles.metricKey}>p99 Edge Latency</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>300+</span>
                  <span className={styles.metricKey}>Global Edge Nodes</span>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => goToChapterIndex(2)}
                  className={styles.exploreBtn}
                >
                  <span>VIEW TOOLBOX</span>
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 2: TOOLBOX // Exploded Assembly
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              aria-hidden={op2 <= 0.4}
              inert={op2 <= 0.4 || undefined}
              style={{
                opacity: op2,
                pointerEvents: op2 > 0.1 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty2.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={`${styles.statusDot} ${styles.statusDotCyan}`} />
                  <span>02 // THE COMPLETE TOOLBOX</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>The complete</span>
                <br />
                <span className={styles.headlineLineHighlight}>engineering toolbox.</span>
              </h2>

              <p className={styles.subtitle}>
                Break free from monolithic constraints and animate the future of autonomous
                software. High-precision AST compiler logic, typed micro-architectures, and
                distributed agent swarms.
              </p>

              <div className={styles.capabilityGrid}>
                {[
                  'Multi-Agent Orchestration',
                  'Cloudflare Workers & DO',
                  'AST Syntax Analysis',
                  'TypeScript & React 19',
                  'Vector RAG Embeddings',
                  'Sub-Millisecond WebGL',
                ].map((cap) => (
                  <div key={cap} className={styles.capabilityPill}>
                    <span className={styles.pillDot} />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => goToChapterIndex(3)}
                  className={styles.exploreBtn}
                >
                  <span>SEE PRODUCTION SYSTEMS</span>
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 3: SYSTEMS // Planetary Orbit & Core Engine
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              aria-hidden={op3 <= 0.4}
              inert={op3 <= 0.4 || undefined}
              style={{
                opacity: op3,
                pointerEvents: op3 > 0.1 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty3.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={styles.statusDot} />
                  <span>03 // PLANETARY ORBIT // {activeProjectTitle.toUpperCase()}</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>Deployed systems</span>
                <br />
                <span className={styles.headlineLineHighlight}>that scale.</span>
              </h2>

              <p className={styles.subtitle}>
                14 battle-tested production units revolving around the central AI engine like planets around the sun. Scroll horizontally or drag to orbit through systems and inspect live architectures.
              </p>

              <div className={`${styles.metricRow} ${styles.desktopOnlyMetricRow}`}>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>UNIT {String(activeProjectIndex + 1).padStart(2, '0')}</span>
                  <span className={styles.metricKey}>Active Focus</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>{Math.round(((discRotationAngle % 360) + 360) % 360)}&deg;</span>
                  <span className={styles.metricKey}>Core Angle</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>14</span>
                  <span className={styles.metricKey}>Total Planets</span>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => goToChapterIndex(4)}
                  className={styles.exploreBtn}
                >
                  <span>EXPLORE TIMELINE</span>
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className={styles.terminalBtn}
                  onClick={onOpenTerminal}
                >
                  <Terminal size={14} />
                  <span>VIEW SYS LOGS</span>
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 4: TIMELINE // Professional Experience
                ----------------------------------------------------------- */}
            {/* -----------------------------------------------------------
                CHAPTER 5: UPLINK // Motion Lab & Direct Channel
                ----------------------------------------------------------- */}
            <div
              className={`${styles.chapterPanel} ${styles.chapter4Panel} ${contactIsRevealed ? styles.contactContentRevealed : ''}`}
              aria-hidden={op5 <= 0.4}
              inert={op5 <= 0.4 || undefined}
              style={{
                opacity: op5,
                pointerEvents: op5 > 0.1 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty5.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={`${styles.statusDot} ${styles.statusDotGreen}`} />
                  <span>04 // DIRECT CHANNEL</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>Initiate an</span>
                <br />
                <span className={styles.headlineLineHighlight}>uplink.</span>
              </h2>

              <p className={styles.subtitle}>
                Available for staff/lead engineering roles, autonomous AI systems
                architecture, and high-impact distributed web software.
              </p>

              <div className={styles.actionsRow}>
                <a
                  href={`mailto:${PERSONAL_INFO.email}`}
                  className={styles.exploreBtn}
                  title={`Send email directly to ${PERSONAL_INFO.email}`}
                >
                  <Mail size={14} />
                  <span>SEND TRANSMISSION</span>
                </a>

                <button
                  type="button"
                  onClick={onReplayIntro}
                  className={styles.replayIntroBtn}
                  title="Replay the welcome intro animation"
                >
                  <Play size={12} />
                  <span>REPLAY INTRO</span>
                </button>
              </div>

              {/* Active Polar Satellite Uplink Card */}
              <div className={styles.activeSatelliteCard}>
                <div className={styles.activeSatelliteHeader}>
                  <div className={styles.activeSatelliteHeaderLeft}>
                    <span className={`${styles.statusDot} ${styles.statusDotCyan}`} />
                    <span className={styles.activeSatelliteTitle}>ACTIVE POLAR SATELLITE</span>
                  </div>
                  <span className={styles.activeSatelliteCount}>
                    [0{activeSocialIndex + 1} / 0{socialChannels.length}]
                  </span>
                </div>

                <div className={styles.activeSatelliteBody}>
                  <div className={styles.activeSatelliteIconWrapper}>
                    {getSocialIcon(activeSocialChannel.platform)}
                  </div>
                  <div className={styles.activeSatelliteInfo}>
                    <div className={styles.activeSatelliteNameRow}>
                      <span className={styles.activeSatelliteName}>{activeSocialChannel.name}</span>
                      <span className={styles.activeSatelliteLiveBadge}>POLAR.ORBIT</span>
                    </div>
                    <span className={styles.activeSatelliteHandle}>{activeSocialChannel.handle}</span>
                  </div>
                  <a
                    href={activeSocialChannel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.activeSatelliteLaunchBtn}
                    title={`Launch ${activeSocialChannel.name} (${activeSocialChannel.handle})`}
                  >
                    <span>LAUNCH</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div className={styles.colophonLine}>
                <span>&copy; {new Date().getFullYear()} Raj Colaco</span>
                <span className={styles.colophonDivider}>//</span>
                <span>ENGINEERED WITH REACT 19 &amp; ANIME.JS v4</span>
                <span className={styles.colophonDivider}>//</span>
                <span className={styles.colophonStatus}>SYS.ONLINE</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Transforming Visualizer, Chapter 3 Projects Deck & Chapter 4 Social Solar System */}
          <div ref={rightColumnRef} className={styles.rightColumn}>
            <div
              className={styles.visualizerLayer}
              aria-hidden={visualizerOpacity <= 0.01}
              inert={visualizerOpacity <= 0.01 || undefined}
              style={{
                opacity: visualizerOpacity,
                pointerEvents: visualizerOpacity > 0.1 ? 'auto' : 'none',
              }}
            >
              <MorphingVisualizer
                progress={smoothProgress}
                onOpenTerminal={onOpenTerminal}
              />
            </div>

            <div
              className={styles.horizontalDeckLayer}
              aria-hidden={op3 <= 0.4}
              inert={op3 <= 0.4 || undefined}
              style={{
                opacity: projectLayerOpacity,
                pointerEvents: op3 > 0.4 ? 'auto' : 'none',
                display: projectLayerOpacity > 0.01 ? 'block' : 'none',
                zIndex: op3 > 0.4 ? 12 : 5,
                transform: 'translateY(0)',
              }}
            >
              <OrbitalProjectsSolarSystem
                onRotate={handleProjectRotate}
                isActive={projectLayerOpacity > 0.02}
                globeOpacity={projectGlobeOpacity}
                chromeOpacity={projectChromeOpacity}
                entryProgress={projectsEntryProgress}
              />
            </div>

            <div
              className={styles.socialDeckLayer}
              aria-hidden={op5 <= 0.4}
              inert={op5 <= 0.4 || undefined}
              style={{
                opacity: contactLayerOpacity,
                pointerEvents: op5 > 0.4 ? 'auto' : 'none',
                display: contactLayerOpacity > 0.02 ? 'flex' : 'none',
                zIndex: op5 > 0.4 ? 15 : 4,
                transform: 'translateY(0)',
              }}
            >
              <OrbitalSocialSolarSystem
                onChannelSelect={handleSocialChannelSelect}
                isActive={op5 > 0.3}
                globeOpacity={contactGlobeOpacity}
                chromeOpacity={op5}
              />
            </div>
          </div>

          <div
            className={styles.experienceLayer}
            style={{
              opacity: experienceLayerOpacity,
              pointerEvents: op4 > 0.8 ? 'auto' : 'none',
              transform: 'translateY(0)',
            }}
          >
            <Experience
              isActive={op4 > 0.35}
              isRevealed={experienceIsRevealed}
              globeHandoff={experienceHandoff}
              globeHandoffProgress={experienceHandoffProgress}
              globeHandoffOpacity={experienceHandoffOpacity}
              landmassOpacity={experienceLandmassOpacity}
              globeHandoffOffsetPx={globeOffsetPx}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
