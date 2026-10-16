import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowDown, Copy, Check, Terminal, Play, Mail, Github, Linkedin } from 'lucide-react';
import { PERSONAL_INFO, SOCIAL_LINKS, PROJECTS } from '../data/portfolio';
import { MorphingVisualizer } from './MorphingVisualizer';
import { OrbitalProjectsSolarSystem } from './OrbitalProjectsSolarSystem';
import styles from './PinnedStoryContainer.module.css';

interface PinnedStoryContainerProps {
  onOpenTerminal: () => void;
  onReplayIntro: () => void;
  onProgressChange?: (progress: number, activeChapter: string) => void;
}

export const PinnedStoryContainer: React.FC<PinnedStoryContainerProps> = ({
  onOpenTerminal,
  onReplayIntro,
  onProgressChange,
}) => {
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const [smoothProgress, setSmoothProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const targetProgressRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Rotary disc synchronized state driven by horizontal project cards scroll
  const [discRotationAngle, setDiscRotationAngle] = useState<number>(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState<number>(0);
  const [activeProjectTitle, setActiveProjectTitle] = useState<string>(
    PROJECTS[0]?.title || ''
  );

  const handleProjectRotate = useCallback(
    (angle: number, index: number, title: string) => {
      setDiscRotationAngle(angle);
      setActiveProjectIndex(index);
      setActiveProjectTitle(title);
    },
    []
  );

  // Scroll listener with requestAnimationFrame lerp
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        targetProgressRef.current = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Lerp loop for buttery 120fps motion
    let current = targetProgressRef.current;
    const updateProgress = () => {
      const target = targetProgressRef.current;
      current += (target - current) * 0.14; // smooth lerp factor

      // Snap if close
      if (Math.abs(target - current) < 0.0005) {
        current = target;
      }

      setSmoothProgress(current);

      // Determine active chapter
      let chapter = 'HEADING';
      if (current > 0.22 && current <= 0.45) chapter = 'ARCHITECTURE';
      else if (current > 0.45 && current <= 0.70) chapter = 'TOOLBOX';
      else if (current > 0.70 && current <= 0.88) chapter = 'SYSTEMS';
      else if (current > 0.88) chapter = 'UPLINK';

      onProgressChange?.(current, chapter);

      rafIdRef.current = requestAnimationFrame(updateProgress);
    };

    rafIdRef.current = requestAnimationFrame(updateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [onProgressChange]);

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText('npx roco007');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const scrollToProgress = (ratio: number) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: ratio * maxScroll,
      behavior: 'smooth',
    });
  };

  // --------------------------------------------------------------------------
  // Clean, Non-Ghosting Chapter Transitions
  // Each chapter has a dedicated zone with directional translateY entrance/exit
  // --------------------------------------------------------------------------
  const p = smoothProgress;

  // Chapter 0: [0.00, 0.20]
  const op0 = p <= 0.16 ? 1 : p <= 0.20 ? Math.max(0, 1 - (p - 0.16) / 0.04) : 0;
  const ty0 = p <= 0.16 ? 0 : -((p - 0.16) / 0.04) * 35;

  // Chapter 1: [0.20, 0.42]
  const op1 = p < 0.20 || p > 0.42 ? 0 : p < 0.24 ? (p - 0.20) / 0.04 : p > 0.38 ? (0.42 - p) / 0.04 : 1;
  const ty1 = p < 0.24 ? (1 - (p - 0.20) / 0.04) * 35 : p > 0.38 ? -((p - 0.38) / 0.04) * 35 : 0;

  // Chapter 2: [0.42, 0.66]
  const op2 = p < 0.42 || p > 0.66 ? 0 : p < 0.46 ? (p - 0.42) / 0.04 : p > 0.62 ? (0.66 - p) / 0.04 : 1;
  const ty2 = p < 0.46 ? (1 - (p - 0.42) / 0.04) * 35 : p > 0.62 ? -((p - 0.62) / 0.04) * 35 : 0;

  // Chapter 3: [0.66, 0.88]
  const op3 = p < 0.66 || p > 0.88 ? 0 : p < 0.70 ? (p - 0.66) / 0.04 : p > 0.84 ? (0.88 - p) / 0.04 : 1;
  const ty3 = p < 0.70 ? (1 - (p - 0.66) / 0.04) * 35 : p > 0.84 ? -((p - 0.84) / 0.04) * 35 : 0;

  // Chapter 4: [0.88, 1.00]
  const op4 = p < 0.88 ? 0 : Math.min((p - 0.88) / 0.04, 1);
  const ty4 = p < 0.92 ? (1 - Math.min((p - 0.88) / 0.04, 1)) * 35 : 0;

  return (
    <div ref={scrollTrackRef} className={styles.scrollTrack} id="story-track">
      <div className={styles.stickyViewport}>
        <div className={styles.storyContainer}>
          {/* Left Column: Cross-Fading Chapter Content */}
          <div className={styles.leftColumn}>
            {/* -----------------------------------------------------------
                CHAPTER 0: HEADING // Core Systems Architect
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              style={{
                opacity: op0,
                pointerEvents: op0 > 0.4 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty0.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={styles.statusDot} />
                  <span>v2.0 // FULL-STACK ENGINEER &amp; AI ARCHITECT</span>
                </span>
              </div>

              <h1 className={styles.headline}>
                <span>Architecting</span>
                <br />
                <span>intelligent</span>
                <span className={styles.headlineLineHighlight}>systems.</span>
              </h1>

              <p className={styles.subtitle}>
                {PERSONAL_INFO.role} based in {PERSONAL_INFO.location}. Building
                production-grade multi-agent evaluation frameworks, privacy-first developer
                suites, and high-performance interactive web experiences.
              </p>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.copyCommandBtn}
                  onClick={handleCopyCommand}
                  title="Copy developer command to clipboard"
                  aria-label="Copy npx roco007 CLI command"
                >
                  <span className={styles.commandPrompt}>$</span>
                  <span>npx roco007</span>
                  {copied ? (
                    <span style={{ color: '#00ffaa', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                      <Check size={13} /> COPIED
                    </span>
                  ) : (
                    <Copy size={13} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => scrollToProgress(0.52)}
                  className={styles.exploreBtn}
                >
                  <span>EXPLORE ENGINE</span>
                  <ArrowDown size={14} />
                </button>

                <button
                  type="button"
                  className={styles.terminalBtn}
                  onClick={onOpenTerminal}
                  title="Launch Developer CLI (Ctrl + `)"
                >
                  <Terminal size={14} />
                  <span>CLI &gt;_</span>
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 1: ARCHITECTURE // 3D Extrusion
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              style={{
                opacity: op1,
                pointerEvents: op1 > 0.4 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty1.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={`${styles.statusDot} ${styles.statusDotGreen}`} />
                  <span>01 // THE CORE ENGINE</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>The Core AI &amp;</span>
                <br />
                <span className={styles.headlineLineHighlight}>Edge Engine.</span>
              </h2>

              <p className={styles.subtitle}>
                Engineered for sub-millisecond execution, event-driven streaming, and
                distributed edge computing. Powered by Cloudflare Workers, Durable Objects,
                and low-latency vector embeddings.
              </p>

              <div className={styles.metricRow}>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>12,400+</span>
                  <span className={styles.metricKey}>Ops / Sec</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>&lt; 15ms</span>
                  <span className={styles.metricKey}>p99 Edge Latency</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>300+</span>
                  <span className={styles.metricKey}>Global Edge Nodes</span>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => scrollToProgress(0.52)}
                  className={styles.exploreBtn}
                >
                  <span>VIEW TOOLBOX</span>
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 2: TOOLBOX // Exploded Assembly
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              style={{
                opacity: op2,
                pointerEvents: op2 > 0.4 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty2.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={`${styles.statusDot} ${styles.statusDotCyan}`} />
                  <span>02 // THE COMPLETE TOOLBOX</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>The complete</span>
                <br />
                <span className={styles.headlineLineHighlight}>engineering toolbox.</span>
              </h2>

              <p className={styles.subtitle}>
                Break free from monolithic constraints and animate the future of autonomous
                software. High-precision AST compiler logic, typed micro-architectures, and
                distributed agent swarms.
              </p>

              <div className={styles.capabilityGrid}>
                {[
                  'Multi-Agent Orchestration',
                  'Cloudflare Workers & DO',
                  'AST Syntax Analysis',
                  'TypeScript & React 19',
                  'Vector RAG Embeddings',
                  'Sub-Millisecond WebGL',
                ].map((cap) => (
                  <div key={cap} className={styles.capabilityPill}>
                    <span className={styles.pillDot} />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => scrollToProgress(0.76)}
                  className={styles.exploreBtn}
                >
                  <span>SEE PRODUCTION SYSTEMS</span>
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 3: SYSTEMS // Planetary Orbit & Core Engine
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              style={{
                opacity: op3,
                pointerEvents: op3 > 0.4 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty3.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={styles.statusDot} />
                  <span>03 // PLANETARY ORBIT // {activeProjectTitle.toUpperCase()}</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>Deployed systems</span>
                <br />
                <span className={styles.headlineLineHighlight}>that scale.</span>
              </h2>

              <p className={styles.subtitle}>
                14 battle-tested production units revolving around the central AI engine like planets around the sun. Scroll horizontally or drag to orbit through systems and inspect live architectures.
              </p>

              <div className={`${styles.metricRow} ${styles.desktopOnlyMetricRow}`}>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>UNIT {String(activeProjectIndex + 1).padStart(2, '0')}</span>
                  <span className={styles.metricKey}>Active Focus</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>{Math.round(((discRotationAngle % 360) + 360) % 360)}&deg;</span>
                  <span className={styles.metricKey}>Core Angle</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricVal}>14</span>
                  <span className={styles.metricKey}>Total Planets</span>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => scrollToProgress(0.95)}
                  className={styles.exploreBtn}
                >
                  <span>OPEN UPLINK</span>
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className={styles.terminalBtn}
                  onClick={onOpenTerminal}
                >
                  <Terminal size={14} />
                  <span>VIEW SYS LOGS</span>
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------
                CHAPTER 4: UPLINK // Motion Lab & Direct Channel
                ----------------------------------------------------------- */}
            <div
              className={styles.chapterPanel}
              style={{
                opacity: op4,
                pointerEvents: op4 > 0.4 ? 'auto' : 'none',
                transform: `translateY(calc(-50% + ${ty4.toFixed(1)}px))`,
              }}
            >
              <div className={styles.badgeWrapper}>
                <span className={styles.statusPill}>
                  <span className={`${styles.statusDot} ${styles.statusDotGreen}`} />
                  <span>04 // DIRECT CHANNEL</span>
                </span>
              </div>

              <h2 className={styles.headline}>
                <span>Initiate an</span>
                <br />
                <span className={styles.headlineLineHighlight}>uplink.</span>
              </h2>

              <p className={styles.subtitle}>
                Available for staff/lead engineering roles, autonomous AI systems
                architecture, and high-impact distributed web software.
              </p>

              <div className={styles.actionsRow}>
                <a
                  href={`mailto:${PERSONAL_INFO.email}`}
                  className={styles.exploreBtn}
                >
                  <Mail size={14} />
                  <span>SEND TRANSMISSION</span>
                </a>

                <a
                  href={SOCIAL_LINKS.find((s) => s.platform === 'github')?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.terminalBtn}
                >
                  <Github size={14} />
                  <span>GITHUB</span>
                </a>

                <a
                  href={SOCIAL_LINKS.find((s) => s.platform === 'linkedin')?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.terminalBtn}
                >
                  <Linkedin size={14} />
                  <span>LINKEDIN</span>
                </a>

                <button
                  type="button"
                  onClick={onReplayIntro}
                  className={styles.replayIntroBtn}
                  title="Replay the welcome intro animation"
                >
                  <Play size={12} />
                  <span>REPLAY INTRO</span>
                </button>
              </div>

              <div className={styles.colophonLine}>
                <span>&copy; {new Date().getFullYear()} Raj Colaco</span>
                <span className={styles.colophonDivider}>//</span>
                <span>ENGINEERED WITH REACT 19 &amp; ANIME.JS v4</span>
                <span className={styles.colophonDivider}>//</span>
                <span className={styles.colophonStatus}>SYS.ONLINE</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Transforming Visualizer & Chapter 3 Horizontal Deck */}
          <div className={styles.rightColumn}>
            <div
              className={styles.visualizerLayer}
              style={{
                opacity: Math.max(0, 1 - op3 * 1.5),
                pointerEvents: op3 > 0.4 ? 'none' : 'auto',
              }}
            >
              <MorphingVisualizer
                progress={smoothProgress}
                onOpenTerminal={onOpenTerminal}
              />
            </div>

            <div
              className={styles.horizontalDeckLayer}
              style={{
                opacity: op3,
                pointerEvents: op3 > 0.4 ? 'auto' : 'none',
                transform: `translateY(${(1 - op3) * 20}px)`,
              }}
            >
              <OrbitalProjectsSolarSystem onRotate={handleProjectRotate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
