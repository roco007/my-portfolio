import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Compass, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { SOCIAL_LINKS, SocialLink } from '../data/portfolio';
import { CyberneticGlobe3D } from './CyberneticGlobe3D';
import styles from './OrbitalSocialSolarSystem.module.css';

interface OrbitalSocialSolarSystemProps {
  onChannelSelect?: (channel: SocialLink, index: number) => void;
  onRotate?: (angle: number, activeIndex: number, activeTitle: string) => void;
  isActive?: boolean;
  globeOpacity?: number;
  chromeOpacity?: number;
}

// Brand metadata for the 6 social channels (colors, glows, symbols)
const BRAND_META: Record<
  string,
  {
    symbol: (size: number) => React.ReactNode;
    color: string;
    glow: string;
    shortLabel: string;
  }
> = {
  github: {
    symbol: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.5)',
    shortLabel: 'GH',
  },
  linkedin: {
    symbol: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
    color: '#0a66c2',
    glow: 'rgba(10, 102, 194, 0.65)',
    shortLabel: 'IN',
  },
  x: {
    symbol: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.6)',
    shortLabel: 'X',
  },
  telegram: {
    symbol: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
      </svg>
    ),
    color: '#229ED9',
    glow: 'rgba(34, 158, 217, 0.65)',
    shortLabel: 'TG',
  },
  whatsapp: {
    symbol: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.301-.15-1.782-.88-2.058-.98-.276-.101-.477-.15-.678.15-.2.302-.778.98-.954 1.181-.176.2-.351.226-.653.075-.301-.15-1.272-.469-2.424-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.527-.075-.15-.678-1.632-.929-2.236-.244-.588-.492-.508-.678-.518-.176-.009-.376-.011-.577-.011-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.512 0 1.482 1.079 2.914 1.23 3.115.15.2 2.123 3.242 5.143 4.547.718.311 1.279.497 1.716.636.721.23 1.377.197 1.896.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.125-.276-.2-.577-.35zM12.042 21.928c-1.787 0-3.535-.48-5.07-1.391l-.364-.216-3.768.988 1.006-3.673-.237-.377A9.88 9.88 0 012.16 12.04c0-5.46 4.44-9.9 9.897-9.9 2.645 0 5.131 1.03 6.999 2.902a9.85 9.85 0 012.898 6.998c0 5.462-4.442 9.902-9.912 9.902zm7.07-16.97A9.953 9.953 0 0012.042 2C6.505 2 2 6.506 2 12.042c0 1.77.462 3.498 1.338 5.018L2 22l5.097-1.337a9.99 9.99 0 004.945 1.289h.005c5.536 0 10.042-4.506 10.042-10.042 0-2.684-1.045-5.207-2.977-7.052z" />
      </svg>
    ),
    color: '#25D366',
    glow: 'rgba(37, 211, 102, 0.65)',
    shortLabel: 'WA',
  },
  instagram: {
    symbol: (size) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: '#E4405F',
    glow: 'rgba(228, 64, 95, 0.65)',
    shortLabel: 'IG',
  },
};

