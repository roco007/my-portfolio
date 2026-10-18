import React, { useEffect, useState } from 'react';
import { getNearestStoryChapter } from '../data/storyChapters';
import styles from './TimelineScrubber.module.css';

interface TimelineScrubberProps {
  activeSection: string;
  onScrub?: (percent: number) => void;
}

const SECTIONS = [
  { id: 'hero', label: 'HEADING' },
  { id: 'about', label: 'ARCHITECTURE' },
  { id: 'skills', label: 'TOOLBOX' },
  { id: 'projects', label: 'SYSTEMS' },
  { id: 'experience', label: 'TIMELINE' },
  { id: 'contact', label: 'UPLINK' },
];

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  activeSection,
  onScrub,
}) => {
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

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(Math.max(clickX / rect.width, 0), 1);
    const chapter = getNearestStoryChapter(ratio);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: chapter.target * maxScroll,
      behavior: 'smooth',
    });
    onScrub?.(chapter.target * 100);
  };

  const activeLabel =
    SECTIONS.find((s) => s.id === activeSection || s.label === activeSection)?.label ||
    activeSection ||
    'HEADING';

  return (
    <div className={styles.scrubberWrapper} title={`Active Chapter: ${activeLabel} // Click to scrub`}>
      <span className={styles.activeLabel}>{activeLabel}</span>

      <div
        className={styles.scrubberTrack}
        onClick={handleTrackClick}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollPercent)}
        aria-label="Timeline Scrubber"
        tabIndex={0}
      >
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
