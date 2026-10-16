import React from 'react';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  number: string;
  tag: string;
  title: string;
  highlightWord?: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  number,
  tag,
  title,
  highlightWord,
  subtitle,
  align = 'left',
}) => {
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
    <div className={`${styles.wrapper} ${styles[align]}`} data-reveal>
      <div className={styles.tagBadge}>
        <span className={styles.bracket}>[</span>
        <span className={styles.number}>{number}</span>
        <span className={styles.divider}>//</span>
        <span className={styles.tagText}>{tag}</span>
        <span className={styles.bracket}>]</span>
      </div>

      <h2 className={styles.heading}>{renderTitle()}</h2>

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
};
