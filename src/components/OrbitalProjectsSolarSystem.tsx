import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Compass, Play, Pause, X } from 'lucide-react';
import { PROJECTS, Project, ProjectCategory } from '../data/portfolio';
import { CyberneticGlobe3D } from './CyberneticGlobe3D';
import { ProjectCard } from './ProjectCard';
import styles from './OrbitalProjectsSolarSystem.module.css';

interface OrbitalProjectsSolarSystemProps {
  onRotate?: (angle: number, activeIndex: number, activeTitle: string) => void;
  isActive?: boolean;
  globeOpacity?: number;
  chromeOpacity?: number;
  entryProgress?: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (v: number) => 1 - Math.pow(1 - v, 3);

export const OrbitalProjectsSolarSystem: React.FC<OrbitalProjectsSolarSystemProps> = ({
  onRotate,
  isActive = true,
  globeOpacity = 1,
  chromeOpacity = 1,
  entryProgress = 1,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [exitingProject, setExitingProject] = useState<Project | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const currentOffsetRef = useRef<number>(0);
  const targetOffsetRef = useRef<number>(0);
  const isSteppingRef = useRef<boolean>(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inspector modal scroll & navigation refs
  const cardContentRef = useRef<HTMLDivElement | null>(null);
  const horizontalWheelAccumulatorRef = useRef<number>(0);
  const isHorizontalLockedRef = useRef<boolean>(false);
  const horizontalUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHorizontalDirRef = useRef<number>(0);
  const lastHorizDeltaRef = useRef<number>(0);
  const lastNavTimestampRef = useRef<number>(0);
  const modalTouchStartXRef = useRef<number>(0);
  const modalTouchStartYRef = useRef<number>(0);
  const isModalHorizontalSwipeRef = useRef<boolean>(false);

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartOffsetRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ref for the animation loop
  const rafIdRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Filter projects by category
  const filteredProjects: Project[] =
    selectedCategory === 'all'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === selectedCategory);

  const total = filteredProjects.length;

  // Active center index
  const activeIndex =
    total > 0
      ? ((Math.round(scrollOffset) % total) + total) % total
      : 0;
  const activeProject = filteredProjects[activeIndex] || filteredProjects[0];

  // Rotation angle of the 3D turntable (in degrees)
  const sunRotationAngle = total > 0 ? (scrollOffset / total) * 360 * 2 : 0;

  // Sync telemetry with parent container ONLY when activeIndex changes
  const prevReportedIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (activeProject && prevReportedIndexRef.current !== activeIndex) {
      prevReportedIndexRef.current = activeIndex;
      onRotate?.(sunRotationAngle, activeIndex, activeProject.title);
    }
  }, [activeIndex, activeProject, sunRotationAngle, onRotate]);

