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

  // Sync telemetry with parent container
  useEffect(() => {
    if (activeProject) {
      onRotate?.(sunRotationAngle, activeIndex, activeProject.title);
    }
  }, [sunRotationAngle, activeIndex, activeProject, onRotate]);

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
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) > 2) {
        e.preventDefault();
        setScrollOffset((prev) => {
          const next = prev + delta * 0.0035;
          return total > 0 ? ((next % total) + total) % total : 0;
        });
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
        {/* Central 3D Cybernetic Globe: ROTATING AROUND ITS OWN AXIS */}
        <div className={styles.sunCoreContainer}>
          <CyberneticGlobe3D
            rotationAngle={sunRotationAngle}
            activeProjectIndex={activeIndex}
            totalProjects={total}
            activeProjectTitle={activeProject?.title || ''}
          />
        </div>

        {/* 
          Curved Project Tiles:
          Strictly non-overlapping spacing (235px gap vs 164px card width),
          curving around the 3D globe's contour on left and right edges.
        */}
        <div className={styles.tilesStage}>
          {filteredProjects.map((project, i) => {
            if (total === 0) return null;

            // Normalized circular offset: d is in range [-total/2, total/2]
            let d = ((i - scrollOffset) % total + total) % total;
            if (d > total / 2) {
              d -= total;
            }

            // Strictly filter out tiles beyond the visible front arc: only 3 active cards visible!
            if (Math.abs(d) > 1.8) {
              return null;
            }

            // Responsive horizontal position: 350px on desktop, 185px on mobile to guarantee ZERO overlap
            const spacingX = isMobile ? 185 : 350;
            const x = d * spacingX;

            // Vertical position: lifted directly onto the centre line of the 3D globe
            const y = 0;

            // Depth Z: center card is forward, curving ends drop back into depth alongside the globe
            const depthFactor = isMobile ? 55 : 85;
            const z = (isMobile ? 38 : 55) - Math.pow(Math.abs(d), 1.5) * depthFactor;

            // 3D Curvature Angle (rotateY):
            // Center is 0deg. As card moves to left (d < 0), outer edge curves back (rotY < 0, up to -50deg).
            // As card enters from right (d > 0), outer edge curves back (rotY > 0, up to +50deg).
            const rotY = Math.max(-50, Math.min(50, d * (isMobile ? 32 : 36)));

            // Level alignment along center line
            const rotZ = 0;

            // Responsive scale: 1.02 on desktop, 0.72 on mobile
            const baseScale = isMobile ? 0.72 : 1.02;
            const scale = Math.max(isMobile ? 0.52 : 0.70, baseScale - Math.abs(d) * (isMobile ? 0.14 : 0.18));

            // Opacity: solid in center, fading gracefully at the outer perimeter edges
            const opacity =
              Math.abs(d) <= 1.05
                ? 1
                : Math.max(0, 1 - (Math.abs(d) - 1.05) / 0.75);

            // Layering: center card in front (z-index 25), outer cards behind (z-index 10)
            const zIndex = Math.abs(d) < 0.6 ? 25 : 10;

            const catClass =
              project.category === 'ai'
                ? styles.catAi
                : project.category === 'utility'
                ? styles.catUtil
                : styles.catInteract;

            // Shadow gradient intensity at curving edges
            const shadowIntensity = Math.min(1, Math.pow(Math.abs(d) / 1.6, 2));

            return (
              <div
                key={project.id}
                className={styles.curvedProjectTile}
                style={{
                  transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                  opacity: opacity.toFixed(2),
                  zIndex,
                }}
                onPointerDown={(e) => {
                  dragStartXRef.current = e.clientX;
                  hasMovedRef.current = false;
                }}
                onClick={() => {
                  if (!hasMovedRef.current) {
                    setSelectedProject(project);
                  }
                }}
                title={`Click to inspect ${project.title}`}
              >
                {/* Dynamic Curvature Edge Shadow: deepens when bending around disc ends */}
                <div
                  className={styles.tileCurvatureShadow}
                  style={{
                    opacity: shadowIntensity.toFixed(2),
                    background:
                      d < 0
                        ? 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)'
                        : 'linear-gradient(to left, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
                  }}
                />

                <div className={styles.tileHeader}>
                  <span className={styles.tilePlanetId}>[{String(i + 1).padStart(2, '0')}]</span>
                  <span className={styles.tileSysId}>{project.sysId}</span>
                </div>

                <div className={styles.tileImageWrapper}>
                  <img
                    src={project.image}
                    alt={project.title}
                    className={styles.tileImageThumb}
                    loading="lazy"
                  />
                  <div className={styles.tileScanlineOverlay} />
                </div>

                <div className={styles.tileBody}>
                  <div className={styles.tileTitleRow}>
                    <h4 className={styles.tileTitle}>{project.title}</h4>
                    <span className={`${styles.tileCategoryDot} ${catClass}`} />
                  </div>
                  <p className={styles.tileDescSnippet}>{project.description}</p>
                </div>
              </div>
            );
          })}
        </div>
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
