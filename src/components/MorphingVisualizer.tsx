import React from 'react';
import { useLoopingScramble } from '../animations/useLoopingScramble';
import styles from './MorphingVisualizer.module.css';

interface MorphingVisualizerProps {
  progress: number; // 0.0 to 1.0
  onOpenTerminal?: () => void;
}

export const MorphingVisualizer: React.FC<MorphingVisualizerProps> = ({
  progress,
}) => {
  const scrambledRC = useLoopingScramble('RC', { totalFrames: 18, intervalMs: 35, pauseMs: 900 });

  // Rotation and Z-extrusions based on progress
  let rotX = 0;
  let rotY = 0;
  let rotZ = 0;
  let scale = 1;

  // Ring Z offsets
  let z0 = 0;
  let z1 = 0;
  let z2 = 0;
  let z3 = 0;
  let z4 = 0;
  let z5 = 0;

  // Opacity controls for stage overlays
  let leaderOpacity = 0;

  if (progress <= 0.20) {
    // -------------------------------------------------------------
    // STAGE 0: 2D Front-Facing Oscilloscope Gauge
    // -------------------------------------------------------------
    rotX = 0;
    rotY = 0;
    rotZ = 0;
    scale = 1;
    z0 = 0;
    z1 = -2;
    z2 = -4;
    z3 = -6;
    z4 = -8;
    z5 = -10;
  } else if (progress <= 0.42) {
    // -------------------------------------------------------------
    // STAGE 1: 3D Extrusion into Cylindrical AI Engine
    // -------------------------------------------------------------
    const t = Math.min(Math.max((progress - 0.20) / 0.22, 0), 1); // 0 -> 1
    rotX = 64 * t;
    rotY = -22 * t;
    rotZ = 36 * t;
    scale = 1 + 0.05 * t;

    z0 = 0;
    z1 = -35 * t;
    z2 = -70 * t;
    z3 = -115 * t;
    z4 = -160 * t;
    z5 = -210 * t;
  } else if (progress <= 0.54) {
    // -------------------------------------------------------------
    // STAGE 2A: Exploding into Technical Assembly at Skills chapter
    // -------------------------------------------------------------
    const t = Math.min(Math.max((progress - 0.42) / 0.12, 0), 1); // 0 -> 1
    rotX = 64 - 36 * t; // 64 -> 28
    rotY = -22 - 18 * t; // -22 -> -40
    rotZ = 36 - 4 * t;  // 36 -> 32
    scale = 1.05 - 0.05 * t;

    // Exploding apart along central axis to peak at p = 0.54
    z0 = 120 * t;
    z1 = -35 + 45 * t;
    z2 = -70;
    z3 = -115 - 45 * t;
    z4 = -160 - 90 * t;
    z5 = -210 - 140 * t;

    leaderOpacity = t < 0.25 ? t / 0.25 : 1;
  } else if (progress <= 0.68) {
    // -------------------------------------------------------------
    // STAGE 2B: Seamless Convergence from Skills into Projects Core
    // Layers contract into a dense glowing disc aligning with Globe tilt
    // -------------------------------------------------------------
    const c = Math.min(Math.max((progress - 0.54) / 0.14, 0), 1); // 0 -> 1
    // Leader lines retract cleanly first before rings slam shut
    leaderOpacity = Math.max(0, 1 - c / 0.25);

    // Smooth convergence curve
    const easeC = c * c * (3 - 2 * c);

    // 3D rotation aligns from angled assembly (28, -40, 32) to front-facing globe tilt (10, 0, 0)
    rotX = 28 - 18 * easeC; // 28 -> 10
    rotY = -40 * (1 - easeC); // -40 -> 0
    rotZ = 32 * (1 - easeC);  // 32 -> 0
    scale = 1.0 - 0.06 * Math.sin(c * Math.PI);

    // Exploded layers collapse together along the central Z-axis into a single plane
    z0 = 120 * (1 - easeC);
    z1 = 10 * (1 - easeC);
    z2 = -70 * (1 - easeC);
    z3 = -160 * (1 - easeC);
    z4 = -250 * (1 - easeC);
    z5 = -350 * (1 - easeC);
  } else {
    // -------------------------------------------------------------
    // STAGE 3 & Beyond: Settled in background behind active chapters
    // -------------------------------------------------------------
    rotX = 10;
    rotY = 0;
    rotZ = 0;
    scale = 1;
    z0 = 0;
    z1 = 0;
    z2 = 0;
    z3 = 0;
    z4 = 0;
    z5 = 0;
    leaderOpacity = 0;
  }

  return (
    <div className={styles.visualizerWrapper} aria-label="3D Transforming Engine">
      <div className={styles.ambientGlow} />

      {/* 3D Scene Root */}
      <div
        className={styles.scene3D}
        style={{
          transform: `perspective(1200px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${scale.toFixed(2)})`,
        }}
      >
        {/* Layer 5: Base Mounting Flange */}
        <div
          className={`${styles.cylinderRing} ${styles.ringBaseMount}`}
          style={{ transform: `translateZ(${z5.toFixed(1)}px)` }}
        >
          <div className={styles.mountBolts} />
        </div>

        {/* Layer 4: Ribbed Cooling Fins */}
        <div
          className={`${styles.cylinderRing} ${styles.ringCoolingFins}`}
          style={{ transform: `translateZ(${z4.toFixed(1)}px)` }}
        >
          <div className={styles.finSlices} />
        </div>

        {/* Layer 3: Central AI Chamber */}
        <div
          className={`${styles.cylinderRing} ${styles.ringCoreChamber}`}
          style={{ transform: `translateZ(${z3.toFixed(1)}px)` }}
        >
          <div className={styles.coreMatrixLed}>
            <span className={styles.coreLabel}>AI CORE // v2.0</span>
            <div className={styles.coreLedBar} />
          </div>
        </div>

        {/* Layer 2: Knurled Aperture Gear */}
        <div
          className={`${styles.cylinderRing} ${styles.ringApertureGear}`}
          style={{ transform: `translateZ(${z2.toFixed(1)}px)` }}
        >
          <div className={styles.gearTeeth} />
        </div>

        {/* Layer 1: Optical Reticle */}
        <div
          className={`${styles.cylinderRing} ${styles.ringOpticalReticle}`}
          style={{ transform: `translateZ(${z1.toFixed(1)}px)` }}
        >
          <div className={styles.reticleGrid}>
            <div className={styles.reticleCross} />
            <div className={styles.reticleCrossVert} />
          </div>
        </div>

        {/* Layer 0: Front Bezel with Anime.js Segmented Rim */}
        <div
          className={`${styles.cylinderRing} ${styles.ringFrontBezel}`}
          style={{ transform: `translateZ(${z0.toFixed(1)}px)` }}
        >
          <svg
            viewBox="0 0 320 320"
            className={styles.frontSvgGauge}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="centerPlateBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2c1a1e" />
                <stop offset="65%" stopColor="#181114" />
                <stop offset="100%" stopColor="#0c090a" />
              </radialGradient>
              <linearGradient id="rcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="22%" stopColor="#ffa2b4" />
                <stop offset="60%" stopColor="#ff4b4b" />
                <stop offset="100%" stopColor="#db1f26" />
              </linearGradient>
              <pattern id="frontRaster" width="6" height="4" patternUnits="userSpaceOnUse">
                <line x1="0" y1="2" x2="6" y2="2" stroke="#ff4b4b" strokeWidth="1.2" opacity="0.32" />
              </pattern>
              <filter id="intenseGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur1" />
                <feGaussianBlur stdDeviation="2.5" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Segmented Ring Arcs matching animejs */}
            <path d="M 80,48 A 136 136 0 0 1 155,24" fill="none" stroke="#8dff55" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 165,24 A 136 136 0 0 1 240,48" fill="none" stroke="#ff4b4b" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 248,56 A 136 136 0 0 1 292,132" fill="none" stroke="#ffa828" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 296,156 A 136 136 0 0 1 272,240" fill="none" stroke="#00ffaa" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 264,252 A 136 136 0 0 1 165,296" fill="none" stroke="#33b3f1" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 155,296 A 136 136 0 0 1 56,248" fill="none" stroke="#a369ff" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 48,236 A 136 136 0 0 1 24,160" fill="none" stroke="#ffcc2a" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 24,152 A 136 136 0 0 1 72,56" fill="none" stroke="#ff718b" strokeWidth="4.5" strokeLinecap="round" />

            {/* Outer ticks */}
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 360) / 36;
              const isMajor = i % 4 === 0;
              return (
                <line
                  key={i}
                  x1="160"
                  y1={isMajor ? '36' : '41'}
                  x2="160"
                  y2="46"
                  stroke={isMajor ? '#ff4b4b' : 'rgba(255, 255, 255, 0.25)'}
                  strokeWidth={isMajor ? '1.5' : '1'}
                  transform={`rotate(${angle} 160 160)`}
                />
              );
            })}

            {/* Inner Rotating Mechanical Reticle Rings */}
            <g className={styles.innerReticleArc}>
              <circle
                cx="160"
                cy="160"
                r="72"
                fill="none"
                stroke="rgba(0, 255, 170, 0.35)"
                strokeWidth="1.2"
                strokeDasharray="8 12"
              />
            </g>
            <g className={styles.innerReticleArcReverse}>
              <circle
                cx="160"
                cy="160"
                r="64"
                fill="none"
                stroke="rgba(255, 75, 75, 0.38)"
                strokeWidth="1"
                strokeDasharray="4 16"
              />
            </g>

            {/* Central Octagonal Core Plate */}
            <polygon
              points="112,86 208,86 234,112 234,208 208,234 112,234 86,208 86,112"
              fill="url(#centerPlateBg)"
              stroke="rgba(255, 75, 75, 0.55)"
              strokeWidth="2"
            />
            <polygon
              points="112,86 208,86 234,112 234,208 208,234 112,234 86,208 86,112"
              fill="url(#frontRaster)"
              opacity="0.65"
            />

            {/* Cybernetic Corner Target Brackets */}
            <path d="M 94,112 L 94,94 L 112,94" fill="none" stroke="#00ffaa" strokeWidth="2.2" strokeLinecap="square" />
            <path d="M 226,112 L 226,94 L 208,94" fill="none" stroke="#00ffaa" strokeWidth="2.2" strokeLinecap="square" />
            <path d="M 94,208 L 94,226 L 112,226" fill="none" stroke="#00ffaa" strokeWidth="2.2" strokeLinecap="square" />
            <path d="M 226,208 L 226,226 L 208,226" fill="none" stroke="#00ffaa" strokeWidth="2.2" strokeLinecap="square" />

            {/* Crosshair Guides */}
            <line x1="78" y1="160" x2="86" y2="160" stroke="#ff4b4b" strokeWidth="1.6" />
            <line x1="234" y1="160" x2="242" y2="160" stroke="#ff4b4b" strokeWidth="1.6" />
            <line x1="160" y1="78" x2="160" y2="86" stroke="#ff4b4b" strokeWidth="1.6" />
            <line x1="160" y1="234" x2="160" y2="242" stroke="#ff4b4b" strokeWidth="1.6" />

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
              fill="url(#rcGrad)"
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
            <rect x="157" y="157" width="6" height="6" fill="#ff4b4b" transform="rotate(45 160 160)" />
          </svg>
        </div>
      </div>

      {/* -------------------------------------------------------------
          LEADER LINES & TECHNICAL CALLOUTS (Exploded Assembly)
          Matching animejs.com exploded diagram
          ------------------------------------------------------------- */}
      <svg
        className={styles.leaderLinesSvg}
        style={{
          opacity: leaderOpacity,
          pointerEvents: 'none',
        }}
        viewBox="0 0 640 640"
      >
        {/* Top-Right Line 1: Multi-Agent */}
        <polyline
          points="390,200 460,140 570,140"
          fill="none"
          stroke="#ff4b4b"
          strokeWidth="1.2"
          className={styles.leaderPath}
        />
        <circle cx="390" cy="200" r="3" fill="#ff4b4b" className={styles.leaderPoint} />
        <text x="465" y="132" className={styles.leaderTag}>
          multi-agent
        </text>
        <text x="465" y="152" className={styles.leaderTagSub}>
          Autonomous Agent Teams &amp; Eval
        </text>

        {/* Top-Right Line 2: Cloudflare Workers & DO */}
        <polyline
          points="350,260 430,195 570,195"
          fill="none"
          stroke="#00ffaa"
          strokeWidth="1.2"
          className={styles.leaderPath}
        />
        <circle cx="350" cy="260" r="3" fill="#00ffaa" className={styles.leaderPoint} />
        <text x="435" y="187" className={styles.leaderTag}>
          cloudflare-edge
        </text>
        <text x="435" y="207" className={styles.leaderTagSub}>
          Durable Objects &amp; Sub-ms Compute
        </text>

        {/* Top-Right Line 3: AST Engine */}
        <polyline
          points="310,310 400,250 570,250"
          fill="none"
          stroke="#33b3f1"
          strokeWidth="1.2"
          className={styles.leaderPath}
        />
        <circle cx="310" cy="310" r="3" fill="#33b3f1" className={styles.leaderPoint} />
        <text x="405" y="242" className={styles.leaderTag}>
          ast-analysis
        </text>
        <text x="405" y="262" className={styles.leaderTagSub}>
          Parser Trees &amp; Synthesized Codegen
        </text>

        {/* Bottom-Left Line 4: TypeScript & React 19 */}
        <polyline
          points="250,370 170,440 30,440"
          fill="none"
          stroke="#ffa828"
          strokeWidth="1.2"
          className={styles.leaderPath}
        />
        <circle cx="250" cy="370" r="3" fill="#ffa828" className={styles.leaderPoint} />
        <text x="35" y="432" className={styles.leaderTag}>
          typescript-react19
        </text>
        <text x="35" y="452" className={styles.leaderTagSub}>
          Zero-Drift Micro-Interactions
        </text>

        {/* Bottom-Left Line 5: Vector RAG */}
        <polyline
          points="210,410 140,495 30,495"
          fill="none"
          stroke="#a369ff"
          strokeWidth="1.2"
          className={styles.leaderPath}
        />
        <circle cx="210" cy="410" r="3" fill="#a369ff" className={styles.leaderPoint} />
        <text x="35" y="487" className={styles.leaderTag}>
          vector-rag
        </text>
        <text x="35" y="507" className={styles.leaderTagSub}>
          Hybrid Semantic Embeddings
        </text>

        {/* Bottom-Left Line 6: Telemetry */}
        <polyline
          points="170,450 110,550 30,550"
          fill="none"
          stroke="#ff4b4b"
          strokeWidth="1.2"
          className={styles.leaderPath}
        />
        <circle cx="170" cy="450" r="3" fill="#ff4b4b" className={styles.leaderPoint} />
        <text x="35" y="542" className={styles.leaderTag}>
          telemetry-observability
        </text>
        <text x="35" y="562" className={styles.leaderTagSub}>
          p99 &lt;15ms Distributed Tracing
        </text>
      </svg>

      {/* Hologram overlay was moved to dedicated HorizontalProjectsDeck & RotaryProjectDisc */}

    </div>
  );
};
