import React, { useEffect, useRef, useState } from 'react';
import { Calendar, CheckCircle, MapPin, X } from 'lucide-react';
import { CyberneticGlobe3D } from '../components/CyberneticGlobe3D';
import { useReducedMotion } from '../animations/useReducedMotion';
import { EXPERIENCE } from '../data/portfolio';
import styles from './Experience.module.css';

interface ExperienceProps {
  /** Keeps the chapter out of the tab order while another story chapter is visible. */
  isActive?: boolean;
  /** Lets the chapter UI unfold after the globe hand-off has reached its destination. */
  isRevealed?: boolean;
  /** Reuses this section's globe as the single shared chapter hand-off visual. */
  globeHandoff?: 'from-project' | 'to-contact';
  globeHandoffProgress?: number;
  globeHandoffOpacity?: number;
  landmassOpacity?: number;
  globeHandoffOffsetPx?: number;
}

const BRIEF_TRANSITION_MS = 460;

export const Experience: React.FC<ExperienceProps> = ({
  isActive = true,
  isRevealed = true,
  globeHandoff,
  globeHandoffProgress = 1,
  globeHandoffOpacity = 1,
  landmassOpacity = 1,
  globeHandoffOffsetPx = 0,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isBriefClosing, setIsBriefClosing] = useState(false);
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 720 : false
  );
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const orbitStageRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const focusAfterCloseRef = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const activeExperience = activeIndex === null ? null : EXPERIENCE[activeIndex];
  const total = EXPERIENCE.length;
  const isGlobeHandoff = Boolean(globeHandoff);
  const settledGlobeScale = isMobile ? 0.51 : 0.85;
  const adjacentGlobeScale = isMobile ? 0.68 : 1;

  // Responsive smooth ease with non-zero initial slope for instant tactile response
  const easedHandoffProgress =
    0.5 * globeHandoffProgress +
    0.5 * ((1 - Math.cos(Math.PI * globeHandoffProgress)) / 2);

  const targetOffsetPx = isMobile
    ? 0
    : globeHandoffOffsetPx > 0
      ? globeHandoffOffsetPx
      : 260;

  const globeScale = globeHandoff === 'from-project'
    ? adjacentGlobeScale - ((adjacentGlobeScale - settledGlobeScale) * easedHandoffProgress)
    : globeHandoff === 'to-contact'
      ? settledGlobeScale + ((adjacentGlobeScale - settledGlobeScale) * easedHandoffProgress)
      : settledGlobeScale;

  const handoffOffset = globeHandoff === 'from-project'
    ? (1 - easedHandoffProgress) * targetOffsetPx
    : easedHandoffProgress * targetOffsetPx;

  const cancelPendingBriefClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const closeBrief = (restoreTileFocus = false) => {
    if (activeIndex === null || isBriefClosing) return;

    if (restoreTileFocus) focusAfterCloseRef.current = activeIndex;
    setIsBriefClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setActiveIndex(null);
      setIsBriefClosing(false);
      closeTimerRef.current = null;

      const focusIndex = focusAfterCloseRef.current;
      focusAfterCloseRef.current = null;
      if (focusIndex !== null) tileRefs.current[focusIndex]?.focus();
    }, BRIEF_TRANSITION_MS);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 720);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isActive) {
      cancelPendingBriefClose();
      focusAfterCloseRef.current = null;
      setIsBriefClosing(false);
      setActiveIndex(null);
    }
  }, [isActive]);

  useEffect(() => () => cancelPendingBriefClose(), []);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeBrief(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isBriefClosing]);

  useEffect(() => {
    if (!isActive || activeIndex !== null || reducedMotion || total === 0) return;

    let frameId = 0;
    let lastTime = performance.now();
    const orbit = (time: number) => {
      const elapsed = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      setOrbitAngle((angle) => (angle + elapsed * 12) % 360);
      frameId = requestAnimationFrame(orbit);
    };

    frameId = requestAnimationFrame(orbit);
    return () => cancelAnimationFrame(frameId);
  }, [activeIndex, isActive, reducedMotion, total]);

  const selectExperience = (index: number, focusTile = false) => {
    const nextIndex = (index + total) % total;
    cancelPendingBriefClose();
    focusAfterCloseRef.current = null;
    setIsBriefClosing(false);
    setActiveIndex(nextIndex);
    // Bring the selected tile alongside the globe, then hold the orbit for inspection.
    setOrbitAngle((35 - nextIndex * 180 + 360) % 360);
    if (focusTile) tileRefs.current[nextIndex]?.focus();
  };

  const handleTileKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        selectExperience(index + 1, true);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        selectExperience(index - 1, true);
        break;
      case 'Home':
        event.preventDefault();
        selectExperience(0, true);
        break;
      case 'End':
        event.preventDefault();
        selectExperience(total - 1, true);
        break;
    }
  };

  useEffect(() => {
    const stage = orbitStageRef.current;
    if (!stage || !isActive) return;

    const handleOrbitWheel = (event: WheelEvent) => {
      const bounds = stage.getBoundingClientRect();
      // Match the outer dashed green orbit (`inset: 6% 16%`) rather than the
      // stage's rectangular bounds. The rest of the Experience chapter keeps
      // the browser's normal page-scrolling behavior.
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const radiusX = bounds.width * 0.34;
      const radiusY = bounds.height * 0.44;
      const offsetX = event.clientX - centerX;
      const offsetY = event.clientY - centerY;
      const isInsideOrbit =
        (offsetX * offsetX) / (radiusX * radiusX) +
          (offsetY * offsetY) / (radiusY * radiusY) <=
        1;

      // The experience orbit owns wheel input only inside its visible green
      // boundary. This leaves every surrounding area—including the work brief—
      // free to scroll naturally.
      if (isInsideOrbit) event.preventDefault();
    };

    // A native, non-passive listener guarantees preventDefault takes effect
    // only where the orbit needs to retain wheel input.
    stage.addEventListener('wheel', handleOrbitWheel, { passive: false });
    return () => stage.removeEventListener('wheel', handleOrbitWheel);
  }, [isActive]);

  const orbitRadiusX = isMobile
    ? activeExperience ? 72 : 94
    : activeExperience ? 150 : 230;
  const orbitRadiusY = isMobile
    ? activeExperience ? 52 : 70
    : activeExperience ? 116 : 152;

  return (
    <section
      id="experience"
      className={styles.experienceSection}
      aria-labelledby="experience-title"
      aria-hidden={!isActive}
      inert={!isActive || undefined}
    >
      <div
        className={`${styles.experienceSurface} ${isRevealed ? styles.experienceSurfaceRevealed : ''} ${isGlobeHandoff ? styles.experienceSurfaceTransitioning : ''} ${activeExperience ? styles.experienceSurfaceWithBrief : ''}`}
        onClick={activeExperience ? () => closeBrief() : undefined}
      >
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>05 / EXPERIENCE ORBIT</p>
            <h2 id="experience-title" className={styles.sectionTitle}>Work, mapped to impact.</h2>
            <p className={styles.sectionIntro}>
              Select a role in orbit to lock the globe onto its work location. Its brief opens on demand.
            </p>
          </div>
          <p className={styles.orbitStatus} aria-live="polite">
            {activeExperience ? `Brief open: ${activeExperience.location}` : 'Orbit active'}
          </p>
        </header>

        <div className={styles.explorer}>
          <div
            ref={orbitStageRef}
            className={styles.orbitStage}
            role="region"
            aria-label="Orbiting professional experience tiles"
            aria-describedby="experience-orbit-hint"
          >
            <p id="experience-orbit-hint" className={styles.screenReaderOnly}>
              The role tiles rotate until one is selected. Selecting a tile opens its work brief; dismiss the brief to resume the orbit.
            </p>

            <div className={styles.orbitReadout} aria-hidden="true">
              <span className={styles.readoutDot} />
              <span>{activeExperience ? activeExperience.globeLocation.label : 'SELECT A ROLE TILE'}</span>
            </div>

            <div
              className={styles.globeFrame}
              aria-hidden="true"
              style={isGlobeHandoff ? {
                opacity: globeHandoffOpacity,
                transform: `translate(-50%, -50%) translateX(${handoffOffset.toFixed(1)}px) scale(${globeScale})`,
              } : undefined}
            >
              <CyberneticGlobe3D
                rotationAngle={0}
                isAnimating={isActive || isGlobeHandoff}
                activeProjectIndex={activeIndex ?? 0}
                totalProjects={total}
                activeProjectTitle={activeExperience ? `${activeExperience.organization} // ${activeExperience.location}` : 'AWAITING SELECTION'}
                systemTag={activeExperience ? `LOCATION LOCK // ${activeExperience.globeLocation.label}` : 'EARTH CORE // EXPERIENCE ORBIT'}
                unitLabel="ROLE"
                showLandmass
                landmassOpacity={landmassOpacity}
                focusLocation={activeExperience?.globeLocation}
              />
            </div>

            {EXPERIENCE.map((item, index) => {
              const angle = ((orbitAngle + index * 180) * Math.PI) / 180;
              const x = Math.cos(angle) * orbitRadiusX;
              const y = Math.sin(angle) * orbitRadiusY;
              const depth = (Math.sin(angle) + 1) / 2;
              const scale = 0.86 + depth * 0.14;
              const isSelected = activeIndex === index;

              return (
                <button
                  key={item.id}
                  ref={(element) => { tileRefs.current[index] = element; }}
                  type="button"
                  className={styles.experienceTile}
                  style={{
                    transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
                    zIndex: Math.round(depth * 20) + (isSelected ? 30 : 0),
                  }}
                  aria-pressed={isSelected}
                  aria-label={`View ${item.organization}, ${item.role}, ${item.location}, ${item.period}`}
                  onClick={(event) => {
                    // The surface click is reserved for dismissing a brief. A role tile
                    // must instead remain in the selected state and swap the brief.
                    event.stopPropagation();
                    selectExperience(index);
                  }}
                  onKeyDown={(event) => handleTileKeyDown(event, index)}
                >
                  <span className={styles.tileCompany}>{item.organization}</span>
                  <span className={styles.tileRole}>{item.role}</span>
                  <span className={styles.tileLocation}>{item.location}</span>
                  <span className={styles.tilePeriod}>{item.period}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeExperience && (
          <div className={styles.detailBackdrop} onClick={() => closeBrief()}>
            <article
              className={`${styles.detailsPanel} ${isBriefClosing ? styles.detailsPanelClosing : ''}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${activeExperience.id}-title`}
              aria-describedby={`${activeExperience.id}-summary`}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.closeBriefButton}
                onClick={() => closeBrief()}
                autoFocus
                aria-label="Close work brief and resume the experience orbit"
              >
                <X size={16} aria-hidden="true" />
                <span>Resume orbit</span>
              </button>

              <header className={styles.roleHeader}>
                <div>
                  <p className={styles.organization}>{activeExperience.organization}</p>
                  <h3 id={`${activeExperience.id}-title`} className={styles.roleTitle}>{activeExperience.role}</h3>
                </div>
                <dl className={styles.metaList}>
                  <div className={styles.metaItem}>
                    <dt><Calendar size={14} aria-hidden="true" /> Duration</dt>
                    <dd>{activeExperience.period}</dd>
                  </div>
                  <div className={styles.metaItem}>
                    <dt><MapPin size={14} aria-hidden="true" /> Location</dt>
                    <dd>{activeExperience.location}</dd>
                  </div>
                </dl>
              </header>

              <p id={`${activeExperience.id}-summary`} className={styles.summaryText}>{activeExperience.summary}</p>

              <section aria-labelledby={`${activeExperience.id}-highlights`}>
                <h4 id={`${activeExperience.id}-highlights`} className={styles.detailsHeading}>Work highlights</h4>
                <ul className={styles.achievementsList}>
                  {activeExperience.achievements.map((achievement) => (
                    <li key={achievement} className={styles.achievementItem}>
                      <CheckCircle size={15} className={styles.checkIcon} aria-hidden="true" />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {activeExperience.technologies.length > 0 && (
                <section aria-labelledby={`${activeExperience.id}-tools`}>
                  <h4 id={`${activeExperience.id}-tools`} className={styles.detailsHeading}>Tools used</h4>
                  <ul className={styles.techStack}>
                    {activeExperience.technologies.map((technology) => (
                      <li key={technology} className={styles.techChip}>{technology}</li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          </div>
        )}
      </div>
    </section>
  );
};
