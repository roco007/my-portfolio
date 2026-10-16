import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { Play, Pause, RotateCcw, Copy, Check } from 'lucide-react';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './InteractiveMotionLab.module.css';

const EASING_PRESETS = [
  { id: 'outElastic', label: 'outElastic(1, .5)', code: "'outElastic(1, .5)'" },
  { id: 'inOutCubic', label: 'inOutCubic', code: "'inOutCubic'" },
  { id: 'outExpo', label: 'outExpo', code: "'outExpo'" },
  { id: 'inOutBack', label: 'inOutBack(1.7)', code: "'inOutBack(1.7)'" },
];

export const InteractiveMotionLab: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const [activeEasing, setActiveEasing] = useState<string>('outElastic');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [timelineProgress, setTimelineProgress] = useState<number>(0);

  const shapesContainerRef = useRef<SVGGElement | null>(null);
  const ringRef = useRef<SVGGElement | null>(null);
  const animInstanceRef = useRef<ReturnType<typeof animate> | null>(null);

  // Run the interactive animation using Anime.js
  useEffect(() => {
    if (reducedMotion || !shapesContainerRef.current) return;

    const shapes = shapesContainerRef.current.querySelectorAll('.animNode');
    if (!shapes.length) return;

    // Outer ring ambient slow rotation
    let ringAnim: ReturnType<typeof animate> | null = null;
    if (ringRef.current) {
      ringAnim = animate(ringRef.current, {
        rotate: 360,
        duration: 30000,
        loop: true,
        ease: 'linear',
      });
    }

    // Main shapes animation with the chosen easing
    const currentEasing = EASING_PRESETS.find((e) => e.id === activeEasing)?.label || 'outElastic(1, .5)';

    const anim = animate(shapes, {
      translateY: [
        (_: unknown, i: number = 0) => (i % 2 === 0 ? -35 : 35),
        (_: unknown, i: number = 0) => (i % 2 === 0 ? 35 : -35),
      ],
      translateX: [
        (_: unknown, i: number = 0) => (i < 3 ? -25 : 25),
        (_: unknown, i: number = 0) => (i < 3 ? 25 : -25),
      ],
      rotate: [0, (_: unknown, i: number = 0) => (i % 2 === 0 ? 180 : -180)],
      scale: [0.8, 1.25, 0.8],
      duration: 1800,
      loop: true,
      alternate: true,
      delay: (_: unknown, i: number = 0) => i * 90,
      ease: currentEasing,
      onUpdate: (self) => {
        if (self.progress !== undefined) {
          setTimelineProgress(self.progress * 100);
        }
      },
    });

    animInstanceRef.current = anim;
    setIsPlaying(true);

    return () => {
      anim.cancel();
      ringAnim?.cancel();
    };
  }, [activeEasing, reducedMotion]);

  const togglePlayPause = () => {
    if (!animInstanceRef.current) return;
    if (isPlaying) {
      animInstanceRef.current.pause();
      setIsPlaying(false);
    } else {
      animInstanceRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!animInstanceRef.current) return;
    animInstanceRef.current.restart();
    setIsPlaying(true);
  };

  const handleCopyCode = async () => {
    const code = `import { animate } from 'animejs';

animate('.node', {
  translateY: [-35, 35],
  rotate: 180,
  scale: [0.8, 1.25],
  duration: 1800,
  alternate: true,
  loop: true,
  ease: '${activeEasing}',
});`;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.labSection}>
      <div className={`container ${styles.container}`}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>
            <span className={styles.sectionTagDot} />
            <span>01 // MOTION ARCHITECTURE</span>
          </div>
          <h2 className={styles.sectionTitle}>The Animation Engine</h2>
          <p className={styles.sectionDesc}>
            Interactive Anime.js choreography demonstrating spring kinematics, procedural easing,
            and timeline synchronization.
          </p>
        </div>

        {/* Main Interactive Stage Grid */}
        <div className={styles.stageGrid}>
          {/* Left: The Visualizer Dial matching animejs.com */}
          <div className={styles.dialWrapper}>
            <svg
              viewBox="0 0 440 440"
              className={styles.dialSvg}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="labReflect" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
                  <stop offset="70%" stopColor="transparent" />
                </linearGradient>

                <radialGradient id="labCenterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255, 168, 40, 0.25)" />
                  <stop offset="65%" stopColor="rgba(255, 168, 40, 0.03)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Ambient Glow */}
              <circle cx="220" cy="220" r="195" fill="url(#labCenterGlow)" />

              {/* Segmented Ring with Amber Highlight */}
              <circle
                cx="220"
                cy="220"
                r="190"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="4"
              />
              <path
                d="M 354,86 A 190 190 0 0 1 410,220"
                fill="none"
                stroke="#ffa828"
                strokeWidth="5"
                strokeLinecap="round"
                className={styles.glowAmber}
              />
              <path
                d="M 220,30 A 190 190 0 0 1 354,86"
                fill="none"
                stroke="#ff4b4b"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Rotating Ticks Ring */}
              <g ref={ringRef} transform-origin="220 220">
                {Array.from({ length: 48 }).map((_, i) => {
                  const angle = (i * 360) / 48;
                  const isMajor = i % 4 === 0;
                  return (
                    <line
                      key={i}
                      x1="220"
                      y1={isMajor ? '42' : '48'}
                      x2="220"
                      y2="54"
                      stroke={isMajor ? '#ffa828' : 'rgba(246, 244, 242, 0.2)'}
                      strokeWidth={isMajor ? '1.5' : '1'}
                      transform={`rotate(${angle} 220 220)`}
                    />
                  );
                })}
              </g>

              {/* Dark Interior Housing */}
              <circle
                cx="220"
                cy="220"
                r="155"
                fill="#1c1b1a"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1.5"
              />

              {/* Matrix Dot Grid */}
              {Array.from({ length: 7 }).map((_, row) =>
                Array.from({ length: 7 }).map((_, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={145 + col * 25}
                    cy={145 + row * 25}
                    r="1.2"
                    fill="rgba(255, 255, 255, 0.12)"
                  />
                ))
              )}

              {/* Animated Geometric Nodes */}
              <g ref={shapesContainerRef}>
                {/* Node 1: Amber rounded rect */}
                <rect
                  x="195"
                  y="150"
                  width="50"
                  height="50"
                  rx="10"
                  fill="#ffa828"
                  className="animNode"
                  transform-origin="220 175"
                />
                {/* Node 2: Red outline circle */}
                <circle
                  cx="160"
                  cy="240"
                  r="24"
                  fill="none"
                  stroke="#ff4b4b"
                  strokeWidth="3"
                  className="animNode"
                  transform-origin="160 240"
                />
                {/* Node 3: Turquoise diamond */}
                <rect
                  x="260"
                  y="225"
                  width="36"
                  height="36"
                  rx="6"
                  fill="#00ffaa"
                  className="animNode"
                  transform-origin="278 243"
                />
                {/* Node 4: Lime small disc */}
                <circle
                  cx="220"
                  cy="270"
                  r="16"
                  fill="#8dff55"
                  className="animNode"
                  transform-origin="220 270"
                />
                {/* Node 5: Sky blue hollow box */}
                <rect
                  x="165"
                  y="170"
                  width="32"
                  height="32"
                  rx="4"
                  fill="none"
                  stroke="#33b3f1"
                  strokeWidth="2.5"
                  className="animNode"
                  transform-origin="181 186"
                />
                {/* Node 6: Lavender pill */}
                <rect
                  x="250"
                  y="160"
                  width="40"
                  height="22"
                  rx="11"
                  fill="#a369ff"
                  className="animNode"
                  transform-origin="270 171"
                />
              </g>

              {/* Concentric Orbit Arcs */}
              <path
                d="M 280,335 A 130 130 0 0 0 350,250"
                fill="none"
                stroke="#ffcc2a"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M 295,320 A 110 110 0 0 0 340,260"
                fill="none"
                stroke="#ff7d36"
                strokeWidth="1.75"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Convex Specular Lens Glare */}
              <path
                d="M 110,140 A 155 155 0 0 1 220,65 C 185,90 150,120 110,140 Z"
                fill="url(#labReflect)"
                pointerEvents="none"
              />
            </svg>
          </div>

          {/* Right: Interactive Controls & Code Display matching animejs.com */}
          <div className={styles.controlsPanel}>
            {/* Easing Preset Selector */}
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>EASING PRESET</span>
              <div className={styles.presetsGrid}>
                {EASING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.presetBtn} ${
                      activeEasing === preset.id ? styles.presetActive : ''
                    }`}
                    onClick={() => setActiveEasing(preset.id)}
                  >
                    {preset.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Controls Row */}
            <div className={styles.playbackRow}>
              <button
                type="button"
                className={styles.playbackBtn}
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause Animation' : 'Play Animation'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              <button
                type="button"
                className={styles.playbackBtn}
                onClick={handleRestart}
                title="Restart Animation"
              >
                <RotateCcw size={14} />
                <span>RESTART</span>
              </button>

              <div className={styles.liveFpsBadge}>
                <span className={styles.fpsDot} />
                <span>60 FPS // RAF</span>
              </div>
            </div>

            {/* Live Anime.js Code Card */}
            <div className={styles.codeCard}>
              <div className={styles.codeCardHeader}>
                <span className={styles.codeLangTag}>TYPESCRIPT // ANIME.JS v4</span>
                <button
                  type="button"
                  className={styles.copyCodeBtn}
                  onClick={handleCopyCode}
                  title="Copy Code"
                >
                  {copied ? (
                    <span className={styles.copiedText}>
                      <Check size={12} /> COPIED
                    </span>
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>

              <pre className={styles.codeContent}>
                <code>
                  <span className={styles.keyword}>animate</span>
                  <span className={styles.punctuation}>(&#39;.nodes&#39;, &#123;</span>
                  {'\n  '}
                  <span className={styles.property}>translateY</span>
                  <span className={styles.punctuation}>: [</span>
                  <span className={styles.number}>-35</span>
                  <span className={styles.punctuation}>, </span>
                  <span className={styles.number}>35</span>
                  <span className={styles.punctuation}>],</span>
                  {'\n  '}
                  <span className={styles.property}>rotate</span>
                  <span className={styles.punctuation}>: </span>
                  <span className={styles.number}>180</span>
                  <span className={styles.punctuation}>,</span>
                  {'\n  '}
                  <span className={styles.property}>scale</span>
                  <span className={styles.punctuation}>: [</span>
                  <span className={styles.number}>0.8</span>
                  <span className={styles.punctuation}>, </span>
                  <span className={styles.number}>1.25</span>
                  <span className={styles.punctuation}>],</span>
                  {'\n  '}
                  <span className={styles.property}>duration</span>
                  <span className={styles.punctuation}>: </span>
                  <span className={styles.number}>1800</span>
                  <span className={styles.punctuation}>,</span>
                  {'\n  '}
                  <span className={styles.property}>ease</span>
                  <span className={styles.punctuation}>: </span>
                  <span className={styles.string}>&#39;{activeEasing}&#39;</span>
                  <span className={styles.punctuation}>,</span>
                  {'\n  '}
                  <span className={styles.property}>alternate</span>
                  <span className={styles.punctuation}>: </span>
                  <span className={styles.boolean}>true</span>
                  <span className={styles.punctuation}>,</span>
                  {'\n  '}
                  <span className={styles.property}>loop</span>
                  <span className={styles.punctuation}>: </span>
                  <span className={styles.boolean}>true</span>
                  {'\n'}
                  <span className={styles.punctuation}>&#125;);</span>
                </code>
              </pre>
            </div>

            {/* Signature Anime.js Timeline Scrubber with Red Needle */}
            <div className={styles.scrubberContainer}>
              <div className={styles.scrubberHeader}>
                <span className={styles.scrubberLabel}>TIMELINE SCRUBBER</span>
                <span className={styles.scrubberTime}>
                  {Math.round(timelineProgress)}%
                </span>
              </div>
              <div className={styles.scrubberTrack}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.tick} ${i % 5 === 0 ? styles.majorTick : ''}`}
                  />
                ))}
                {/* Red Needle */}
                <span
                  className={styles.needle}
                  style={{ left: `${timelineProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
