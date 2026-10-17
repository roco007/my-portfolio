import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Compass, Play, Pause, X } from 'lucide-react';
import { PROJECTS, Project, ProjectCategory } from '../data/portfolio';
import { CyberneticGlobe3D } from './CyberneticGlobe3D';
import { ProjectCard } from './ProjectCard';
import styles from './OrbitalProjectsSolarSystem.module.css';

interface OrbitalProjectsSolarSystemProps {
  onRotate?: (angle: number, activeIndex: number, activeTitle: string) => void;
}

export const OrbitalProjectsSolarSystem: React.FC<OrbitalProjectsSolarSystemProps> = ({
  onRotate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  // Continuous slow-pace auto-motion
  // Pauses ONLY when a tile is clicked on or during manual dragging
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!selectedProject && !isDraggingRef.current && total > 0) {
        // Slow, elegant pace: ~0.16 units/s (approx 6.2 seconds per project transition)
        setScrollOffset((prev) => (prev + 0.16 * dt) % total);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [selectedProject, total]);

  // Mouse wheel & trackpad horizontal scroll support
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prioritize horizontal delta if user is swiping horizontally or holding shift
      const isHorizontalIntent = Math.abs(e.deltaX) > 1 || e.shiftKey;
      const isHorizontalDominant = Math.abs(e.deltaX) > Math.abs(e.deltaY);

      if (isHorizontalIntent || isHorizontalDominant) {
        const delta = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
        if (Math.abs(delta) > 1) {
          e.preventDefault();
          setScrollOffset((prev) => {
            const next = prev + delta * 0.0035;
            return total > 0 ? ((next % total) + total) % total : 0;
          });
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [total]);

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = scrollOffset;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 10) {
      hasMovedRef.current = true;
    }
    const offsetDelta = -dx * 0.006;
    const next = dragStartOffsetRef.current + offsetDelta;
    setScrollOffset(total > 0 ? ((next % total) + total) % total : 0);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 120);
  };

  // Step controls
  const stepProject = (direction: 'prev' | 'next') => {
    if (total === 0) return;
    setScrollOffset((prev) => {
      const next = prev + (direction === 'next' ? 1 : -1);
      return ((next % total) + total) % total;
    });
  };

  // Category counts
  const countAll = PROJECTS.length;
  const countAi = PROJECTS.filter((p) => p.category === 'ai').length;
  const countUtil = PROJECTS.filter((p) => p.category === 'utility').length;
  const countInteract = PROJECTS.filter((p) => p.category === 'interactive').length;

  return (
    <div className={styles.solarSystemWrapper} aria-label="3D Curved Projects Carousel">
      {/* Header Bar: Category Filters & Orbit Status */}
      <div className={styles.headerBar}>
        <div className={styles.filterGroup}>
          <button
            type="button"
            className={`${styles.filterChip} ${selectedCategory === 'all' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setSelectedProject(null);
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
              setSelectedProject(null);
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
              setSelectedProject(null);
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
              setSelectedProject(null);
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
          // Compact orbit hugging the globe (globe sphere R = 177 desktop, ~120 mobile)
          const Rx = isMobile ? 142 : 212;
          const Rz = isMobile ? 88 : 142;
          // Step angle ~84-86 deg: cards spaced evenly around the 3D orbit with zero overlap
          const stepAngleRad = (isMobile ? 86 : 84) * (Math.PI / 180);
          const baseScale = isMobile ? 0.72 : 1.02;

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
              const opacity =
                Math.abs(d) <= 1.35
                  ? 1
                  : Math.max(0, 1 - (Math.abs(d) - 1.35) / 0.45);

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
                  setSelectedProject(tile.project);
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

              {/* Central 3D Cybernetic Globe */}
              <div className={styles.sunCoreContainer}>
                <CyberneticGlobe3D
                  rotationAngle={sunRotationAngle}
                  activeProjectIndex={activeIndex}
                  totalProjects={total}
                  activeProjectTitle={activeProject?.title || ''}
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
          onClick={() => setSelectedProject(null)}
        >
          <div
            className={styles.inspectorModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.inspectorTopBar}>
              <span className={styles.inspectorStationInfo}>
                PLANETARY STATION // {selectedProject.sysId}
              </span>

              <button
                type="button"
                className={styles.resumeOrbitBtn}
                onClick={() => setSelectedProject(null)}
                title="Close and resume slow pace motion"
              >
                <Play size={12} />
                <span>RESUME MOTION</span>
                <X size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div className={styles.inspectorCardContent}>
              <ProjectCard project={selectedProject} />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer Controls */}
      <div className={styles.footerNav}>
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
                setScrollOffset(idx);
                setSelectedProject(null);
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
