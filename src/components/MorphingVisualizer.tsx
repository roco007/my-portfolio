import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { animate } from 'animejs';
import styles from './MorphingVisualizer.module.css';

interface MorphingVisualizerProps {
  progress: number; // 0.0 to 1.0
  onOpenTerminal?: () => void;
}

export const MorphingVisualizer: React.FC<MorphingVisualizerProps> = ({
  progress,
}) => {
  // Interactive Easing Lab in Motion stage
  const [activeEasing, setActiveEasing] = useState<string>('outElastic(1, 0.5)');
  const orbRef = useRef<HTMLDivElement | null>(null);

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
  let radarOpacity = 0;

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
  } else if (progress <= 0.66) {
    // -------------------------------------------------------------
    // STAGE 2: Exploded Assembly & Technical Leader Lines
    // -------------------------------------------------------------
    const t = Math.min(Math.max((progress - 0.42) / 0.24, 0), 1); // 0 -> 1
    rotX = 64 - 36 * t; // 64 -> 28
    rotY = -22 - 18 * t; // -22 -> -40
    rotZ = 36 - 4 * t;  // 36 -> 32
    scale = 1.05 - 0.05 * t;

    // Exploding apart along central axis
    z0 = 120 * t;
    z1 = -35 + 45 * t;
    z2 = -70;
    z3 = -115 - 45 * t;
    z4 = -160 - 90 * t;
    z5 = -210 - 140 * t;

    leaderOpacity = t < 0.15 ? t / 0.15 : t > 0.85 ? Math.max(0, (1 - t) / 0.15) : 1;
  } else if (progress <= 0.88) {
    // -------------------------------------------------------------
    // STAGE 3: Production Systems Hologram (Projects)
    // -------------------------------------------------------------
    const t = Math.min(Math.max((progress - 0.66) / 0.22, 0), 1); // 0 -> 1
    rotX = 28 - 18 * t; // 28 -> 10
    rotY = -40 + 28 * t; // -40 -> -12
    rotZ = 32 - 27 * t; // 32 -> 5
    scale = 1;

    // Cylinder parts contract smoothly back
    const inv = Math.max(0, 1 - t * 1.5);
    z0 = 120 * inv;
    z1 = 10 * inv;
    z2 = -70 * inv;
    z3 = -160 * inv;
    z4 = -250 * inv;
    z5 = -350 * inv;

    leaderOpacity = 0;
  } else {
    // -------------------------------------------------------------
    // STAGE 4: Interactive Motion Lab & Terminal Radar
    // -------------------------------------------------------------
    const t = Math.min(Math.max((progress - 0.88) / 0.12, 0), 1); // 0 -> 1
    rotX = 10 * (1 - t);
    rotY = -12 * (1 - t);
    rotZ = 5 * (1 - t);
    scale = 1;

    z0 = 0;
    z1 = -5;
    z2 = -10;
    z3 = -15;
    z4 = -20;
    z5 = -25;

    radarOpacity = t < 0.15 ? t / 0.15 : 1;
  }

  // Trigger easing test animation
  const testEasing = (easeName: string) => {
    setActiveEasing(easeName);
    if (!orbRef.current) return;
    animate(orbRef.current, {
      translateX: [0, 270, 0],
      duration: 1200,
      ease: easeName,
    });
  };

  useEffect(() => {
    if (radarOpacity > 0.5 && orbRef.current) {
      testEasing(activeEasing);
    }
  }, [radarOpacity]);

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
              <pattern id="frontRaster" width="8" height="4" patternUnits="userSpaceOnUse">
                <line x1="0" y1="2" x2="8" y2="2" stroke="#ff4b4b" strokeWidth="1.5" opacity="0.65" />
              </pattern>
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

            {/* Center diamond raster */}
            <rect
              x="115"
              y="115"
              width="90"
              height="90"
              rx="16"
              fill="url(#frontRaster)"
              stroke="#ff4b4b"
              strokeWidth="1.8"
              transform="rotate(45 160 160)"
            />

            {/* Animated sine dots */}
            {Array.from({ length: 16 }).map((_, i) => {
              const x = 70 + i * 11;
              const y = 138 + Math.sin(i * 0.45) * 10;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2.8"
                  fill="#ff4b4b"
                />
              );
            })}
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

      {/* -------------------------------------------------------------
          INTERACTIVE RADAR DIAL (Stage 4: Motion Lab)
          ------------------------------------------------------------- */}
      <div
        className={styles.radarDialOverlay}
        style={{
          opacity: radarOpacity,
          pointerEvents: radarOpacity > 0.5 ? 'auto' : 'none',
          transform: `scale(${0.9 + radarOpacity * 0.1})`,
        }}
      >
        <div className={styles.radarDialBox}>
          <div className={styles.radarHeader}>
            <span className={styles.radarTitle}>KINETIC ENGINE // EASING TEST</span>
            <Sparkles size={13} color="#00ffaa" />
          </div>

          <div className={styles.radarTrackBox}>
            <div ref={orbRef} className={styles.radarIndicatorOrb} />
          </div>

          <div className={styles.radarEasingGrid}>
            {[
              { id: 'outElastic(1, 0.5)', label: 'outElastic' },
              { id: 'inOutQuad', label: 'inOutQuad' },
              { id: 'cubicBezier(0.16, 1, 0.3, 1)', label: 'outExpo' },
              { id: 'steps(6)', label: 'steps(6)' },
            ].map((ease) => (
              <button
                key={ease.id}
                type="button"
                className={`${styles.radarEasingBtn} ${activeEasing === ease.id ? styles.radarEasingBtnActive : ''}`}
                onClick={() => testEasing(ease.id)}
              >
                <span>{ease.label}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>&gt;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
