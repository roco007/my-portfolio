/* ═══════════════════════════════════════════════════════════════════════════
   SpaceWindowLayer — Spaceship Observation Window & Interior Telemetry.
   Transforms the viewport into the observation deck of a deep-space cruiser:
   - Subtle dark metallic perimeter bevel & soft corner vignette
   - Anti-reflective treated glass reflection sheen that catches celestial light
   - Precision HUD corner alignment brackets
   - Minimalist bridge instrumentation: Sector, Mission Chronometer, Velocity, Cycle
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';

export class SpaceWindowLayer implements SpaceLayer {
  init(_state: SceneState): void {}

  draw(state: SceneState): void {
    const { ctx, width, height, theme, intensity, journey } = state;
    if (theme === 'light') return;

    ctx.save();

    // ── 1. Soft Perimeter Vignette & Metallic Window Bevel ────────────────
    // Edge darkening to create depth beyond the viewport window
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.45,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.7, 'rgba(4, 8, 14, 0.25)');
    vig.addColorStop(1, 'rgba(2, 4, 8, 0.7)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // Central content protection overlay: soft subtle darkening behind text zone
    const contentDim = ctx.createRadialGradient(
      width * 0.35,
      height * 0.48,
      10,
      width * 0.35,
      height * 0.48,
      Math.min(width, height) * 0.72
    );
    contentDim.addColorStop(0, 'rgba(6, 10, 18, 0.38)');
    contentDim.addColorStop(0.65, 'rgba(4, 8, 14, 0.12)');
    contentDim.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = contentDim;
    ctx.fillRect(0, 0, width, height);

    // Subtle 1px interior bezel frame around the perimeter
    ctx.strokeStyle = 'rgba(70, 120, 180, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // ── 2. Glass Reflection Sheen ─────────────────────────────────────────
    // Diagonal glass reflection that glows when near bright celestial objects
    const sheenStrength = Math.max(0, (journey.ambientBrightness - 0.95) * 0.45);
    if (sheenStrength > 0.02) {
      ctx.save();
      ctx.globalAlpha = sheenStrength * intensity;
      const glassSheen = ctx.createLinearGradient(0, 0, width, height);
      glassSheen.addColorStop(0, 'rgba(160, 210, 255, 0)');
      glassSheen.addColorStop(0.28, 'rgba(200, 235, 255, 0.04)');
      glassSheen.addColorStop(0.3, 'rgba(255, 255, 255, 0.12)'); // reflection streak
      glassSheen.addColorStop(0.32, 'rgba(180, 225, 255, 0.03)');
      glassSheen.addColorStop(0.58, 'rgba(200, 235, 255, 0)');
      glassSheen.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');  // secondary streak
      glassSheen.addColorStop(0.62, 'rgba(180, 225, 255, 0)');
      glassSheen.addColorStop(1, 'rgba(140, 200, 255, 0)');
      ctx.fillStyle = glassSheen;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // ── 3. High-Tech Corner Alignment Brackets ────────────────────────────
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.28)';
    ctx.lineWidth = 1;
    const bracketSize = 24;
    const margin = 18;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(margin, margin + bracketSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + bracketSize, margin);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(width - margin - bracketSize, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, margin + bracketSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(margin, height - margin - bracketSize);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(margin + bracketSize, height - margin);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(width - margin - bracketSize, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(width - margin, height - margin - bracketSize);
    ctx.stroke();

    // ── 4. Elegant Spaceship Bridge Telemetry Readout ──────────────────────
    // Bottom-left corner (above mobile safe area and tucked unobtrusively)
    ctx.save();
    ctx.globalAlpha = 0.32 * intensity;
    ctx.fillStyle = 'rgba(160, 215, 255, 0.85)';
    ctx.font = '9px "JetBrains Mono", Menlo, monospace';

    const hudX = margin + 14;
    const hudY = height - margin - 32;

    if (width > 640) {
      // Desktop Telemetry
      ctx.fillText(`OBSERVATION DECK · VIEWPORT ALPHA // ${journey.currentSection.sectorCode}`, hudX, hudY);
      ctx.fillStyle = 'rgba(140, 180, 220, 0.65)';
      ctx.font = '8px "JetBrains Mono", Menlo, monospace';
      ctx.fillText(
        `CHRONO: ${journey.chronoString} · VELOCITY: ${journey.velocity} · CYCLE: ${String(journey.loopCount + 1).padStart(2, '0')} · HULL: 100%`,
        hudX,
        hudY + 12
      );
    } else {
      // Compact Mobile Telemetry
      ctx.fillText(`${journey.currentSection.sectorCode} · ${journey.chronoString}`, hudX, hudY + 12);
    }
    ctx.restore();

    ctx.restore();
  }
}
