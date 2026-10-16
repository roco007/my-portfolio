import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, Copy, Check, Terminal, Sparkles } from 'lucide-react';
import { PERSONAL_INFO } from '../data/portfolio';
import { AnimeOscilloscope } from '../components/AnimeOscilloscope';
import { playHeroEntrance } from '../animations/entrance';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './Hero.module.css';

interface HeroProps {
  onOpenTerminal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenTerminal }) => {
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState<boolean>(false);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const telemetryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeline = playHeroEntrance(
      {
        badge: badgeRef.current,
        titleLines: titleRef.current ? [titleRef.current] : [],
        subtitle: subtitleRef.current,
        actions: actionsRef.current,
        telemetry: telemetryRef.current,
      },
      reducedMotion
    );

    return () => {
      if (timeline) timeline.revert();
    };
  }, [reducedMotion]);

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText('npx roco007');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const scrollToProjects = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className={styles.heroSection} aria-labelledby="hero-title">
      <div className={`container ${styles.container}`}>
        <div className={styles.heroGrid}>
          {/* Left Column: Headline, Bio, and Action Pills */}
          <div className={styles.heroContent}>
            {/* Version / Status Badge */}
            <div ref={badgeRef} className={styles.badgeWrapper}>
              <span className={styles.statusPill}>
                <span className={styles.statusDot} />
                <span>v2.0 // FULL-STACK ENGINEER &amp; AI ARCHITECT</span>
              </span>
            </div>

            {/* Massive Bold Headline matching animejs.com */}
            <h1 id="hero-title" ref={titleRef} className={styles.headline}>
              <span className={styles.headlineLine}>Architecting</span>
              <span className={styles.headlineLine}>intelligent</span>
              <span className={styles.headlineLineHighlight}>systems.</span>
            </h1>

            {/* Subtitle */}
            <p ref={subtitleRef} className={styles.subtitle}>
              {PERSONAL_INFO.role} based in {PERSONAL_INFO.location}. Building
              production-grade multi-agent evaluation frameworks, privacy-first developer
              suites, and high-performance interactive web experiences.
            </p>

            {/* Bottom Actions Row matching animejs.com */}
            <div ref={actionsRef} className={styles.actions}>
              {/* Monospace Copy Command Pill */}
              <button
                type="button"
                className={styles.copyCommandBtn}
                onClick={handleCopyCommand}
                title="Copy developer command to clipboard"
                aria-label="Copy npx roco007 CLI command"
              >
                <span className={styles.commandPrompt}>$</span>
                <span className={styles.commandText}>npx roco007</span>
                <span className={styles.copyIconWrapper}>
                  {copied ? (
                    <span className={styles.copiedBadge}>
                      <Check size={13} /> COPIED
                    </span>
                  ) : (
                    <Copy size={13} className={styles.copyIcon} />
                  )}
                </span>
              </button>

              {/* Explore Work Button */}
              <a
                href="#projects"
                onClick={scrollToProjects}
                className={styles.exploreBtn}
              >
                <span>EXPLORE WORK</span>
                <ArrowDown size={14} className={styles.downArrow} />
              </a>

              {/* Developer Terminal Trigger */}
              <button
                type="button"
                className={styles.terminalCtaBtn}
                onClick={onOpenTerminal}
                title="Launch Developer CLI (Ctrl + `)"
              >
                <Terminal size={14} />
                <span>CLI &gt;_</span>
              </button>
            </div>
          </div>

          {/* Right Column: Iconic Anime.js Oscilloscope Gauge */}
          <div ref={visualRef} className={styles.heroVisual}>
            <div className={styles.oscilloscopeContainer}>
              <AnimeOscilloscope />
              <div className={styles.visualHint}>
                <Sparkles size={12} className={styles.hintIcon} />
                <span>INTERACTIVE ENGINE // CLICK TO CYCLE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Bar matching Anime.js clean metadata */}
        <div ref={telemetryRef} className={styles.telemetryBar}>
          <div className={styles.telemetryPill}>
            <span className={`${styles.telemetryDot} ${styles.dotLime}`} />
            <span className={styles.telemetryKey}>STATUS</span>
            <span className={styles.telemetryVal}>ONLINE // AVAILABLE FOR HIRE</span>
          </div>

          <div className={styles.telemetryDivider} />

          <div className={styles.telemetryPill}>
            <span className={`${styles.telemetryDot} ${styles.dotTurquoise}`} />
            <span className={styles.telemetryKey}>SYSTEMS</span>
            <span className={styles.telemetryVal}>4 PRODUCTION BENCHMARKS</span>
          </div>

          <div className={styles.telemetryDivider} />

          <div className={styles.telemetryPill}>
            <span className={`${styles.telemetryDot} ${styles.dotSega}`} />
            <span className={styles.telemetryKey}>STACK</span>
            <span className={styles.telemetryVal}>TYPESCRIPT // REACT 19 // LLMS</span>
          </div>

          <div className={styles.telemetryDivider} />

          <div className={styles.telemetryPill}>
            <span className={`${styles.telemetryDot} ${styles.dotRed}`} />
            <span className={styles.telemetryKey}>ENGINE</span>
            <span className={styles.telemetryVal}>ANIME.JS v4 POWERED</span>
          </div>
        </div>
      </div>
    </section>
  );
};
