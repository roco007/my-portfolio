import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { useReducedMotion } from '../animations/useReducedMotion';
import { useLoopingScramble } from '../animations/useLoopingScramble';
import styles from './AnimeOscilloscope.module.css';

export const AnimeOscilloscope: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const scrambledRC = useLoopingScramble('RC', { totalFrames: 18, intervalMs: 35, pauseMs: 900 });
  const centerMonogramRef = useRef<SVGGElement | null>(null);
  const outerRingRef = useRef<SVGGElement | null>(null);
  const reticleFwdRef = useRef<SVGGElement | null>(null);
  const reticleRevRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    // 1. Slow ambient rotation of outer rings & ticks
    let ringAnim: ReturnType<typeof animate> | null = null;
    if (outerRingRef.current) {
      ringAnim = animate(outerRingRef.current, {
        rotate: 360,
        duration: 35000,
        loop: true,
        ease: 'linear',
      });
    }

    // 2. Dual counter-rotating cybernetic reticles
    let reticleFwdAnim: ReturnType<typeof animate> | null = null;
    if (reticleFwdRef.current) {
      reticleFwdAnim = animate(reticleFwdRef.current, {
        rotate: 360,
        duration: 26000,
        loop: true,
        ease: 'linear',
      });
    }

    let reticleRevAnim: ReturnType<typeof animate> | null = null;
    if (reticleRevRef.current) {
      reticleRevAnim = animate(reticleRevRef.current, {
        rotate: -360,
        duration: 20000,
        loop: true,
        ease: 'linear',
      });
    }

    // 3. Ambient breathing scale on the center RC monogram core
    let pulseAnim: ReturnType<typeof animate> | null = null;
    if (centerMonogramRef.current) {
      pulseAnim = animate(centerMonogramRef.current, {
        scale: [1, 1.03, 1],
        duration: 3800,
        loop: true,
        alternate: true,
        ease: 'inOutSine',
      });
    }

    return () => {
      ringAnim?.cancel();
      reticleFwdAnim?.cancel();
      reticleRevAnim?.cancel();
      pulseAnim?.cancel();
    };
  }, [reducedMotion]);

  // Click to trigger interactive pulse burst
  const handleInteract = () => {
    if (reducedMotion) return;

    if (centerMonogramRef.current) {
      animate(centerMonogramRef.current, {
        scale: [1, 1.15, 1],
        duration: 850,
        ease: 'outElastic(1, 0.45)',
      });
    }

    if (reticleFwdRef.current) {
      animate(reticleFwdRef.current, {
        rotate: '+=90',
        duration: 650,
        ease: 'outCubic',
      });
    }

    if (reticleRevRef.current) {
      animate(reticleRevRef.current, {
        rotate: '-=90',
        duration: 650,
        ease: 'outCubic',
      });
    }
  };

  return (
    <div
      className={styles.oscilloscopeWrapper}
      onClick={handleInteract}
      title="Click to interact with the engine core"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleInteract();
      }}
      aria-label="Interactive cybernetic RC engine oscilloscope demonstration"
    >
      <svg
        viewBox="0 0 500 500"
        className={styles.svgCanvas}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glass Specular Reflection Highlight */}
          <linearGradient id="glassReflect" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="60%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          {/* Center Radial Glow */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 75, 75, 0.28)" />
            <stop offset="70%" stopColor="rgba(255, 75, 75, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Raster Line Pattern for Center Plate */}
          <pattern id="rasterLines" width="10" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="2" x2="10" y2="2" stroke="#ff4b4b" strokeWidth="1.2" opacity="0.35" />
          </pattern>

          {/* Octagonal Plate Background */}
          <radialGradient id="plateBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2c1a1e" />
            <stop offset="65%" stopColor="#181114" />
            <stop offset="100%" stopColor="#0c090a" />
          </radialGradient>

          {/* Neon Coral Gradient for RC Letters */}
          <linearGradient id="heroRcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#ffa0b2" />
            <stop offset="65%" stopColor="#ff4b4b" />
            <stop offset="100%" stopColor="#db1f26" />
          </linearGradient>

          {/* Multi-tier Neon Glow Filter */}
          <filter id="heroIntenseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur1" />
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Radial Background Glow */}
        <circle cx="250" cy="250" r="230" fill="url(#centerGlow)" />

        {/* Outer Circular Segmented Ring */}
        <g className={styles.segmentedRing}>
          {/* Segment: Green */}
          <path
            d="M 125,75 A 210 210 0 0 1 245,40"
            fill="none"
            stroke="#8dff55"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowGreen}
          />
          {/* Segment: Red */}
          <path
            d="M 255,40 A 210 210 0 0 1 375,75"
            fill="none"
            stroke="#ff4b4b"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowRed}
          />
          {/* Segment: Orange */}
          <path
            d="M 385,85 A 210 210 0 0 1 450,210"
            fill="none"
            stroke="#ffa828"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowOrange}
          />
          {/* Segment: Turquoise / Cyan */}
          <path
            d="M 455,250 A 210 210 0 0 1 420,380"
            fill="none"
            stroke="#00ffaa"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowTurquoise}
          />
          {/* Segment: Sega Blue */}
          <path
            d="M 410,395 A 210 210 0 0 1 255,460"
            fill="none"
            stroke="#33b3f1"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowBlue}
          />
          {/* Segment: Green return */}
          <path
            d="M 245,460 A 210 210 0 0 1 90,380"
            fill="none"
            stroke="#8dff55"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowGreen}
          />
          {/* Segment: Yellow */}
          <path
            d="M 80,365 A 210 210 0 0 1 45,250"
            fill="none"
            stroke="#ffcc2a"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowYellow}
          />
          {/* Segment: Lavender */}
          <path
            d="M 45,240 A 210 210 0 0 1 115,85"
            fill="none"
            stroke="#a369ff"
            strokeWidth="5"
            strokeLinecap="round"
            className={styles.glowLavender}
          />
        </g>

        {/* Outer Rotating Concentric Ticks Ring */}
        <g
          ref={outerRingRef}
          className={styles.ticksRing}
          style={{ transformOrigin: '250px 250px' }}
        >
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 360) / 60;
            const isMajor = i % 5 === 0;
            return (
              <line
                key={i}
                x1="250"
                y1={isMajor ? '55' : '62'}
                x2="250"
                y2="70"
                stroke={isMajor ? '#ff4b4b' : 'rgba(246, 244, 242, 0.25)'}
                strokeWidth={isMajor ? '1.5' : '1'}
                transform={`rotate(${angle} 250 250)`}
              />
            );
          })}
        </g>

        {/* Inner Dark Circular Housing with Hairline Border */}
        <circle
          cx="250"
          cy="250"
          r="175"
          fill="#181716"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />

        {/* Inner Radial Dot Grid */}
        <circle
          cx="250"
          cy="250"
          r="170"
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeDasharray="3, 8"
        />

        {/* Dual Counter-Rotating Cybernetic Reticles */}
        <g
          ref={reticleFwdRef}
          style={{ transformOrigin: '250px 250px' }}
        >
          <circle
            cx="250"
            cy="250"
            r="138"
            fill="none"
            stroke="rgba(0, 255, 170, 0.32)"
            strokeWidth="1.2"
            strokeDasharray="8 12"
          />
        </g>
        <g
          ref={reticleRevRef}
          style={{ transformOrigin: '250px 250px' }}
        >
          <circle
            cx="250"
            cy="250"
            r="124"
            fill="none"
            stroke="rgba(255, 75, 75, 0.36)"
            strokeWidth="1.2"
            strokeDasharray="5 15"
          />
        </g>

        {/* Center RC Monogram Core (Scaled cleanly from center) */}
        <g
          ref={centerMonogramRef}
          style={{ transformOrigin: '250px 250px' }}
        >
          <g transform="translate(250, 250) scale(1.35) translate(-160, -160)">
            {/* Central Octagonal Core Plate */}
            <polygon
              points="112,86 208,86 234,112 234,208 208,234 112,234 86,208 86,112"
              fill="url(#plateBg)"
              stroke="rgba(255, 75, 75, 0.55)"
              strokeWidth="2"
            />
            <polygon
              points="112,86 208,86 234,112 234,208 208,234 112,234 86,208 86,112"
              fill="url(#rasterLines)"
              opacity="0.65"
            />

            {/* Cybernetic Corner Target Brackets */}
            <path
              d="M 94,112 L 94,94 L 112,94"
              fill="none"
              stroke="#00ffaa"
              strokeWidth="2.2"
              strokeLinecap="square"
            />
            <path
              d="M 226,112 L 226,94 L 208,94"
              fill="none"
              stroke="#00ffaa"
              strokeWidth="2.2"
              strokeLinecap="square"
            />
            <path
              d="M 94,208 L 94,226 L 112,226"
              fill="none"
              stroke="#00ffaa"
              strokeWidth="2.2"
              strokeLinecap="square"
            />
            <path
              d="M 226,208 L 226,226 L 208,226"
              fill="none"
              stroke="#00ffaa"
              strokeWidth="2.2"
              strokeLinecap="square"
            />

            {/* Crosshair Guides */}
            <line x1="76" y1="160" x2="86" y2="160" stroke="#ff4b4b" strokeWidth="1.6" />
            <line x1="234" y1="160" x2="244" y2="160" stroke="#ff4b4b" strokeWidth="1.6" />
            <line x1="160" y1="76" x2="160" y2="86" stroke="#ff4b4b" strokeWidth="1.6" />
            <line x1="160" y1="234" x2="160" y2="244" stroke="#ff4b4b" strokeWidth="1.6" />

            {/* RC Monogram — text-based so scramble effect can run on the characters */}
            {/* Cyan RGB-split glitch slice */}
            <text
              x="160" y="172"
              textAnchor="middle" dominantBaseline="middle"
              fill="#00ffea"
              fontSize="96" fontFamily="'Courier New', 'Roboto Mono', monospace"
              fontWeight="900" letterSpacing="4"
              className={styles.glitchCyan}
            >{scrambledRC}</text>

            {/* Red/Magenta RGB-split glitch slice */}
            <text
              x="160" y="172"
              textAnchor="middle" dominantBaseline="middle"
              fill="#ff0055"
              fontSize="96" fontFamily="'Courier New', 'Roboto Mono', monospace"
              fontWeight="900" letterSpacing="4"
              className={styles.glitchRed}
            >{scrambledRC}</text>

            {/* Primary base — gradient fill, twitching */}
            <text
              x="160" y="172"
              textAnchor="middle" dominantBaseline="middle"
              fill="url(#heroRcGrad)"
              fontSize="96" fontFamily="'Courier New', 'Roboto Mono', monospace"
              fontWeight="900" letterSpacing="4"
              className={styles.glitchBase}
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 75, 75, 0.7))' }}
            >{scrambledRC}</text>

            {/* Horizontal Glitch Tear Slice Bar */}
            <rect x="88" y="0" width="144" height="3" fill="#00ffea" opacity="0.8" className={styles.glitchScanBar} />

            {/* High-Tech Micro Accents */}
            <circle cx="160" cy="116" r="2.2" fill="#00ffaa" />
            <circle cx="160" cy="204" r="2.2" fill="#00ffaa" />
            <rect
              x="157"
              y="157"
              width="6"
              height="6"
              fill="#ff4b4b"
              transform="rotate(45 160 160)"
            />
          </g>
        </g>

        {/* Concentric Trailing Orbit Arcs on Bottom Right */}
        <path
          d="M 320,380 A 150 150 0 0 0 400,280"
          fill="none"
          stroke="#ffcc2a"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M 340,360 A 130 130 0 0 0 390,290"
          fill="none"
          stroke="#ff7d36"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M 355,345 A 115 115 0 0 0 380,300"
          fill="none"
          stroke="#f6f4f2"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Top-Left Convex Glass Glare Reflection */}
        <path
          d="M 120,160 A 175 175 0 0 1 250,75 C 210,100 170,135 120,160 Z"
          fill="url(#glassReflect)"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
};

