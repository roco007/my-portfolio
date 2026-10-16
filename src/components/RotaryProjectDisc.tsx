import React from 'react';
import styles from './RotaryProjectDisc.module.css';

interface RotaryProjectDiscProps {
  rotationAngle: number;
  activeProjectIndex: number;
  totalProjects: number;
  activeProjectTitle: string;
}

export const RotaryProjectDisc: React.FC<RotaryProjectDiscProps> = ({
  rotationAngle,
  activeProjectIndex,
  totalProjects,
  activeProjectTitle,
}) => {
  return (
    <div className={styles.disc3DScene} aria-label="3D Cybernetic Rotary Turntable">
      {/* 3D Cybernetic Ground Shadow & Energy Floor Ring */}
      <div className={styles.floorShadow} />
      <div className={styles.floorEnergyRing} />

      {/* 3D Platter Base (Tilted in 3D Perspective) */}
      <div className={styles.platter3D}>
        {/* Cylindrical Extruded Rim Layers for Physical 3D Thickness */}
        <div className={styles.cylinderRimBase} />
        <div className={styles.cylinderRimMiddle} />
        <div className={styles.cylinderRimTop} />

        {/* Floating Holographic Laser Ring hovering in 3D above the platter */}
        <div className={styles.floatingHoloRing}>
          <svg viewBox="0 0 340 340" className={styles.svgHoloRing}>
            <circle
              cx="170"
              cy="170"
              r="165"
              fill="none"
              stroke="rgba(0, 255, 170, 0.4)"
              strokeWidth="1.5"
              strokeDasharray="6 12"
            />
            <circle
              cx="170"
              cy="170"
              r="154"
              fill="none"
              stroke="rgba(255, 75, 75, 0.3)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Rotating Top Plate with Anime.js Segmented Arcs and Ticks */}
        <div
          className={styles.rotatingTopPlate}
          style={{
            transform: `rotate(${rotationAngle.toFixed(1)}deg)`,
          }}
        >
          <svg
            viewBox="0 0 320 320"
            className={styles.svgDisc}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="disc3DBackdrop" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2c2a28" />
                <stop offset="60%" stopColor="#1e1d1c" />
                <stop offset="90%" stopColor="#141312" />
                <stop offset="100%" stopColor="#0c0b0a" />
              </radialGradient>
              <radialGradient id="innerCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 75, 75, 0.35)" />
                <stop offset="70%" stopColor="rgba(255, 75, 75, 0.05)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <pattern id="rotaryRaster3D" width="8" height="4" patternUnits="userSpaceOnUse">
                <line x1="0" y1="2" x2="8" y2="2" stroke="#ff4b4b" strokeWidth="1.5" opacity="0.8" />
              </pattern>
            </defs>

            {/* Outer Rim Ring */}
            <circle
              cx="160"
              cy="160"
              r="154"
              fill="url(#disc3DBackdrop)"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2"
            />

            {/* Segmented Neon Color Arcs (Anime.js signature palette) */}
            <path d="M 80,48 A 136 136 0 0 1 155,24" fill="none" stroke="#8dff55" strokeWidth="6" strokeLinecap="round" />
            <path d="M 165,24 A 136 136 0 0 1 240,48" fill="none" stroke="#ff4b4b" strokeWidth="6" strokeLinecap="round" />
            <path d="M 248,56 A 136 136 0 0 1 292,132" fill="none" stroke="#ffa828" strokeWidth="6" strokeLinecap="round" />
            <path d="M 296,156 A 136 136 0 0 1 272,240" fill="none" stroke="#00ffaa" strokeWidth="6" strokeLinecap="round" />
            <path d="M 264,252 A 136 136 0 0 1 165,296" fill="none" stroke="#33b3f1" strokeWidth="6" strokeLinecap="round" />
            <path d="M 155,296 A 136 136 0 0 1 56,248" fill="none" stroke="#a369ff" strokeWidth="6" strokeLinecap="round" />
            <path d="M 48,236 A 136 136 0 0 1 24,160" fill="none" stroke="#ffcc2a" strokeWidth="6" strokeLinecap="round" />
            <path d="M 24,152 A 136 136 0 0 1 72,56" fill="none" stroke="#ff718b" strokeWidth="6" strokeLinecap="round" />

            {/* 48 Calibration Ticks */}
            {Array.from({ length: 48 }).map((_, i) => {
              const angle = (i * 360) / 48;
              const isMajor = i % 4 === 0;
              return (
                <line
                  key={i}
                  x1="160"
                  y1={isMajor ? '34' : '40'}
                  x2="160"
                  y2="46"
                  stroke={isMajor ? '#ff4b4b' : 'rgba(255, 255, 255, 0.35)'}
                  strokeWidth={isMajor ? '2' : '1'}
                  transform={`rotate(${angle} 160 160)`}
                />
              );
            })}

            {/* Inner Recessed Bevel Circle */}
            <circle
              cx="160"
              cy="160"
              r="110"
              fill="#161514"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
            />
            <circle
              cx="160"
              cy="160"
              r="108"
              fill="url(#innerCoreGlow)"
            />

            {/* Center 45-degree Raster Diamond */}
            <rect
              x="115"
              y="115"
              width="90"
              height="90"
              rx="18"
              fill="url(#rotaryRaster3D)"
              stroke="#ff4b4b"
              strokeWidth="2.5"
              transform="rotate(45 160 160)"
              filter="drop-shadow(0 0 10px rgba(255, 75, 75, 0.6))"
            />

            {/* Animated Sine-Wave Dots */}
            {Array.from({ length: 16 }).map((_, i) => {
              const x = 75 + i * 11.5;
              const y = 142 + Math.sin(i * 0.45) * 9;
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
          </svg>
        </div>

        {/* 3D Top Needle Pointer */}
        <div className={styles.needlePointer3D} />
      </div>

      {/* Telemetry Readout Tag */}
      <div className={styles.telemetryTag}>
        <span className={styles.encoderLabel}>
          3D TURNTABLE // {Math.round(((rotationAngle % 360) + 360) % 360)}&deg;
        </span>
        <span className={styles.projectIndex}>
          UNIT [{String(activeProjectIndex + 1).padStart(2, '0')} / {String(totalProjects).padStart(2, '0')}]
        </span>
        <span className={styles.projectTitleTruncated}>
          {activeProjectTitle}
        </span>
      </div>
    </div>
  );
};
