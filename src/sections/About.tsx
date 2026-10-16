import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Zap, Bot, Terminal, MapPin, Laptop } from 'lucide-react';
import { PERSONAL_INFO } from '../data/portfolio';
import { SectionHeading } from '../components/SectionHeading';
import { setupScrollReveal } from '../animations/scroll';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './About.module.css';

export const About: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const cleanup = setupScrollReveal(sectionRef.current, {
      threshold: 0.1,
      reducedMotion,
    });
    return () => cleanup();
  }, [reducedMotion]);

  const pillars = [
    {
      icon: <Bot size={20} className={styles.pillarIcon} />,
      title: 'Autonomous Multi-Agent AI',
      desc: 'Architecting evaluators, debate chains, and LLM code reasoning pipelines using Gemini 2.5/3.5 models and AST validation.',
    },
    {
      icon: <ShieldCheck size={20} className={styles.pillarIcon} />,
      title: 'Offline-First & Zero Tracking',
      desc: 'Building client-side developer utilities that process code locally in the browser with no server roundtrips or privacy leakage.',
    },
    {
      icon: <Zap size={20} className={styles.pillarIcon} />,
      title: 'Tactile Motion & Performance',
      desc: 'Crafting responsive microinteractions and fluid transitions with Anime.js, prioritizing zero layout shift and 60fps animations.',
    },
  ];

  return (
    <section id="about" ref={sectionRef} className="section-wrapper" aria-labelledby="about-title">
      <div className="container">
        <SectionHeading
          number="02"
          tag="BIOGRAPHY & SYSTEMS ARCHITECTURE"
          title="BRIDGING GENERATIVE INTELLIGENCE & HIGH-PERFORMANCE WEB ENGINEERING"
          highlightWord="INTELLIGENCE"
          subtitle="Deliberate systems engineering, privacy-conscious tooling, and production-grade developer software."
        />

        <div className={styles.gridLayout}>
          {/* Left Column: Editorial Biography */}
          <div className={styles.bioColumn} data-reveal>
            <div className={styles.leadParagraph}>
              {PERSONAL_INFO.bio[0]}
            </div>

            <p className={styles.paragraph}>{PERSONAL_INFO.bio[1]}</p>
            <p className={styles.paragraph}>{PERSONAL_INFO.bio[2]}</p>

            {/* Three Engineering Pillars */}
            <div className={styles.pillarsList}>
              {pillars.map((pillar, i) => (
                <div key={i} className={`glass-panel ${styles.pillarCard}`}>
                  <div className={styles.pillarHeader}>
                    {pillar.icon}
                    <h4 className={styles.pillarTitle}>{pillar.title}</h4>
                  </div>
                  <p className={styles.pillarDesc}>{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Technical Telemetry & Specifications Card */}
          <div className={styles.specColumn} data-reveal>
            <div className={`glass-panel ${styles.specCard}`}>
              <div className={styles.specCardHeader}>
                <div className={styles.terminalDot} />
                <span className={styles.specHeaderTitle}>SYSTEM.SPECIFICATION // RAJ COLACO</span>
              </div>

              <div className={styles.specBody}>
                <div className={styles.specItem}>
                  <div className={styles.specLabel}>
                    <MapPin size={15} /> PRIMARY LOCATION
                  </div>
                  <div className={styles.specValue}>{PERSONAL_INFO.location}</div>
                </div>

                <div className={styles.specDivider} />

                <div className={styles.specItem}>
                  <div className={styles.specLabel}>
                    <Laptop size={15} /> ENGINEERING ROLE
                  </div>
                  <div className={styles.specValue}>{PERSONAL_INFO.role}</div>
                </div>

                <div className={styles.specDivider} />

                <div className={styles.specItem}>
                  <div className={styles.specLabel}>
                    <Terminal size={15} /> ACTIVE OPEN SOURCE CODEBASES
                  </div>
                  <div className={styles.specValue}>
                    {PERSONAL_INFO.stats.openSourceRepos} Repositories on GitHub
                  </div>
                </div>

                <div className={styles.specDivider} />

                <div className={styles.specItem}>
                  <div className={styles.specLabel}>
                    <Bot size={15} /> CORE AI ARCHITECTURES
                  </div>
                  <div className={styles.specValue}>
                    Gemini 2.5/3.5, Multi-Agent Panels, AST Code Synthesis, RAG
                  </div>
                </div>

                <div className={styles.specDivider} />

                <div className={styles.specItem}>
                  <div className={styles.specLabel}>
                    <Zap size={15} /> PERFORMANCE PROFILE
                  </div>
                  <div className={styles.specValue}>
                    Sub-100ms Interactions, WCAG AA, Anime.js 4 Choreography
                  </div>
                </div>
              </div>

              <div className={styles.specFooter}>
                <span className={styles.footerCode}>SHA256: 8a4c...e901 [VERIFIED_ENGINEER]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
