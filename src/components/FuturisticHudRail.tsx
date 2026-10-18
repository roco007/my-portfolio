import React, { useEffect, useState, useRef } from 'react';
import { Crosshair, Radio } from 'lucide-react';
import styles from './FuturisticHudRail.module.css';

interface SectionMarker {
  id: string;
  code: string;
  label: string;
}

const SECTIONS: SectionMarker[] = [
  { id: 'hero', code: '00', label: 'CORE' },
  { id: 'about', code: '01', label: 'PROFILE' },
  { id: 'skills', code: '02', label: 'CAPABILITIES' },
  { id: 'projects', code: '03', label: 'SYSTEMS' },
  { id: 'experience', code: '04', label: 'TIMELINE' },
  { id: 'contact', code: '05', label: 'UPLINK' },
];

export const FuturisticHudRail: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [scrollVelocity, setScrollVelocity] = useState<number>(0);
  const lastScrollY = useRef<number>(0);
  const velocityTimer = useRef<number | null>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 1. Calculate scroll progress percentage
          if (totalHeight > 0) {
            const percent = Math.min(Math.max((currentScrollY / totalHeight) * 100, 0), 100);
            setScrollProgress(percent);
          }

          // 2. Measure kinetic scroll velocity for dynamic frequency bars
          const delta = Math.abs(currentScrollY - lastScrollY.current);
          lastScrollY.current = currentScrollY;
          setScrollVelocity(Math.min(delta * 1.5, 100));

          if (velocityTimer.current) window.clearTimeout(velocityTimer.current);
          velocityTimer.current = window.setTimeout(() => {
            setScrollVelocity(0);
          }, 150);

          // 3. Determine active sector
          for (let i = SECTIONS.length - 1; i >= 0; i--) {
            const el = document.getElementById(SECTIONS[i].id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= window.innerHeight * 0.4) {
                setActiveSection(SECTIONS[i].id);
                break;
              }
            }
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (velocityTimer.current) window.clearTimeout(velocityTimer.current);
    };
  }, []);

  const SECTOR_TARGETS: Record<string, number> = {
    hero: 0,
    about: 0.25,
    skills: 0.52,
    projects: 0.76,
    experience: 0.82,
    contact: 0.95,
  };

  const scrollToSector = (id: string) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (SECTOR_TARGETS[id] !== undefined) {
      window.scrollTo({ top: SECTOR_TARGETS[id] * maxScroll, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeSector = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <aside className={styles.hudRail} aria-label="Futuristic Scroll Telemetry HUD">
      {/* Top Coordinate Readout */}
      <div className={styles.telemetryHeader}>
        <div className={styles.signalBeacon}>
          <Radio size={11} className={styles.signalIcon} />
          <span className={styles.liveTag}>LIVE_HUD</span>
        </div>
        <div className={styles.sectorReadout}>
          <span className={styles.sectorCode}>SEC_{activeSector.code}</span>
          <span className={styles.sectorLabel}>{activeSector.label}</span>
        </div>
      </div>

      {/* Futuristic Vertical Laser Track */}
      <div className={styles.laserTrackContainer}>
        <div className={styles.laserLine} />

        {/* Gliding Holographic Cursor */}
        <div
          className={styles.hologramCursor}
          style={{ top: `${scrollProgress}%` }}
        >
          <div className={styles.cursorCrosshair}>
            <Crosshair size={12} />
          </div>
          <span className={styles.cursorTooltip}>
            {scrollProgress.toFixed(1)}%
          </span>
        </div>

        {/* Section Sector Nodes */}
        <div className={styles.nodeList}>
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`${styles.nodeBtn} ${isActive ? styles.nodeActive : ''}`}
                onClick={() => scrollToSector(sec.id)}
                title={`Warp scroll to ${sec.label}`}
                aria-label={`Scroll to ${sec.label}`}
              >
                <span className={styles.nodePip} />
                <span className={styles.nodeHoverTag}>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kinetic Velocity Frequency Visualizer */}
      <div className={styles.velocityEqualizer} title="Scroll Velocity Meter">
        {Array.from({ length: 5 }).map((_, i) => {
          const heightFactor = Math.min(
            Math.max((scrollVelocity / 100) * (1 - i * 0.15) * 18, 3),
            20
          );
          return (
            <span
              key={i}
              className={styles.eqBar}
              style={{
                height: `${heightFactor}px`,
                backgroundColor:
                  scrollVelocity > 50
                    ? 'var(--hex-red-1)'
                    : scrollVelocity > 20
                    ? 'var(--hex-orange-1)'
                    : 'var(--hex-turquoise-1)',
              }}
            />
          );
        })}
      </div>
    </aside>
  );
};
