import React, { useRef, useEffect } from 'react';
import styles from './CyberneticGlobe3D.module.css';

interface CyberneticGlobe3DProps {
  rotationAngle?: number;
  activeProjectIndex: number;
  totalProjects: number;
  activeProjectTitle: string;
}

// 3D Cybernetic nodes distributed across world coordinates (lat, lon in degrees)
const CYBER_NODES = [
  // North America
  { lat: 40.7, lon: -74.0, name: 'NYC', color: '#00ffaa' },
  { lat: 37.7, lon: -122.4, name: 'SF', color: '#ff4b4b' },
  { lat: 45.5, lon: -73.5, name: 'MTL', color: '#33b3f1' },
  { lat: 34.0, lon: -118.2, name: 'LA', color: '#ffcc2a' },
  { lat: 41.8, lon: -87.6, name: 'CHI', color: '#00ffaa' },
  { lat: 47.6, lon: -122.3, name: 'SEA', color: '#00ffaa' },
  { lat: 30.2, lon: -97.7, name: 'ATX', color: '#ff4b4b' },

  // Europe
  { lat: 51.5, lon: -0.1, name: 'LDN', color: '#ff4b4b' },
  { lat: 48.8, lon: 2.3, name: 'PAR', color: '#00ffaa' },
  { lat: 52.5, lon: 13.4, name: 'BER', color: '#33b3f1' },
  { lat: 52.3, lon: 4.9, name: 'AMS', color: '#00ffaa' },
  { lat: 50.1, lon: 8.6, name: 'FRA', color: '#ffcc2a' },
  { lat: 59.3, lon: 18.0, name: 'STO', color: '#33b3f1' },
  { lat: 47.3, lon: 8.5, name: 'ZRH', color: '#00ffaa' },

  // Asia / Oceania
  { lat: 35.6, lon: 139.6, name: 'TYO', color: '#ff4b4b' },
  { lat: 1.3, lon: 103.8, name: 'SIN', color: '#00ffaa' },
  { lat: 22.3, lon: 114.1, name: 'HKG', color: '#33b3f1' },
  { lat: 37.5, lon: 126.9, name: 'SEL', color: '#ffcc2a' },
  { lat: 19.0, lon: 72.8, name: 'BOM', color: '#ff4b4b' },
  { lat: 12.9, lon: 77.5, name: 'BLR', color: '#00ffaa' },
  { lat: -33.8, lon: 151.2, name: 'SYD', color: '#33b3f1' },
  { lat: -37.8, lon: 144.9, name: 'MEL', color: '#00ffaa' },

  // South America & Africa
  { lat: -23.5, lon: -46.6, name: 'SAO', color: '#ffcc2a' },
  { lat: -34.6, lon: -58.3, name: 'BUE', color: '#33b3f1' },
  { lat: -33.9, lon: 18.4, name: 'CPT', color: '#00ffaa' },
  { lat: 25.2, lon: 55.2, name: 'DXB', color: '#ff4b4b' },

  // Cluster density points (cybernetic grid)
  { lat: 60.0, lon: -100.0, name: '', color: '#00ffaa' },
  { lat: 65.0, lon: -20.0, name: '', color: '#33b3f1' },
  { lat: 25.0, lon: 100.0, name: '', color: '#ff4b4b' },
  { lat: -10.0, lon: -60.0, name: '', color: '#00ffaa' },
  { lat: 10.0, lon: 20.0, name: '', color: '#33b3f1' },
  { lat: -20.0, lon: 130.0, name: '', color: '#00ffaa' },
  { lat: 35.0, lon: 40.0, name: '', color: '#ffcc2a' },
  { lat: -15.0, lon: 45.0, name: '', color: '#33b3f1' },
  { lat: 55.0, lon: 60.0, name: '', color: '#00ffaa' },
  { lat: 70.0, lon: 40.0, name: '', color: '#33b3f1' },
];