export const OrbitalSocialSolarSystem: React.FC<OrbitalSocialSolarSystemProps> = ({
  onChannelSelect,
  onRotate,
  isActive = true,
  globeOpacity = 1,
  chromeOpacity = 1,
}) => {
  // Use the 6 social media channels from portfolio data
  const socialChannels = SOCIAL_LINKS.filter((s) => s.platform !== 'email');
  const total = socialChannels.length;

  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isCursorWithinGlobe, setIsCursorWithinGlobe] = useState<boolean>(false);
  const isWithinGlobeRef = useRef<boolean>(false);

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
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

  const rafIdRef = useRef<number | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const globeContainerRef = useRef<HTMLDivElement | null>(null);

  // Active channel currently at the front equator
  const activeIndex =
    total > 0
      ? ((Math.round(scrollOffset) % total) + total) % total
      : 0;
  const activeChannel = socialChannels[activeIndex] || socialChannels[0];

  // Rotation angle for telemetry / globe sync
  const rotationAngle = total > 0 ? (scrollOffset / total) * 360 : 0;

  // Comprehensive check to determine whether a coordinate or event target is inside the globe boundary or its orbiting satellites
  const checkWithinGlobe = useCallback(
    (e: MouseEvent | WheelEvent | PointerEvent | React.PointerEvent): boolean => {
      if (isActive === false) return false;

      // 1. Direct target element containment check
      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest?.('#contact-polar-globe')) return true;
        if (target.closest?.(`.${styles.socialSatelliteTile}`)) return true;
        if (target.closest?.(`.${styles.solarArena}`)) return true;
        if (target.closest?.(`.${styles.sunCoreContainer}`)) return true;
        if (target.closest?.(`.${styles.frontTilesStage}`)) return true;
        if (target.closest?.(`.${styles.backTilesStage}`)) return true;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (typeof clientX !== 'number' || typeof clientY !== 'number') return false;

      // 2. Element from point check (handles cases where target might be an overlay or transparent layer)
      if (typeof document !== 'undefined' && document.elementFromPoint) {
        try {
          const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
          if (hit) {
            if (hit.closest?.('#contact-polar-globe')) return true;
            if (hit.closest?.(`.${styles.socialSatelliteTile}`)) return true;
            if (hit.closest?.(`.${styles.solarArena}`)) return true;
            if (hit.closest?.(`.${styles.sunCoreContainer}`)) return true;
            if (hit.closest?.(`.${styles.frontTilesStage}`)) return true;
            if (hit.closest?.(`.${styles.backTilesStage}`)) return true;
          }
        } catch {
          // ignore
        }
      }

      // 3. Globe Container Bounding Box & spherical radius
      const globeEl = globeContainerRef.current || document.getElementById('contact-polar-globe');
      if (globeEl) {
        const rect = globeEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const orbitRadius = Math.max(rect.width, rect.height) * 0.54;
          const dx = clientX - cx;
          const dy = clientY - cy;
          if (dx * dx + dy * dy <= orbitRadius * orbitRadius) {
            return true;
          }
          if (
            clientX >= rect.left - 20 &&
            clientX <= rect.right + 20 &&
            clientY >= rect.top - 20 &&
            clientY <= rect.bottom + 20
          ) {
            return true;
          }
        }
      }

      // 4. Arena Bounding Box Check (covers the entire 3D arena where the globe and satellites live)
      const arenaEl = arenaRef.current;
      if (arenaEl) {
        const rect = arenaEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
          ) {
            return true;
          }
        }
      }

      return false;
    },
    [isActive]
  );

  // Continuously track whether cursor is inside the globe boundary across the viewport
  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      const isWithin = checkWithinGlobe(e);
      if (isWithin !== isWithinGlobeRef.current) {
        isWithinGlobeRef.current = isWithin;
        setIsCursorWithinGlobe(isWithin);
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onWindowPointerMove);
  }, [checkWithinGlobe]);

  // Sync telemetry ONLY when activeIndex changes to avoid React update depth limits
  const prevActiveIndexRef = useRef<number>(-1);
  useEffect(() => {
    if (activeChannel && prevActiveIndexRef.current !== activeIndex) {
      prevActiveIndexRef.current = activeIndex;
      onChannelSelect?.(activeChannel, activeIndex);
      onRotate?.(rotationAngle, activeIndex, `${activeChannel.name} // ${activeChannel.handle}`);
    }
  }, [activeIndex, activeChannel, rotationAngle, onRotate, onChannelSelect]);

  // Continuous slow-pace top-to-bottom motion loop
  // Pauses ONLY when cursor is within the globe or during manual drag
  // "outside it the buttons keep moving slowly in one direction as the project tiles do."
  useEffect(() => {
    if (!isActive) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!isCursorWithinGlobe && !isDraggingRef.current && total > 0) {
        // Slow hypnotic top-to-bottom orbital speed (~0.14 units/sec)
        setScrollOffset((prev) => (prev + 0.14 * dt) % total);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isActive, isCursorWithinGlobe, total]);

  // Global window capture wheel listener:
  // "when my cursor is within the globe and scrolling up/down then the entire page must not scroll up/down but just the social media buttons must move"
  // "outside it the buttons keep moving slowly in one direction as the project tiles do."
  useEffect(() => {
    const onWindowWheel = (e: WheelEvent) => {
      if (isActive === false) return;

      const withinGlobe = checkWithinGlobe(e);

      if (withinGlobe) {
        // ALWAYS block native browser page scroll when within globe
        e.preventDefault();
        e.stopPropagation();

        if (!isWithinGlobeRef.current) {
          isWithinGlobeRef.current = true;
          setIsCursorWithinGlobe(true);
        }

        // Normalize delta across input devices (pixels, lines, pages)
        let rawDelta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (e.deltaMode === 1) {
          rawDelta *= 28;
        } else if (e.deltaMode === 2) {
          rawDelta *= 500;
        }

        if (Math.abs(rawDelta) > 0.2) {
          setScrollOffset((prev) => {
            const next = prev + rawDelta * 0.0035;
            return total > 0 ? ((next % total) + total) % total : 0;
          });
        }
      } else {
        if (isWithinGlobeRef.current) {
          isWithinGlobeRef.current = false;
          setIsCursorWithinGlobe(false);
        }
      }
    };

    const onWindowTouchMove = (e: TouchEvent) => {
      if (isActive === false) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const dummyEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          target: touch.target as HTMLElement,
        } as unknown as MouseEvent;
        if (checkWithinGlobe(dummyEvent)) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('wheel', onWindowWheel, { passive: false, capture: true });
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWindowWheel, { capture: true });
      window.removeEventListener('touchmove', onWindowTouchMove);
    };
  }, [checkWithinGlobe, isActive, total]);

  // Pointer drag handlers (vertical drag)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartYRef.current = e.clientY;
    dragStartOffsetRef.current = scrollOffset;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const within = checkWithinGlobe(e);
    if (within !== isCursorWithinGlobe) {
      setIsCursorWithinGlobe(within);
    }

    if (!isDraggingRef.current) return;
    const dy = e.clientY - dragStartYRef.current;
    if (Math.abs(dy) > 8) {
      hasMovedRef.current = true;
    }
    const offsetDelta = dy * 0.006; // drag down = rotate top to bottom
    const next = dragStartOffsetRef.current + offsetDelta;
    setScrollOffset(total > 0 ? ((next % total) + total) % total : 0);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 100);
  };

  // Step controls
  const stepChannel = (direction: 'prev' | 'next') => {
    if (total === 0) return;
    setScrollOffset((prev) => {
      const next = prev + (direction === 'next' ? 1 : -1);
      return ((next % total) + total) % total;
    });
  };

  const jumpToChannel = (index: number) => {
    setScrollOffset(index);
  };

  return (
    <div
      className={styles.socialSolarWrapper}
      aria-label="3D Orbital Social Media Satellites"
      style={{ '--chapter-chrome-opacity': chromeOpacity } as React.CSSProperties}
    >
      {/* Header Bar: Status & Direct Jump Chips */}
      <div className={styles.headerBar}>
        <div className={styles.filterGroup}>
          {socialChannels.map((channel, idx) => {
            const meta = BRAND_META[channel.platform];
            const isActive = idx === activeIndex;
            return (
              <button
                key={channel.platform}
                type="button"
                className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ''}`}
                style={
                  isActive
                    ? { borderColor: meta.color, color: meta.color, boxShadow: `0 0 10px ${meta.glow}` }
                    : undefined
                }
                onClick={() => jumpToChannel(idx)}
                title={`Jump to ${channel.name}`}
              >
                <span>{meta.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Orbital Status Pill */}
        <div className={styles.orbitStatusPill}>
          <span className={styles.orbitIconSpin}>
            <Compass size={12} />
          </span>
          <span>POLAR SATELLITE ORBIT // TOP &gt; DOWN</span>
        </div>
      </div>

      {/* 3D Solar Arena: Central Cybernetic Globe with Vertical Top-to-Bottom Orbiting Tiles */}
      <div
        ref={arenaRef}
        className={styles.solarArena}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          handlePointerUp();
          setIsCursorWithinGlobe(false);
          setHoveredIndex(null);
        }}
        role="region"
        aria-label="3D Vertical Social Orbit Arena"
      >
        {(() => {
          // Vertical Top-to-Bottom Orbit Parameters
          // Ry: vertical radius from center to poles (globe sphere radius R = 177 desktop, ~120 mobile)
          const Ry = isMobile ? 140 : 205;
          const Rz = isMobile ? 95 : 145;
          // Step angle: 360 / 6 = 60 degrees
          const stepAngleRad = (360 / total) * (Math.PI / 180);
          const baseScale = isMobile ? 0.78 : 1.0;

          const tiles = socialChannels
            .map((channel, i) => {
              if (total === 0) return null;

              // Normalized circular offset: d is in range [-total/2, total/2]
              let d = ((i - scrollOffset) % total + total) % total;
              if (d > total / 2) {
                d -= total;
              }

              // Visible range around top-to-bottom orbit
              if (Math.abs(d) > 2.3) {
                return null;
              }

              const theta = d * stepAngleRad;
              // Pure top-to-bottom motion:
              // y curves vertically along the meridian (Ry * sin(theta))
              // z curves in depth (Rz * cos(theta))
              // x is 0 (centered on vertical meridian)
              const y = Ry * Math.sin(theta);
              const z = Rz * Math.cos(theta);
              const x = 0;

              const thetaDeg = theta * (180 / Math.PI);
              // Tilt tile along X-axis to hug the curved surface of the globe:
              // negative rotX at top, 0 at equator, positive rotX at bottom
              const rotX = Math.max(-50, Math.min(50, -thetaDeg * 0.7));

              // Perspective scale: front tiles larger, back tiles smaller
              const depthScale = 0.82 + 0.22 * Math.max(-1, Math.min(1, z / Rz));
              const scale = baseScale * depthScale;

              // Opacity: solid while in front and while curving around the horizon poles;
              // fades only when deep behind the globe (|d| > 1.8)
              const opacity =
                Math.abs(d) <= 1.8
                  ? 1
                  : Math.max(0, 1 - (Math.abs(d) - 1.8) / 0.5);

              const isBehind = z < 0;
              const meta = BRAND_META[channel.platform];
              const isFrontActive = Math.abs(d) < 0.35 && !isBehind;

              return {
                channel,
                i,
                d,
                x,
                y,
                z,
                rotX,
                scale,
                opacity,
                isBehind,
                meta,
                isFrontActive,
              };
            })
            .filter(Boolean) as Array<{
              channel: SocialLink;
              i: number;
              d: number;
              x: number;
              y: number;
              z: number;
              rotX: number;
              scale: number;
              opacity: number;
              isBehind: boolean;
              meta: (typeof BRAND_META)[string];
              isFrontActive: boolean;
            }>;

          const renderTile = (tile: (typeof tiles)[0]) => {
            const isHover = hoveredIndex === tile.i;
            const iconSize = isMobile ? 26 : 34;

            return (
              <div
                key={tile.channel.platform}
                className={`${styles.socialSatelliteTile} ${tile.isFrontActive ? styles.tileFrontActive : ''}`}
                style={{
                  transform: `translate3d(${tile.x.toFixed(1)}px, ${tile.y.toFixed(1)}px, ${tile.z.toFixed(1)}px) rotateX(${tile.rotX.toFixed(1)}deg) scale(${tile.scale.toFixed(3)})`,
                  opacity: tile.opacity.toFixed(2),
                  borderColor: isHover || tile.isFrontActive ? tile.meta.color : 'rgba(255, 255, 255, 0.14)',
                  boxShadow:
                    isHover || tile.isFrontActive
                      ? `0 0 25px ${tile.meta.glow}, 0 10px 25px rgba(0, 0, 0, 0.7)`
                      : '0 8px 20px rgba(0, 0, 0, 0.5)',
                }}
                onPointerDown={(e) => {
                  dragStartYRef.current = e.clientY;
                  hasMovedRef.current = false;
                }}
                onMouseEnter={() => setHoveredIndex(tile.i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (!hasMovedRef.current) {
                    window.open(tile.channel.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                title={`Launch ${tile.channel.name} (${tile.channel.handle})`}
                aria-label={`Open ${tile.channel.name}`}
              >
                {/* Glowing neon corner accents */}
                <div
                  className={styles.tileCornerGlow}
                  style={{
                    background: `radial-gradient(circle at top right, ${tile.meta.glow} 0%, transparent 70%)`,
                  }}
                />

                {/* Company Symbol Only (No link text) */}
                <div
                  className={styles.symbolWrapper}
                  style={{
                    color: tile.meta.color,
                    filter: isHover || tile.isFrontActive ? `drop-shadow(0 0 8px ${tile.meta.glow})` : 'none',
                  }}
                >
                  {tile.meta.symbol(iconSize)}
                </div>

                {/* Satellite Index Beacon Badge */}
                <span className={styles.beaconBadge}>
                  0{tile.i + 1}
                </span>

                {/* Hover / Active Floating Callout Chip */}
                {(isHover || tile.isFrontActive) && (
                  <div
                    className={styles.floatingTooltip}
                    style={{
                      borderColor: tile.meta.color,
                      color: tile.meta.color,
                    }}
                  >
                    <span>{tile.channel.name.toUpperCase()}</span>
                    <ExternalLink size={9} />
                  </div>
                )}
              </div>
            );
          };

          return (
            <>
              {/* Back Stage: Tiles revolving BEHIND the 3D globe (z < 0) */}
              <div className={styles.backTilesStage}>
                {tiles.filter((t) => t.isBehind).map(renderTile)}
              </div>

              {/* Central 3D Cybernetic Globe in Polar Orientation */}
              <div className={styles.sunCoreContainer} style={{ opacity: globeOpacity }}>
                <CyberneticGlobe3D
                  ref={globeContainerRef}
                  id="contact-polar-globe"
                  // Keep the Earth rotation independent from wheel/drag input
                  // that advances social satellites around the polar orbit.
                  rotationAngle={0}
                  isAnimating={isActive || globeOpacity > 0.01}
                  activeProjectIndex={activeIndex}
                  totalProjects={total}
                  activeProjectTitle={`${activeChannel?.name || ''} // ${activeChannel?.handle || ''}`}
                  systemTag="SATELLITE CORE // POLAR ORBIT"
                  unitLabel="ACTIVE CH"
                  orbitOrientation="vertical"
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

      {/* Footer Navigation Step Controls (Up / Down) */}
      <div className={styles.footerNav}>
        <div className={styles.navControls}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => stepChannel('prev')}
            title="Step to previous social channel (Revolve UP)"
            aria-label="Previous channel"
          >
            <ChevronUp size={14} />
            <span>STEP UP</span>
          </button>

          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => stepChannel('next')}
            title="Step to next social channel (Revolve DOWN)"
            aria-label="Next channel"
          >
            <span>STEP DOWN</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div className={styles.orbitHint}>
          <span>CLICK TILE TO LAUNCH // DRAG UP/DOWN TO ORBIT</span>
        </div>
      </div>
    </div>
  );
};
