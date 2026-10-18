import React, { useEffect, useRef } from 'react';
import { scrambleText } from '../animations/interactions';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  number: string;
  tag: string;
  title: string;
  highlightWord?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  id?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  number,
  tag,
  title,
  highlightWord,
  subtitle,
  align = 'left',
  id,
}) => {
  const headingWrapperRef = useRef<HTMLDivElement | null>(null);
  const tagTextRef = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !headingWrapperRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && tagTextRef.current) {
            scrambleText(tagTextRef.current, tag, 750);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(headingWrapperRef.current);

    return () => observer.disconnect();
  }, [tag, reducedMotion]);

  // If highlightWord is provided, split title to wrap that word in gradient-text
  const renderTitle = () => {
    if (!highlightWord) return title;

    const parts = title.split(new RegExp(`(${highlightWord})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlightWord.toLowerCase() ? (
        <span key={index} className="gradient-text">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div
      ref={headingWrapperRef}
      className={`${styles.wrapper} ${styles[align]}`}
      data-reveal
    >
      <span className={styles.watermarkNumber} aria-hidden="true">
        {number}
      </span>

      <div className={styles.tagBadge}>
        <span className={styles.bracket}>[</span>
        <span className={styles.number}>{number}</span>
        <span className={styles.divider}>//</span>
        <span ref={tagTextRef} className={styles.tagText}>
          {tag}
        </span>
        <span className={styles.bracket}>]</span>
      </div>

      <h2 className={styles.heading} id={id}>{renderTitle()}</h2>

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
};
