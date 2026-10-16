import React, { useEffect, useState } from 'react';
import styles from './TimelineScrubber.module.css';

interface TimelineScrubberProps {
  activeSection: string;
}

const SECTIONS = [
  { id: 'hero', label: 'HEADING' },
  { id: 'about', label: 'TOOLBOX' },
  { id: 'skills', label: 'CAPABILITIES' },
  { id: 'projects', label: 'SYSTEMS' },
  { id: 'experience', label: 'TIMELINE' },
  { id: 'contact', label: 'UPLINK' },
];

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ activeSection }) => {
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        setScrollPercent(Math.min(Math.max((window.scrollY / maxScroll) * 100, 0), 100));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeLabel =
    SECTIONS.find((s) => s.id === activeSection)?.label || 'HEADING';

  return (
    <div className={styles.scrubberWrapper} title={`Active Chapter: ${activeLabel}`}>
      <span className={styles.activeLabel}>{activeLabel}</span>

      <div className={styles.scrubberTrack}>
        {/* Tick lines */}
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className={`${styles.tick} ${i % 6 === 0 ? styles.majorTick : ''}`}
          />
        ))}

        {/* Sliding Red Needle Indicator */}
        <span
          className={styles.redNeedle}
          style={{ left: `${scrollPercent}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
