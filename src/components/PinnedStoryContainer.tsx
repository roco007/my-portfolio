import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowDown, Copy, Check, Terminal, Play, Mail, Github, Linkedin, Instagram, ExternalLink } from 'lucide-react';
import { PERSONAL_INFO, SOCIAL_LINKS, PROJECTS, SocialLink } from '../data/portfolio';
import { MorphingVisualizer } from './MorphingVisualizer';
import { OrbitalProjectsSolarSystem } from './OrbitalProjectsSolarSystem';
import { OrbitalSocialSolarSystem } from './OrbitalSocialSolarSystem';
import styles from './PinnedStoryContainer.module.css';

const getSocialIcon = (platform: string) => {
  switch (platform) {
    case 'github':
      return <Github size={13} />;
    case 'linkedin':
      return <Linkedin size={13} />;
    case 'x':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.301-.15-1.782-.88-2.058-.98-.276-.101-.477-.15-.678.15-.2.302-.778.98-.954 1.181-.176.2-.351.226-.653.075-.301-.15-1.272-.469-2.424-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.527-.075-.15-.678-1.632-.929-2.236-.244-.588-.492-.508-.678-.518-.176-.009-.376-.011-.577-.011-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.512 0 1.482 1.079 2.914 1.23 3.115.15.2 2.123 3.242 5.143 4.547.718.311 1.279.497 1.716.636.721.23 1.377.197 1.896.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.125-.276-.2-.577-.35zM12.042 21.928c-1.787 0-3.535-.48-5.07-1.391l-.364-.216-3.768.988 1.006-3.673-.237-.377A9.88 9.88 0 012.16 12.04c0-5.46 4.44-9.9 9.897-9.9 2.645 0 5.131 1.03 6.999 2.902a9.85 9.85 0 012.898 6.998c0 5.462-4.442 9.902-9.912 9.902zm7.07-16.97A9.953 9.953 0 0012.042 2C6.505 2 2 6.506 2 12.042c0 1.77.462 3.498 1.338 5.018L2 22l5.097-1.337a9.99 9.99 0 004.945 1.289h.005c5.536 0 10.042-4.506 10.042-10.042 0-2.684-1.045-5.207-2.977-7.052z"/>
        </svg>
      );
    case 'instagram':
      return <Instagram size={13} />;
    case 'email':
      return <Mail size={13} />;
    default:
      return null;
  }
};

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
  const autoScrollRafRef = useRef<number | null>(null);
  const prevChapterRef = useRef<string>('HEADING');

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

  // Active social channel synchronized state driven by vertical top-to-bottom orbital globe
  const socialChannels = SOCIAL_LINKS.filter((s) => s.platform !== 'email');
  const [activeSocialIndex, setActiveSocialIndex] = useState<number>(0);
  const activeSocialChannel = socialChannels[activeSocialIndex] || socialChannels[0];

  const handleSocialChannelSelect = useCallback((_channel: SocialLink, index: number) => {
    setActiveSocialIndex(index);
  }, []);

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

      if (prevChapterRef.current !== chapter) {
        prevChapterRef.current = chapter;
        onProgressChange?.(current, chapter);
      }

      rafIdRef.current = requestAnimationFrame(updateProgress);
    };

    rafIdRef.current = requestAnimationFrame(updateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
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
    const scrollEl = document.scrollingElement || document.documentElement || document.body;
    const maxScroll = Math.max(0, scrollEl.scrollHeight - window.innerHeight);
    const targetY = Math.max(0, Math.min(ratio * maxScroll, maxScroll));
    const startY = window.scrollY || window.pageYOffset || 0;
    const distance = targetY - startY;

    if (Math.abs(distance) < 4) return;

    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }

    try {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, targetY);
    }

    // High precision rAF easing fallback for mobile touch momentum
    const startTime = performance.now();
    const duration = 650;
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        autoScrollRafRef.current = requestAnimationFrame(animateScroll);
      } else {
        autoScrollRafRef.current = null;
      }
    };

    autoScrollRafRef.current = requestAnimationFrame(animateScroll);
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
                pointerEvents: op0 > 0.1 ? 'auto' : 'none',
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
                pointerEvents: op1 > 0.1 ? 'auto' : 'none',
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
                pointerEvents: op2 > 0.1 ? 'auto' : 'none',
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
                pointerEvents: op3 > 0.1 ? 'auto' : 'none',
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
              className={`${styles.chapterPanel} ${styles.chapter4Panel}`}
              style={{
                opacity: op4,
                pointerEvents: op4 > 0.1 ? 'auto' : 'none',
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
                  title={`Send email directly to ${PERSONAL_INFO.email}`}
                >
                  <Mail size={14} />
                  <span>SEND TRANSMISSION</span>
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

              {/* Active Polar Satellite Uplink Card */}
              <div className={styles.activeSatelliteCard}>
                <div className={styles.activeSatelliteHeader}>
                  <div className={styles.activeSatelliteHeaderLeft}>
                    <span className={`${styles.statusDot} ${styles.statusDotCyan}`} />
                    <span className={styles.activeSatelliteTitle}>ACTIVE POLAR SATELLITE</span>
                  </div>
                  <span className={styles.activeSatelliteCount}>
                    [0{activeSocialIndex + 1} / 0{socialChannels.length}]
                  </span>
                </div>

                <div className={styles.activeSatelliteBody}>
                  <div className={styles.activeSatelliteIconWrapper}>
                    {getSocialIcon(activeSocialChannel.platform)}
                  </div>
                  <div className={styles.activeSatelliteInfo}>
                    <div className={styles.activeSatelliteNameRow}>
                      <span className={styles.activeSatelliteName}>{activeSocialChannel.name}</span>
                      <span className={styles.activeSatelliteLiveBadge}>POLAR.ORBIT</span>
                    </div>
                    <span className={styles.activeSatelliteHandle}>{activeSocialChannel.handle}</span>
                  </div>
                  <a
                    href={activeSocialChannel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.activeSatelliteLaunchBtn}
                    title={`Launch ${activeSocialChannel.name} (${activeSocialChannel.handle})`}
                  >
                    <span>LAUNCH</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
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

          {/* Right Column: 3D Transforming Visualizer, Chapter 3 Projects Deck & Chapter 4 Social Solar System */}
          <div className={styles.rightColumn}>
            <div
              className={styles.visualizerLayer}
              style={{
                opacity: Math.max(0, 1 - (op3 + op4) * 1.5),
                pointerEvents: (op3 > 0.4 || op4 > 0.4) ? 'none' : 'auto',
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
                display: op3 > 0.02 ? 'block' : 'none',
                zIndex: op3 > 0.4 ? 12 : 5,
                transform: `translateY(${(1 - op3) * 20}px)`,
              }}
            >
              <OrbitalProjectsSolarSystem onRotate={handleProjectRotate} />
            </div>

            <div
              className={styles.socialDeckLayer}
              style={{
                opacity: op4,
                pointerEvents: op4 > 0.4 ? 'auto' : 'none',
                display: op4 > 0.02 ? 'flex' : 'none',
                zIndex: op4 > 0.4 ? 15 : 4,
                transform: `translateY(${(1 - op4) * 20}px)`,
              }}
            >
              <OrbitalSocialSolarSystem
                onChannelSelect={handleSocialChannelSelect}
                isActive={op4 > 0.3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
