import React, { useEffect, useRef, useState } from 'react';
import { SKILL_CATEGORIES } from '../data/portfolio';
import { SectionHeading } from '../components/SectionHeading';
import { setupScrollReveal } from '../animations/scroll';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './Skills.module.css';

export const Skills: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const cleanup = setupScrollReveal(sectionRef.current, {
      threshold: 0.1,
      reducedMotion,
    });
    return () => cleanup();
  }, [reducedMotion]);

  const displayedCategories =
    activeTab === 'all'
      ? SKILL_CATEGORIES
      : SKILL_CATEGORIES.filter((c) => c.id === activeTab);

  return (
    <section id="skills" ref={sectionRef} className="section-wrapper" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeading
          number="03"
          tag="CAPABILITIES & STACK"
          title="ENGINEERING CAPABILITIES & TECHNICAL TOOLKIT"
          highlightWord="TOOLKIT"
          subtitle="Organized across frontier AI models, full-stack web frameworks, scalable backends, and low-latency cloud infrastructure."
        />

        {/* Category Filter Pills */}
        <div className={styles.filterBar} role="tablist" aria-label="Filter skill categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`${styles.filterPill} ${activeTab === 'all' ? styles.active : ''}`}
            onClick={() => setActiveTab('all')}
          >
            [ ALL DOMAINS ]
          </button>
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeTab === cat.id}
              className={`${styles.filterPill} ${activeTab === cat.id ? styles.active : ''}`}
              onClick={() => setActiveTab(cat.id)}
            >
              {cat.title.split('&')[0].trim().toUpperCase()}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className={styles.grid}>
          {displayedCategories.map((category) => (
            <div
              key={category.id}
              className={`glass-panel ${styles.categoryCard}`}
              data-reveal
            >
              <div className={styles.cardHeader}>
                <div className={styles.categoryBadgeWrapper}>
                  <span className={styles.categoryIndex}>SYS.CAT</span>
                </div>
                <h3 className={styles.categoryTitle}>{category.title}</h3>
                <p className={styles.categoryDesc}>{category.description}</p>
              </div>

              <div className={styles.skillChips}>
                {category.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className={`${styles.skillTag} ${skill.highlight ? styles.highlighted : ''}`}
                  >
                    {skill.highlight && <span className={styles.highlightDot} aria-hidden="true" />}
                    <span>{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
