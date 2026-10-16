import React, { useEffect, useRef, useState } from 'react';
import { animate, createTimeline } from 'animejs';
import styles from './IntroAnimation.module.css';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const arcsGroupRef = useRef<SVGGElement | null>(null);
  const ticksRef = useRef<SVGGElement | null>(null);
  const centerShapeRef = useRef<SVGGElement | null>(null);
  const waveRef = useRef<SVGGElement | null>(null);
  const textGroupRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  
  const [progressNum, setProgressNum] = useState<number>(0);
  const [telemetryText, setTelemetryText] = useState<string>('INITIALIZING SYSTEM ENGINE...');

  useEffect(() => {
    // 1. Progress count animation
    const progressObj = { val: 0 };
    const counterAnim = animate(progressObj, {
      val: 100,
      duration: 1600,
      ease: 'inOutQuad',
      onUpdate: () => {
        const current = Math.floor(progressObj.val);
        setProgressNum(current);
        if (current > 30 && current < 70) {
          setTelemetryText('CALIBRATING 3D PERSPECTIVE...');
        } else if (current >= 70) {
          setTelemetryText('ANIME.JS v4 KINETIC MATRIX ONLINE');
        }
      },
    });

    if (progressBarRef.current) {
      animate(progressBarRef.current, {
        width: ['0%', '100%'],
        duration: 1600,
        ease: 'inOutQuad',
      });
    }

    // 2. Timeline for the emblem elements
    const tl = createTimeline({
      defaults: { ease: 'outExpo', duration: 900 },
    });

    // Ring arcs bursting out with Anime.js signature elastic spring
    if (arcsGroupRef.current) {
      const paths = arcsGroupRef.current.querySelectorAll('path');
      tl.add(
        paths,
        {
          scale: [0.05, 1],
          opacity: [0, 1],
          rotate: [-120, 0],
          duration: 1400,
          delay: (_: unknown, i: number = 0) => i * 60,
          ease: 'outElastic(1, 0.55)',
        },
        0
      );
    }

    // Ticks ring rotating & fading in
    if (ticksRef.current) {
      tl.add(
        ticksRef.current,
        {
          opacity: [0, 1],
          rotate: [180, 0],
          duration: 1200,
          ease: 'outCubic',
        },
        200
      );
    }

    // Center shape elastic pop
    if (centerShapeRef.current) {
      tl.add(
        centerShapeRef.current,
        {
          scale: [0, 1],
          rotate: [0, 45],
          opacity: [0, 1],
          duration: 1000,
          ease: 'outBack(2)',
        },
        300
      );
    }

    // Wave points stagger
    if (waveRef.current) {
      const dots = waveRef.current.querySelectorAll('circle');
      tl.add(
        dots,
        {
          scale: [0, 1],
          translateY: [
            (_: unknown, i: number = 0) => Math.sin(i * 0.4) * 15,
            0,
          ],
          opacity: [0, 1],
          delay: (_: unknown, i: number = 0) => i * 35,
          duration: 800,
          ease: 'outBack(1.7)',
        },
        400
      );
    }

    // Text group fade up
    if (textGroupRef.current) {
      tl.add(
        textGroupRef.current,
        {
          opacity: [0, 1],
          translateY: [25, 0],
          duration: 700,
          ease: 'outExpo',
        },
        500
      );
    }

    // Exit timeout after full sequence
    const timer = setTimeout(() => {
      finishIntro();
    }, 2100);

    // Keyboard listener for skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        finishIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      counterAnim.cancel();
      tl.cancel();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const finishIntro = () => {
    if (!overlayRef.current) {
      onComplete();
      return;
    }

    animate(overlayRef.current, {
      opacity: [1, 0],
      scale: [1, 1.05],
      duration: 500,
      ease: 'inOutQuad',
      onComplete: () => {
        onComplete();
      },
    });
  };

  return (
    <div
      ref={overlayRef}
      className={styles.introOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome intro animation"
      onClick={finishIntro}
    >
      <div className={styles.introGrid} />
      <div className={styles.introRadialGlow} />

      <div className={styles.introCenterpiece}>
        <svg
          viewBox="0 0 400 400"
          className={styles.svgGauge}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="introCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 75, 75, 0.4)" />
              <stop offset="60%" stopColor="rgba(255, 75, 75, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <pattern id="introRaster" width="8" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="2" x2="8" y2="2" stroke="#ff4b4b" strokeWidth="1.5" opacity="0.7" />
            </pattern>
          </defs>

          {/* Ambient Glow */}
          <circle cx="200" cy="200" r="180" fill="url(#introCenterGlow)" />

          {/* Elastic Colored Ring Segments matching Anime.js */}
          <g ref={arcsGroupRef} className={styles.arcSegment}>
            <path
              d="M 100,60 A 170 170 0 0 1 195,30"
              fill="none"
              stroke="#8dff55"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 205,30 A 170 170 0 0 1 300,60"
              fill="none"
              stroke="#ff4b4b"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 310,70 A 170 170 0 0 1 365,165"
              fill="none"
              stroke="#ffa828"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 370,195 A 170 170 0 0 1 340,300"
              fill="none"
              stroke="#00ffaa"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 330,315 A 170 170 0 0 1 205,370"
              fill="none"
              stroke="#33b3f1"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 195,370 A 170 170 0 0 1 70,310"
              fill="none"
              stroke="#a369ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 60,295 A 170 170 0 0 1 35,200"
              fill="none"
              stroke="#ffcc2a"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 35,190 A 170 170 0 0 1 90,70"
              fill="none"
              stroke="#ff718b"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>

          {/* Concentric Ticks Ring */}
          <g ref={ticksRef} className={styles.ticksRing}>
            {Array.from({ length: 48 }).map((_, i) => {
              const angle = (i * 360) / 48;
              const isMajor = i % 4 === 0;
              return (
                <line
                  key={i}
                  x1="200"
                  y1={isMajor ? '46' : '52'}
                  x2="200"
                  y2="58"
                  stroke={isMajor ? '#ff4b4b' : 'rgba(255, 255, 255, 0.3)'}
                  strokeWidth={isMajor ? '1.5' : '1'}
                  transform={`rotate(${angle} 200 200)`}
                />
              );
            })}
          </g>

          {/* Dark Inner Base */}
          <circle
            cx="200"
            cy="200"
            r="140"
            fill="#1c1b1a"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1.5"
          />

          {/* Center Raster Diamond */}
          <g ref={centerShapeRef} className={styles.centerDiamond}>
            <rect
              x="145"
              y="145"
              width="110"
              height="110"
              rx="18"
              fill="url(#introRaster)"
              stroke="#ff4b4b"
              strokeWidth="2"
            />
          </g>

          {/* Pulsing Sine-Wave Dots */}
          <g ref={waveRef}>
            {Array.from({ length: 18 }).map((_, i) => {
              const x = 90 + i * 13;
              const y = 175 + i * 2.5;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#ff4b4b"
                />
              );
            })}
          </g>
        </svg>

        <div ref={textGroupRef} className={styles.introTextGroup}>
          <div className={styles.brandTitle}>
            <span>raj.colaco</span>
            <span className={styles.brandDot} />
          </div>

          <div className={styles.telemetryLine}>{telemetryText}</div>
          <div className={styles.subTelemetry}>
            [ CALIBRATION: {progressNum.toString().padStart(2, '0')}% ] // STACK: TS + REACT 19 + AI
          </div>

          <div className={styles.progressTrack}>
            <div ref={progressBarRef} className={styles.progressBar} />
          </div>
        </div>
      </div>

      <button
        type="button"
        className={styles.skipButton}
        onClick={(e) => {
          e.stopPropagation();
          finishIntro();
        }}
        title="Skip intro animation"
      >
        <span>SKIP</span>
        <span className={styles.kbd}>SPACE</span>
      </button>
    </div>
  );
};
