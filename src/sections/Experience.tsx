import React, { useEffect, useRef } from 'react';
import { Calendar, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { EXPERIENCE } from '../data/portfolio';
import { SectionHeading } from '../components/SectionHeading';
import { setupScrollReveal } from '../animations/scroll';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './Experience.module.css';

export const Experience: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const cleanup = setupScrollReveal(sectionRef.current, {
      threshold: 0.1,
      reducedMotion,
    });
    return () => cleanup();
  }, [reducedMotion]);

  return (
    <section id="experience" ref={sectionRef} className="section-wrapper" aria-labelledby="experience-title">
      <div className="container">
        <SectionHeading
          number="05"
          tag="WORK HISTORY & IMPACT"
          title="PROFESSIONAL EXPERIENCE & TIMELINE"
          highlightWord="TIMELINE"
          subtitle="Engineering autonomous multi-agent pipelines, developer suites, and modern client-side architectures."
        />

        <div className={styles.timelineWrapper}>
          <div className={styles.timelineTrack} aria-hidden="true" />

          <div className={styles.entriesList}>
            {EXPERIENCE.map((item, index) => (
              <div key={item.id} className={styles.timelineEntry} data-reveal>
                {/* Node beacon on the track */}
                <div className={styles.timelineBeacon} aria-hidden="true">
                  <div className={styles.beaconInner} />
                </div>

                <div className={`glass-panel ${styles.entryCard}`}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.roleHeader}>
                        <h3 className={styles.roleTitle}>{item.role}</h3>
                        <span className={styles.orgBadge}>@{item.organization}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaItem}>
                          <Calendar size={13} /> {item.period}
                        </span>
                        <span className={styles.metaItem}>
                          <MapPin size={13} /> {item.location}
                        </span>
                      </div>
                    </div>
                    <span className={styles.stepNumber}>0{index + 1}</span>
                  </div>

                  <p className={styles.summaryText}>{item.summary}</p>

                  <div className={styles.achievementsBox}>
                    <span className={styles.achievementsHeading}>
                      <ArrowRight size={13} className={styles.arrowIcon} /> KEY RESPONSIBILITIES & HIGHLIGHTS
                    </span>
                    <ul className={styles.achievementsList}>
                      {item.achievements.map((ach, i) => (
                        <li key={i} className={styles.achievementItem}>
                          <CheckCircle size={14} className={styles.checkIcon} />
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.techStack}>
                    {item.technologies.map((tech) => (
                      <span key={tech} className={styles.techChip}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
