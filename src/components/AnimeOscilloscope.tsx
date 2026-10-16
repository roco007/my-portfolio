import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './AnimeOscilloscope.module.css';

export const AnimeOscilloscope: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const centerDiamondRef = useRef<SVGGElement | null>(null);
  const outerRingRef = useRef<SVGGElement | null>(null);
  const wavePointsRef = useRef<SVGGElement | null>(null);
  const [activeShape, setActiveShape] = useState<'diamond' | 'circle' | 'square'>('diamond');

  useEffect(() => {
    if (reducedMotion || !outerRingRef.current || !centerDiamondRef.current) return;

    // 1. Slow ambient rotation of outer rings & ticks
    const ringAnim = animate(outerRingRef.current, {
      rotate: 360,
      duration: 35000,
      loop: true,
      ease: 'linear',
    });

    // 2. Smooth floating oscillation of center diamond
    const diamondAnim = animate(centerDiamondRef.current, {
      rotate: [45, 135],
      scale: [1, 1.05, 1],
      duration: 6000,
      loop: true,
      alternate: true,
      ease: 'inOutQuad',
    });

    // 3. Staggered sine wave pulsation for the dots
    let dotsAnim: ReturnType<typeof animate> | null = null;
    if (wavePointsRef.current) {
      const dots = wavePointsRef.current.querySelectorAll('circle');
      dotsAnim = animate(dots, {
        translateY: [
          (_: unknown, i: number = 0) => Math.sin(i * 0.35) * 12,
          (_: unknown, i: number = 0) => Math.sin(i * 0.35 + Math.PI) * 12,
        ],
        duration: 2200,
        loop: true,
        alternate: true,
        delay: (_: unknown, i: number = 0) => i * 45,
        ease: 'inOutSine',
      });
    }

    return () => {
      ringAnim.cancel();
      diamondAnim.cancel();
      dotsAnim?.cancel();
    };
  }, [reducedMotion]);

  // Click to trigger a burst rotation on the center shape
  const handleInteract = () => {
    if (reducedMotion || !centerDiamondRef.current) return;
    animate(centerDiamondRef.current, {
      rotate: '+=90',
      duration: 900,
      ease: 'outElastic(1, 0.5)',
    });
    setActiveShape((prev) => (prev === 'diamond' ? 'circle' : prev === 'circle' ? 'square' : 'diamond'));
  };

  return (
    <div
      className={styles.oscilloscopeWrapper}
      onClick={handleInteract}
      title="Click to interact with the animation engine"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleInteract();
      }}
      aria-label="Interactive Anime.js oscilloscope demonstration"
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

          {/* Center Glow */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 75, 75, 0.25)" />
            <stop offset="70%" stopColor="rgba(255, 75, 75, 0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Raster Line Pattern for Center Diamond */}
          <pattern id="rasterLines" width="10" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="2" x2="10" y2="2" stroke="#ff4b4b" strokeWidth="1.5" opacity="0.65" />
          </pattern>
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
        <g ref={outerRingRef} className={styles.ticksRing} transform-origin="250 250">
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
          fill="#1c1b1a"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1.5"
        />

        {/* Inner Radial Dot Grid */}
        <circle cx="250" cy="250" r="170" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3, 8" />
        <circle cx="250" cy="250" r="120" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="2, 6" />
        <circle cx="250" cy="250" r="70" fill="none" stroke="rgba(255, 255, 255, 0.05)" />

        {/* Center Animated Diamond Shape with Raster Lines */}
        <g ref={centerDiamondRef} transform-origin="250 250">
          {activeShape === 'diamond' && (
            <rect
              x="175"
              y="175"
              width="150"
              height="150"
              rx="24"
              fill="url(#rasterLines)"
              stroke="#ff4b4b"
              strokeWidth="2"
              opacity="0.9"
            />
          )}
          {activeShape === 'circle' && (
            <circle
              cx="250"
              cy="250"
              r="75"
              fill="url(#rasterLines)"
              stroke="#ff4b4b"
              strokeWidth="2"
              opacity="0.9"
            />
          )}
          {activeShape === 'square' && (
            <rect
              x="180"
              y="180"
              width="140"
              height="140"
              rx="8"
              fill="url(#rasterLines)"
              stroke="#ff4b4b"
              strokeWidth="2"
              opacity="0.9"
            />
          )}
        </g>

        {/* Animated Sine-Wave Dots Crossing the Center */}
        <g ref={wavePointsRef}>
          {Array.from({ length: 24 }).map((_, i) => {
            const x = 110 + i * 12;
            const baseY = 210 + i * 2.5;
            return (
              <circle
                key={i}
                cx={x}
                cy={baseY}
                r="3.5"
                fill="#ff4b4b"
                className={styles.waveDot}
              />
            );
          })}
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