export const CyberneticGlobe3D: React.FC<CyberneticGlobe3DProps> = ({
  rotationAngle = 0,
  activeProjectIndex,
  totalProjects,
  activeProjectTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spinRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Size parameters: Increased by 50% from 340 to 510
    const width = 510;
    const height = 510;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const cx = width / 2;
    const cy = height / 2;
    const R = 177; // Sphere radius in pixels (118 * 1.5 = 177)

    // Earth-like axial tilt (in radians)
    const tiltZ = (23.4 * Math.PI) / 180; // 23.4 deg tilt
    const pitchX = (14 * Math.PI) / 180; // 14 deg tilt towards camera

    const cosTilt = Math.cos(tiltZ);
    const sinTilt = Math.sin(tiltZ);
    const cosPitch = Math.cos(pitchX);
    const sinPitch = Math.sin(pitchX);

    // 3D coordinate projection function
    const project3D = (x0: number, y0: number, z0: number) => {
      // 1. Axial tilt around Z
      const x1 = x0 * cosTilt - y0 * sinTilt;
      const y1 = x0 * sinTilt + y0 * cosTilt;
      const z1 = z0;

      // 2. Pitch tilt around X (towards camera)
      const x2 = x1;
      const y2 = y1 * cosPitch - z1 * sinPitch;
      const z2 = y1 * sinPitch + z1 * cosPitch;

      return {
        sx: cx + x2,
        sy: cy - y2,
        z: z2,
      };
    };

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Spin continuously around its own axis at ~22 deg/second
      spinRef.current += 0.38 * dt;
      const currentSpin = spinRef.current + (rotationAngle * Math.PI) / 180;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 1. Draw Background Space / Outer Atmosphere Glow
      // -------------------------------------------------------------
      const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.35);
      outerGlow.addColorStop(0, 'rgba(0, 255, 170, 0.16)');
      outerGlow.addColorStop(0.5, 'rgba(255, 75, 75, 0.08)');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // -------------------------------------------------------------
      // 2. Draw Back Half of Planetary Orbit Rings (Z < 0)
      // -------------------------------------------------------------
      const ringSteps = 72;
      const ringRadii = [R * 1.28, R * 1.42];

      ringRadii.forEach((rRing, rIdx) => {
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= ringSteps; i++) {
          const theta = (i / ringSteps) * Math.PI * 2;
          const x0 = rRing * Math.cos(theta);
          const y0 = 0; // Equatorial plane
          const z0 = rRing * Math.sin(theta);
          const p = project3D(x0, y0, z0);

          if (p.z < 0) {
            if (first) {
              ctx.moveTo(p.sx, p.sy);
              first = false;
            } else {
              ctx.lineTo(p.sx, p.sy);
            }
          } else {
            first = true;
          }
        }
        ctx.strokeStyle = rIdx === 0 ? 'rgba(0, 255, 170, 0.18)' : 'rgba(255, 75, 75, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // -------------------------------------------------------------
      // 3. Draw Dark Sphere Base with Spherical Lighting
      // -------------------------------------------------------------
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);

      // Spherical radial gradient (light source at top-left)
      const sphereGrad = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.35,
        R * 0.1,
        cx,
        cy,
        R
      );
      sphereGrad.addColorStop(0, '#262422');
      sphereGrad.addColorStop(0.4, '#191817');
      sphereGrad.addColorStop(0.8, '#100f0e');
      sphereGrad.addColorStop(1, '#080707');

      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Inner rim highlight / atmospheric rim light
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Clip inside sphere for all globe surface wireframes
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
      ctx.clip();

      // -------------------------------------------------------------
      // 4. Draw Latitude Parallels (Lines of Latitude)
      // -------------------------------------------------------------
      const lats = [-60, -40, -20, 0, 20, 40, 60];
      lats.forEach((latDeg) => {
        const latRad = (latDeg * Math.PI) / 180;
        const rLat = R * Math.cos(latRad);
        const yLat = R * Math.sin(latRad);

        ctx.beginPath();
        let hasStarted = false;

        for (let i = 0; i <= 64; i++) {
          const lonRad = (i / 64) * Math.PI * 2 + currentSpin;
          const x0 = rLat * Math.sin(lonRad);
          const y0 = yLat;
          const z0 = rLat * Math.cos(lonRad);
          const p = project3D(x0, y0, z0);

          // Only draw points on front visible hemisphere
          if (p.z > 0) {
            if (!hasStarted) {
              ctx.moveTo(p.sx, p.sy);
              hasStarted = true;
            } else {
              ctx.lineTo(p.sx, p.sy);
            }
          } else {
            hasStarted = false;
          }
        }

        ctx.strokeStyle =
          latDeg === 0
            ? 'rgba(0, 255, 170, 0.45)' // Equator highlighted
            : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = latDeg === 0 ? 1.5 : 0.8;
        ctx.stroke();
      });

      // -------------------------------------------------------------
      // 5. Draw Longitude Meridians (Lines of Longitude rotating around axis)
      // -------------------------------------------------------------
      const meridianCount = 12;
      for (let m = 0; m < meridianCount; m++) {
        const lonOffset = (m / meridianCount) * Math.PI * 2 + currentSpin;

        ctx.beginPath();
        let hasStarted = false;

        for (let i = 0; i <= 48; i++) {
          const latRad = (-Math.PI / 2) + (i / 48) * Math.PI;
          const x0 = R * Math.cos(latRad) * Math.sin(lonOffset);
          const y0 = R * Math.sin(latRad);
          const z0 = R * Math.cos(latRad) * Math.cos(lonOffset);
          const p = project3D(x0, y0, z0);

          if (p.z > 0) {
            if (!hasStarted) {
              ctx.moveTo(p.sx, p.sy);
              hasStarted = true;
            } else {
              ctx.lineTo(p.sx, p.sy);
            }
          } else {
            hasStarted = false;
          }
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 6. Draw Cybernetic Network Arcs across globe
      // -------------------------------------------------------------
      for (let i = 0; i < CYBER_NODES.length - 1; i += 2) {
        const n1 = CYBER_NODES[i];
        const n2 = CYBER_NODES[i + 1];

        const lat1 = (n1.lat * Math.PI) / 180;
        const lon1 = (n1.lon * Math.PI) / 180 + currentSpin;
        const p1 = project3D(
          R * Math.cos(lat1) * Math.sin(lon1),
          R * Math.sin(lat1),
          R * Math.cos(lat1) * Math.cos(lon1)
        );

        const lat2 = (n2.lat * Math.PI) / 180;
        const lon2 = (n2.lon * Math.PI) / 180 + currentSpin;
        const p2 = project3D(
          R * Math.cos(lat2) * Math.sin(lon2),
          R * Math.sin(lat2),
          R * Math.cos(lat2) * Math.cos(lon2)
        );

        // If both nodes are visible on the front hemisphere, draw high-tech arc
        if (p1.z > 5 && p2.z > 5) {
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          const midX = (p1.sx + p2.sx) / 2;
          const midY = (p1.sy + p2.sy) / 2 - 12;
          ctx.quadraticCurveTo(midX, midY, p2.sx, p2.sy);
          ctx.strokeStyle = 'rgba(0, 255, 170, 0.25)';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // 7. Draw Cybernetic Data Nodes & Glowing Beacons
      // -------------------------------------------------------------
      CYBER_NODES.forEach((node) => {
        const latRad = (node.lat * Math.PI) / 180;
        const lonRad = (node.lon * Math.PI) / 180 + currentSpin;

        const x0 = R * Math.cos(latRad) * Math.sin(lonRad);
        const y0 = R * Math.sin(latRad);
        const z0 = R * Math.cos(latRad) * Math.cos(lonRad);

        const p = project3D(x0, y0, z0);

        if (p.z > 0) {
          const depthRatio = Math.max(0, p.z / R);
          const size = 2.4 + depthRatio * 2.4;
          const alpha = 0.3 + depthRatio * 0.7;

          // Outer beacon pulse
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = node.color === '#ff4b4b'
            ? `rgba(255, 75, 75, ${0.15 * alpha})`
            : `rgba(0, 255, 170, ${0.15 * alpha})`;
          ctx.fill();

          // Node core
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Node label for major hubs
          if (node.name && depthRatio > 0.45) {
            ctx.font = '600 8.5px monospace';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
            ctx.fillText(node.name, p.sx + 5, p.sy - 4);
          }
        }
      });

      // -------------------------------------------------------------
      // 8. Tilted Axis Spindle (North & South Poles)
      // -------------------------------------------------------------
      const northPole = project3D(0, R * 1.15, 0);
      const southPole = project3D(0, -R * 1.15, 0);

      ctx.beginPath();
      ctx.moveTo(northPole.sx, northPole.sy);
      ctx.lineTo(southPole.sx, southPole.sy);
      ctx.strokeStyle = 'rgba(255, 75, 75, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore(); // Restore clip inside sphere

      // -------------------------------------------------------------
      // 9. Draw Front Half of Planetary Orbit Rings (Z > 0)
      // -------------------------------------------------------------
      ringRadii.forEach((rRing, rIdx) => {
        ctx.beginPath();
        let first = true;
        for (let i = 0; i <= ringSteps; i++) {
          const theta = (i / ringSteps) * Math.PI * 2;
          const x0 = rRing * Math.cos(theta);
          const y0 = 0;
          const z0 = rRing * Math.sin(theta);
          const p = project3D(x0, y0, z0);

          if (p.z >= 0) {
            if (first) {
              ctx.moveTo(p.sx, p.sy);
              first = false;
            } else {
              ctx.lineTo(p.sx, p.sy);
            }
          } else {
            first = true;
          }
        }
        ctx.strokeStyle = rIdx === 0 ? 'rgba(0, 255, 170, 0.65)' : 'rgba(255, 75, 75, 0.5)';
        ctx.lineWidth = rIdx === 0 ? 1.5 : 1;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // -------------------------------------------------------------
      // 10. Polar Axis Beacon Caps
      // -------------------------------------------------------------
      [northPole, southPole].forEach((pole) => {
        ctx.beginPath();
        ctx.arc(pole.sx, pole.sy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4b4b';
        ctx.shadowColor = '#ff4b4b';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [rotationAngle]);

  return (
    <div className={styles.globeContainer} aria-label="3D Rotating Cybernetic Globe">
      {/* Outer ambient glow ring */}
      <div className={styles.globeAmbientRing} />

      {/* The 3D Canvas rendering the rotating globe */}
      <canvas ref={canvasRef} className={styles.globeCanvas} />

      {/* Futuristic Telemetry Tag */}
      <div className={styles.telemetryTag}>
        <span className={styles.encoderLabel}>
          3D PLANETARY CORE // AXIAL TILT 23.4&deg;
        </span>
        <span className={styles.projectIndex}>
          ACTIVE UNIT [{String(activeProjectIndex + 1).padStart(2, '0')} / {String(totalProjects).padStart(2, '0')}]
        </span>
        <span className={styles.projectTitleTruncated}>
          {activeProjectTitle}
        </span>
      </div>
    </div>
  );
};