  // Continuous slow-pace auto-motion & smooth stepping interpolation
  // Pauses auto-motion when a tile is inspected, during manual dragging, or while smoothly stepping
  useEffect(() => {
    if (!isActive) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isSteppingRef.current && total > 0) {
        const diff = targetOffsetRef.current - currentOffsetRef.current;
        if (Math.abs(diff) < 0.002) {
          currentOffsetRef.current = targetOffsetRef.current;
          const normalized = ((targetOffsetRef.current % total) + total) % total;
          currentOffsetRef.current = normalized;
          targetOffsetRef.current = normalized;
          setScrollOffset(normalized);
          isSteppingRef.current = false;
        } else {
          // Relaxed, critically damped exponential easing (~0.5s settle, perfectly smooth)
          const factor = 1 - Math.exp(-6.5 * dt);
          currentOffsetRef.current += diff * factor;
          const normalized = ((currentOffsetRef.current % total) + total) % total;
          setScrollOffset(normalized);
        }
      } else if (!selectedProject && !isDraggingRef.current && total > 0) {
        // Slow, elegant pace: ~0.16 units/s (approx 6.2 seconds per project transition)
        currentOffsetRef.current = (currentOffsetRef.current + 0.16 * dt) % total;
        targetOffsetRef.current = currentOffsetRef.current;
        setScrollOffset(currentOffsetRef.current);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [isActive, selectedProject, total]);

  // Mouse wheel & trackpad horizontal scroll support for 3D turntable
  // Ensures each scroll strictly steps either to the next or previous project
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;

    let arenaLocked = false;
    let arenaTimer: ReturnType<typeof setTimeout> | null = null;
    let arenaAccumulator = 0;
    let lastArenaDelta = 0;
    let lastArenaDir = 0;
    let lastArenaTime = 0;

    const handleWheel = (e: WheelEvent) => {
      const isShift = e.shiftKey;
      const deltaX = isShift && Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
      const deltaY = isShift ? 0 : e.deltaY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < 0.8 && absY < 0.8) return;

      const isHorizontalIntent = isShift || absX > absY || (absX > 3 && absX >= absY * 0.7);

      if (isHorizontalIntent) {
        e.preventDefault();

        const currentDir = deltaX > 0 ? 1 : -1;
        const now = performance.now();

        if (arenaTimer) clearTimeout(arenaTimer);
        arenaTimer = setTimeout(() => {
          arenaLocked = false;
          arenaAccumulator = 0;
          lastArenaDelta = 0;
          lastArenaDir = 0;
        }, 140);

        if (arenaLocked) {
          const isReversal = lastArenaDir !== 0 && currentDir !== lastArenaDir && absX > 6;
          const isSharpFlick =
            currentDir === lastArenaDir &&
            now - lastArenaTime > 280 &&
            absX > 22 &&
            absX > lastArenaDelta * 1.8;

          if (isReversal || isSharpFlick) {
            arenaLocked = false;
            arenaAccumulator = 0;
          } else {
            lastArenaDelta = absX;
            return;
          }
        }

        arenaAccumulator += deltaX;
        lastArenaDelta = absX;

        const ARENA_THRESHOLD = 14;
        if (Math.abs(arenaAccumulator) >= ARENA_THRESHOLD) {
          const stepDir = arenaAccumulator > 0 ? 'next' : 'prev';
          lastArenaDir = currentDir;
          lastArenaTime = now;
          arenaLocked = true;
          arenaAccumulator = 0;

          stepProject(stepDir);
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (arenaTimer) clearTimeout(arenaTimer);
    };
  }, [total]);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isSteppingRef.current = false;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = currentOffsetRef.current;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 10) {
      hasMovedRef.current = true;
    }
    const offsetDelta = -dx * 0.006;
    const next = dragStartOffsetRef.current + offsetDelta;
    currentOffsetRef.current = next;
    targetOffsetRef.current = next;
    setScrollOffset(total > 0 ? ((next % total) + total) % total : 0);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    if (total > 0) {
      // Gently settle to the nearest project on release with relaxed glide
      targetOffsetRef.current = Math.round(currentOffsetRef.current);
      isSteppingRef.current = true;
    }
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 120);
  };

  // Step controls with smooth relaxed turntable glide
  const stepProject = (direction: 'prev' | 'next') => {
    if (total === 0) return;
    const delta = direction === 'next' ? 1 : -1;
    targetOffsetRef.current = Math.round(currentOffsetRef.current) + delta;
    isSteppingRef.current = true;
  };

  // Helper for closing inspector modal cleanly
  const closeModal = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setExitingProject(null);
    setSelectedProject(null);
  }, []);

  // Helper to jump to project in modal (e.g. from bottom pips)
  const jumpToModalProject = useCallback(
    (targetProject: Project, targetIdx: number) => {
      if (!selectedProject || selectedProject.id === targetProject.id || total === 0) return;
      const currIdx = filteredProjects.findIndex((p) => p.id === selectedProject.id);
      const dir = targetIdx > currIdx ? 'right' : 'left';

      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }

      setSlideDirection(dir);
      setExitingProject(selectedProject);
      setSelectedProject(targetProject);

      let diff = targetIdx - (currentOffsetRef.current % total);
      while (diff > total / 2) diff -= total;
      while (diff < -total / 2) diff += total;
      targetOffsetRef.current = currentOffsetRef.current + diff;
      isSteppingRef.current = true;

      exitTimerRef.current = setTimeout(() => {
        setExitingProject(null);
        exitTimerRef.current = null;
      }, 540);
    },
    [filteredProjects, selectedProject, total]
  );

  // Sideways navigation for modal project inspector with continuous paired transitions
  const navigateModalProject = useCallback(
    (direction: 'prev' | 'next') => {
      if (total === 0 || !selectedProject) return;
      const currentIndex = filteredProjects.findIndex((p) => p.id === selectedProject.id);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex =
        direction === 'next'
          ? (safeIndex + 1) % total
          : (safeIndex - 1 + total) % total;

      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }

      setSlideDirection(direction === 'next' ? 'right' : 'left');
      setExitingProject(selectedProject);
      setSelectedProject(filteredProjects[nextIndex]);

      // Smooth background turntable rotation (shortest circular path)
      let diff = nextIndex - (currentOffsetRef.current % total);
      while (diff > total / 2) diff -= total;
      while (diff < -total / 2) diff += total;
      targetOffsetRef.current = currentOffsetRef.current + diff;
      isSteppingRef.current = true;

      exitTimerRef.current = setTimeout(() => {
        setExitingProject(null);
        exitTimerRef.current = null;
      }, 540);
    },
    [filteredProjects, selectedProject, total]
  );

  // Wheel handler for inspector modal:
  // - Pure vertical wheel: allows smooth scrolling down through specs accordion
  // - Horizontal wheel / Shift+Wheel / Trackpad 2-finger sideways swipe: strictly navigates by 1 project per scroll
  const handleModalWheel = (e: React.WheelEvent) => {
    // Stop propagation so story container and chapter locks NEVER receive this event
    e.stopPropagation();

    const isShift = e.shiftKey;
    const deltaX = isShift && Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
    const deltaY = isShift ? 0 : e.deltaY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 0.8 && absY < 0.8) return;

    // Detect horizontal scroll intent:
    // Any gesture where horizontal is dominant or Shift is held
    const isHorizontalIntent =
      isShift ||
      absX > absY ||
      (absX > 3 && absX >= absY * 0.7);

    if (isHorizontalIntent) {
      e.preventDefault();

      const currentDir = deltaX > 0 ? 1 : -1;
      const now = performance.now();

      // Refresh silence timer: 140ms after wheel events stop, unlock for the next gesture
      if (horizontalUnlockTimerRef.current) {
        clearTimeout(horizontalUnlockTimerRef.current);
      }
      horizontalUnlockTimerRef.current = setTimeout(() => {
        isHorizontalLockedRef.current = false;
        horizontalWheelAccumulatorRef.current = 0;
        lastHorizDeltaRef.current = 0;
        lastHorizontalDirRef.current = 0;
        horizontalUnlockTimerRef.current = null;
      }, 140);

      // If locked from a previous transition during this gesture:
      if (isHorizontalLockedRef.current) {
        // Condition 1: Immediate Direction Reversal (e.g. swiped right, now deliberately swiped left)
        const isReversal =
          lastHorizontalDirRef.current !== 0 &&
          currentDir !== lastHorizontalDirRef.current &&
          absX > 5;

        // Condition 2: Intentional Sharp Second Flick (accelerating spike over decaying inertia)
        const isSharpSecondFlick =
          currentDir === lastHorizontalDirRef.current &&
          now - lastNavTimestampRef.current > 280 &&
          absX > 22 &&
          absX > lastHorizDeltaRef.current * 1.8;

        if (isReversal || isSharpSecondFlick) {
          isHorizontalLockedRef.current = false;
          horizontalWheelAccumulatorRef.current = 0;
        } else {
          // Decaying inertia from current swipe: strictly reject so it NEVER skips tiles!
          lastHorizDeltaRef.current = absX;
          return;
        }
      }

      horizontalWheelAccumulatorRef.current += deltaX;
      lastHorizDeltaRef.current = absX;

      const HORIZONTAL_THRESHOLD = 14;
      if (Math.abs(horizontalWheelAccumulatorRef.current) >= HORIZONTAL_THRESHOLD) {
        const dir = horizontalWheelAccumulatorRef.current > 0 ? 'next' : 'prev';
        lastHorizontalDirRef.current = currentDir;
        lastNavTimestampRef.current = now;
        navigateModalProject(dir);

        // Lock gesture immediately: strictly 1 project per swipe!
        isHorizontalLockedRef.current = true;
        horizontalWheelAccumulatorRef.current = 0;
      }
    } else {
      // Clear or decay accumulator if user is clearly scrolling vertically in specs
      if (absY > 15) {
        horizontalWheelAccumulatorRef.current = 0;
      }
    }
  };

  // Touch swipe support for sideways project navigation on mobile / touch
  const handleModalTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    modalTouchStartXRef.current = e.touches[0].clientX;
    modalTouchStartYRef.current = e.touches[0].clientY;
    isModalHorizontalSwipeRef.current = false;
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - modalTouchStartXRef.current;
    const dy = e.touches[0].clientY - modalTouchStartYRef.current;

    if (Math.abs(dx) > Math.abs(dy) * 1.3 && Math.abs(dx) > 12) {
      isModalHorizontalSwipeRef.current = true;
    }
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (isModalHorizontalSwipeRef.current && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - modalTouchStartXRef.current;
      if (Math.abs(dx) > 40) {
        navigateModalProject(dx < 0 ? 'next' : 'prev');
      }
    }
    isModalHorizontalSwipeRef.current = false;
  };

  // Keyboard navigation when inspector modal is open
  useEffect(() => {
    if (!selectedProject) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateModalProject('next');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateModalProject('prev');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject, navigateModalProject, closeModal]);

  // Category counts
  const countAll = PROJECTS.length;
  const countAi = PROJECTS.filter((p) => p.category === 'ai').length;
  const countUtil = PROJECTS.filter((p) => p.category === 'utility').length;
  const countInteract = PROJECTS.filter((p) => p.category === 'interactive').length;

  // Dynamic entry & physical transformation from Skills
  const ep = clamp01(entryProgress);
  const globeScale = 0.38 + 0.62 * easeOutCubic(ep);
  const shockwaveScale = (0.35 + 2.4 * easeOutCubic(ep)).toFixed(3);
  const shockwaveOpacity = (Math.sin(ep * Math.PI) * 0.85).toFixed(2);
  const chromeSlide = (1 - easeOutCubic(clamp01((ep - 0.35) / 0.65))) * 18;
  const chromeAlpha = chromeOpacity * easeOutCubic(clamp01((ep - 0.3) / 0.7));

  return (
    <div
      className={styles.solarSystemWrapper}
      aria-label="3D Curved Projects Carousel"
      style={{ '--chapter-chrome-opacity': chromeOpacity } as React.CSSProperties}
    >
      {/* Header Bar: Category Filters & Orbit Status */}
      <div
        className={styles.headerBar}
        style={{
          transform: `translateY(-${chromeSlide.toFixed(1)}px)`,
          opacity: chromeAlpha.toFixed(2),
        }}
      >
        <div className={styles.filterGroup}>
          <button
            type="button"
            className={`${styles.filterChip} ${selectedCategory === 'all' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              closeModal();
              currentOffsetRef.current = 0;
              targetOffsetRef.current = 0;
              isSteppingRef.current = false;
              setScrollOffset(0);
            }}
          >
            <span>ALL</span>
            <span className={styles.chipCount}>({countAll})</span>
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${selectedCategory === 'ai' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setSelectedCategory('ai');
              closeModal();
              currentOffsetRef.current = 0;
              targetOffsetRef.current = 0;
              isSteppingRef.current = false;
              setScrollOffset(0);
            }}
          >
            <span>AI &amp; AGENTS</span>
            <span className={styles.chipCount}>({countAi})</span>
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${selectedCategory === 'utility' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setSelectedCategory('utility');
              closeModal();
              currentOffsetRef.current = 0;
              targetOffsetRef.current = 0;
              isSteppingRef.current = false;
              setScrollOffset(0);
            }}
          >
            <span>DEV UTILITIES</span>
            <span className={styles.chipCount}>({countUtil})</span>
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${selectedCategory === 'interactive' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setSelectedCategory('interactive');
              closeModal();
              currentOffsetRef.current = 0;
              targetOffsetRef.current = 0;
              isSteppingRef.current = false;
              setScrollOffset(0);
            }}
          >
            <span>3D &amp; INTERACTIVE</span>
            <span className={styles.chipCount}>({countInteract})</span>
          </button>
        </div>

        {/* Dynamic Status Pill */}
        <div
          className={`${styles.orbitStatusPill} ${selectedProject ? styles.orbitStatusPaused : styles.orbitStatusMoving}`}
        >
          {selectedProject ? (
            <>
              <Pause size={12} />
              <span>MOTION PAUSED // INSPECTING TILE</span>
            </>
          ) : (
            <>
              <span className={styles.orbitIconSpin}>
                <Compass size={13} />
              </span>
              <span>SLOW PACE MOTION // CLICK TILE TO INSPECT</span>
            </>
          )}
        </div>
      </div>

      {/* 3D Solar Arena: Central 3D Disc with Curved Project Stream */}
      <div
        ref={arenaRef}
        className={styles.solarArena}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="region"
        aria-label="3D Curved Projects Arena"
      >
        {/* 
          True 3D Orbital Projects:
          Cards orbit the Cybernetic Globe in a circular trajectory:
          - As cards curve towards the back (z < 0), they slip behind the globe (occluded by the sphere)
          - As cards curve around into the front (z >= 0), they emerge into view
        */}
        {(() => {
          // Dynamic orbital expansion as the systems unfurl from the central core
          const orbitExpand = easeOutCubic(clamp01((ep - 0.12) / 0.88));
          // Compact orbit hugging the globe (globe sphere R = 177 desktop, ~120 mobile)
          const baseRx = isMobile ? 142 : 212;
          const baseRz = isMobile ? 88 : 142;
          const Rx = baseRx * (0.35 + 0.65 * orbitExpand);
          const Rz = baseRz * (0.35 + 0.65 * orbitExpand);
          // Step angle ~84-86 deg: cards spaced evenly around the 3D orbit with zero overlap
          const stepAngleRad = (isMobile ? 86 : 84) * (Math.PI / 180);
          const baseScale = (isMobile ? 0.72 : 1.02) * (0.38 + 0.62 * orbitExpand);

          const tiles = filteredProjects
            .map((project, i) => {
              if (total === 0) return null;

              // Normalized circular offset: d is in range [-total/2, total/2]
              let d = ((i - scrollOffset) % total + total) % total;
              if (d > total / 2) {
                d -= total;
              }

              // Visible range: card orbits from behind the left side, across the front, and behind the right side
              if (Math.abs(d) > 1.85) {
                return null;
              }

              const theta = d * stepAngleRad;
              const x = Rx * Math.sin(theta);
              const z = Rz * Math.cos(theta);
              const y = 0; // Centered level on the globe's equator

              const thetaDeg = theta * (180 / Math.PI);
              // Angle front face towards viewer with 3D curvature around sphere
              const rotY = Math.max(-56, Math.min(56, thetaDeg * 0.65));

              // Perspective scale: forward cards are larger, backward cards smaller
              const depthScale = 0.8 + 0.2 * Math.max(-1, Math.min(1, z / Rz));
              const scale = baseScale * depthScale;

              // Opacity: stays 100% solid while in front and while curving around the horizon;
              // fades only when deep behind the globe (|d| > 1.35)
              const baseOpacity =
                Math.abs(d) <= 1.35
                  ? 1
                  : Math.max(0, 1 - (Math.abs(d) - 1.35) / 0.45);
              const opacity = baseOpacity * easeOutCubic(clamp01((ep - 0.18) / 0.72));

              const catClass =
                project.category === 'ai'
                  ? styles.catAi
                  : project.category === 'utility'
                  ? styles.catUtil
                  : styles.catInteract;

              const shadowIntensity = Math.min(1, Math.pow(Math.abs(d) / 1.5, 2));
              const isBehind = z < 0;

              return {
                project,
                i,
                d,
                x,
                y,
                z,
                rotY,
                scale,
                opacity,
                catClass,
                shadowIntensity,
                isBehind,
              };
            })
            .filter(Boolean) as Array<{
              project: Project;
              i: number;
              d: number;
              x: number;
              y: number;
              z: number;
              rotY: number;
              scale: number;
              opacity: number;
              catClass: string;
              shadowIntensity: number;
              isBehind: boolean;
            }>;

          const renderTile = (tile: (typeof tiles)[0]) => (
            <div
              key={tile.project.id}
              className={styles.curvedProjectTile}
              style={{
                transform: `translate3d(${tile.x.toFixed(1)}px, ${tile.y.toFixed(1)}px, ${tile.z.toFixed(1)}px) rotateY(${tile.rotY.toFixed(1)}deg) scale(${tile.scale.toFixed(3)})`,
                opacity: tile.opacity.toFixed(2),
              }}
              onPointerDown={(e) => {
                dragStartXRef.current = e.clientX;
                hasMovedRef.current = false;
              }}
              onClick={() => {
                if (!hasMovedRef.current) {
                  if (exitTimerRef.current) {
                    clearTimeout(exitTimerRef.current);
                    exitTimerRef.current = null;
                  }
                  setExitingProject(null);
                  setSelectedProject(tile.project);
                  setSlideDirection(null);
                }
              }}
              title={`Click to inspect ${tile.project.title}`}
            >
              {/* Dynamic Curvature Edge Shadow: deepens when bending around globe */}
              <div
                className={styles.tileCurvatureShadow}
                style={{
                  opacity: tile.shadowIntensity.toFixed(2),
                  background:
                    tile.d < 0
                      ? 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)'
                      : 'linear-gradient(to left, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
                }}
              />

              <div className={styles.tileHeader}>
                <span className={styles.tilePlanetId}>[{String(tile.i + 1).padStart(2, '0')}]</span>
                <span className={styles.tileSysId}>{tile.project.sysId}</span>
              </div>

              <div className={styles.tileImageWrapper}>
                <img
                  src={tile.project.image}
                  alt={tile.project.title}
                  className={styles.tileImageThumb}
                  loading="lazy"
                />
                <div className={styles.tileScanlineOverlay} />
              </div>

              <div className={styles.tileBody}>
                <div className={styles.tileTitleRow}>
                  <h4 className={styles.tileTitle}>{tile.project.title}</h4>
                  <span className={`${styles.tileCategoryDot} ${tile.catClass}`} />
                </div>
                <p className={styles.tileDescSnippet}>{tile.project.description}</p>
              </div>
            </div>
          );

          return (
            <>
              {/* Back Stage: Tiles revolving BEHIND the 3D globe (z < 0) */}
              <div className={styles.backTilesStage}>
                {tiles.filter((t) => t.isBehind).map(renderTile)}
              </div>

              {/* Ignition shockwave and radial aura blooming during transition from Skills */}
              {ep < 0.98 && (
                <>
                  <div
                    className={styles.coreAuraPulse}
                    style={{
                      transform: `scale(${shockwaveScale})`,
                      opacity: shockwaveOpacity,
                    }}
                  />
                  <div
                    className={styles.birthShockwave}
                    style={{
                      transform: `scale(${shockwaveScale})`,
                      opacity: shockwaveOpacity,
                    }}
                  />
                </>
              )}

              {/* Central 3D Cybernetic Globe */}
              <div
                className={styles.sunCoreContainer}
                style={{
                  opacity: globeOpacity,
                  transform: `translate(-50%, -50%) scale(${globeScale.toFixed(3)})`,
                }}
              >
                <CyberneticGlobe3D
                  // The globe owns a steady visual spin. Card orbit movement
                  // must never steer, reverse, or restart the Earth itself.
                  rotationAngle={0}
                  isAnimating={isActive}
                  activeProjectIndex={activeIndex}
                  totalProjects={total}
                  activeProjectTitle={activeProject?.title || ''}
                  showLandmass
                />
              </div>

              {/* Front Stage: Tiles revolving IN FRONT of the 3D globe (z >= 0) */}
              <div className={styles.frontTilesStage}>
                {tiles.filter((t) => !t.isBehind).map(renderTile)}
              </div>
            </>
          );
        })()}
      </div>

      {/* Detailed Project Inspector: Appears when a tile IS clicked on */}
      {selectedProject && (
        <div
          className={styles.inspectorBackdrop}
          onClick={closeModal}
          onWheel={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              handleModalWheel(e);
            }
          }}
          data-inspector-modal="true"
        >
          <div
            className={styles.inspectorModalWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Left/Right Prev/Next Buttons */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  className={styles.modalSideNavBtnPrev}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateModalProject('prev');
                  }}
                  aria-label="Previous project"
                  title="Previous project (← or scroll sideways)"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  type="button"
                  className={styles.modalSideNavBtnNext}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateModalProject('next');
                  }}
                  aria-label="Next project"
                  title="Next project (→ or scroll sideways)"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <div
              className={styles.inspectorModal}
              role="dialog"
              aria-modal="true"
              aria-label={`Project inspection: ${selectedProject.title}`}
              data-inspector-modal="true"
              onWheel={handleModalWheel}
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
            >
              {/* Top Header Bar */}
              <div className={styles.inspectorTopBar}>
                <div className={styles.inspectorStationInfo}>
                  <span className={styles.inspectorProjectBadge}>
                    [{String(
                      Math.max(
                        1,
                        filteredProjects.findIndex((p) => p.id === selectedProject.id) + 1
                      )
                    ).padStart(2, '0')}{' '}
                    / {String(total).padStart(2, '0')}]
                  </span>
                  <span>SYS // {selectedProject.sysId}</span>
                </div>

                <div className={styles.inspectorCenterHint}>
                  <span>SCROLL SIDEWAYS ⇄</span>
                  <div className={styles.inspectorNavArrows}>
                    <button
                      type="button"
                      className={styles.inspectorNavArrowBtn}
                      onClick={() => navigateModalProject('prev')}
                      title="Previous project (←)"
                      aria-label="Previous project"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      className={styles.inspectorNavArrowBtn}
                      onClick={() => navigateModalProject('next')}
                      title="Next project (→)"
                      aria-label="Next project"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.resumeOrbitBtn}
                  onClick={closeModal}
                  title="Close and resume slow pace motion (Esc)"
                >
                  <Play size={12} />
                  <span>RESUME MOTION</span>
                  <X size={13} style={{ marginLeft: '4px' }} />
                </button>
              </div>

              {/* Scrollable Card Viewport: paired exit/enter relaxed transitions */}
              <div className={styles.inspectorCardViewport}>
                {exitingProject && (
                  <div
                    key={`exit-${exitingProject.id}`}
                    className={`${styles.cardSlideSlot} ${styles.cardSlideSlotExiting} ${
                      slideDirection === 'right'
                        ? styles.slideOutToLeft
                        : styles.slideOutToRight
                    }`}
                    aria-hidden="true"
                  >
                    <ProjectCard project={exitingProject} />
                  </div>
                )}

                <div
                  ref={cardContentRef}
                  key={`enter-${selectedProject.id}`}
                  className={`${styles.cardSlideSlot} ${
                    exitingProject
                      ? slideDirection === 'right'
                        ? styles.slideInFromRight
                        : styles.slideInFromLeft
                      : ''
                  }`}
                >
                  <ProjectCard project={selectedProject} />
                </div>
              </div>

              {/* Bottom Quick-Switch Bar & Pips */}
              <div className={styles.inspectorBottomBar}>
                <div className={styles.inspectorPips}>
                  {filteredProjects.map((p, idx) => {
                    const isSelected = p.id === selectedProject.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`${styles.inspectorPip} ${
                          isSelected ? styles.inspectorPipActive : ''
                        }`}
                        onClick={() => jumpToModalProject(p, idx)}
                        aria-label={`Jump to ${p.title}`}
                        title={p.title}
                      />
                    );
                  })}
                </div>

                <div className={styles.inspectorHintText}>
                  <span className={styles.inspectorKeyBadge}>← / →</span>
                  <span>navigate</span>
                  <span className={styles.inspectorKeyBadge} style={{ marginLeft: '4px' }}>
                    ESC
                  </span>
                  <span>close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer Controls */}
      <div
        className={styles.footerNav}
        style={{
          transform: `translateY(${chromeSlide.toFixed(1)}px)`,
          opacity: chromeAlpha.toFixed(2),
        }}
      >
        <div className={styles.navControls}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => stepProject('prev')}
            aria-label="Previous project"
            title="Step to previous project"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => stepProject('next')}
            aria-label="Next project"
            title="Step to next project"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Mini Pips for all projects */}
        <div className={styles.pipIndicators}>
          {filteredProjects.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.pip} ${idx === activeIndex ? styles.pipActive : ''}`}
              onClick={() => {
                let diff = idx - (currentOffsetRef.current % total);
                while (diff > total / 2) diff -= total;
                while (diff < -total / 2) diff += total;
                targetOffsetRef.current = currentOffsetRef.current + diff;
                isSteppingRef.current = true;
                closeModal();
              }}
              aria-label={`Jump to ${p.title}`}
            />
          ))}
        </div>

        <div className={styles.planetCountTag}>
          <span className={styles.planetCountHighlight}>
            {String(activeIndex + 1).padStart(2, '0')}
          </span>{' '}
          / {String(total).padStart(2, '0')} PROJECTS
        </div>
      </div>
    </div>
  );
};
