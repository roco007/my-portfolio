/* ═══════════════════════════════════════════════════════════════════════════
   GalaxyLayer — Breathtaking Grand-Design Spiral Galaxy (56:00 – 59:00).
   Renders a Milky-Way-class barred spiral with:
   - Supermassive Black Hole AGN/Quasar core with accretion glow
   - Incandescent elliptical bulge with color gradient old-star population
   - 4 logarithmic spiral arms seeded with H II star-forming knots
   - Dark interstellar dust lanes cutting between stellar arms
   - Outer stellar halo diffuse blue ring
   - 2 satellite dwarf galaxies (LMC/SMC analogue)
   Pre-rendered offscreen buffer with slow galactic rotation.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { scaleSec } from './JourneyTimeline';

export class GalaxyLayer implements SpaceLayer {
  private offscreen: HTMLCanvasElement | null = null;
  private offSize = 500;

  init(_state: SceneState): void {
    if (!this.offscreen) {
      this.offscreen = document.createElement('canvas');
      this.offscreen.width = this.offSize;
      this.offscreen.height = this.offSize;
      this.renderGalaxyTexture();
    }
  }

  private renderGalaxyTexture(): void {
    if (!this.offscreen) return;
    const g = this.offscreen.getContext('2d');
    if (!g) return;

    const size = this.offSize;
    const cx = size * 0.5;
    const cy = size * 0.5;

    g.clearRect(0, 0, size, size);

    // ── 1. Outer stellar halo ─────────────────────────────────────────────
    const outerHalo = g.createRadialGradient(cx, cy, size * 0.22, cx, cy, size * 0.5);
    outerHalo.addColorStop(0, 'rgba(80, 110, 200, 0.10)');
    outerHalo.addColorStop(0.5, 'rgba(60, 90, 170, 0.05)');
    outerHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = outerHalo;
    g.beginPath();
    g.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
    g.fill();

    // ── 2. Diffuse Galactic Halo ──────────────────────────────────────────
    const halo = g.createRadialGradient(cx, cy, 4, cx, cy, size * 0.44);
    halo.addColorStop(0, 'rgba(255, 248, 230, 0.55)');
    halo.addColorStop(0.08, 'rgba(255, 235, 200, 0.38)');
    halo.addColorStop(0.22, 'rgba(220, 230, 255, 0.20)');
    halo.addColorStop(0.42, 'rgba(140, 175, 245, 0.10)');
    halo.addColorStop(0.70, 'rgba(70, 110, 200, 0.04)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = halo;
    g.beginPath();
    g.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
    g.fill();

    // ── 3. Four Logarithmic Spiral Arms ───────────────────────────────────
    const numArms = 4;
    const pointsPerArm = 600;

    // Colors: young blue OB associations, pink H II regions, older yellow clusters
    const armColorSets = [
      ['rgba(160, 210, 255, 0.38)', 'rgba(200, 230, 255, 0.28)', 'rgba(255, 220, 200, 0.18)'],
      ['rgba(180, 220, 255, 0.32)', 'rgba(215, 235, 255, 0.24)', 'rgba(255, 210, 180, 0.16)'],
    ];

    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (arm * Math.PI * 2) / numArms;
      const colorSet = armColorSets[arm % 2];

      for (let i = 0; i < pointsPerArm; i++) {
        const t = i / pointsPerArm;
        // Logarithmic spiral: r = a * e^(b*theta)
        const theta = armOffset + t * Math.PI * 3.5;
        const dist = 14 + Math.pow(t, 1.2) * (size * 0.41);

        // Natural dispersion increases with radius
        const spread = Math.pow(t, 0.75) * 18;
        const randAngle = Math.random() * Math.PI * 2;
        const randDist = Math.pow(Math.random(), 0.5) * spread;

        const x = cx + Math.cos(theta) * dist + Math.cos(randAngle) * randDist;
        const y = cy + Math.sin(theta) * dist + Math.sin(randAngle) * randDist;

        const starR = 0.45 + Math.random() * 1.6;
        const col = colorSet[Math.floor(Math.random() * colorSet.length)];

        g.fillStyle = col;
        g.beginPath();
        g.arc(x, y, starR, 0, Math.PI * 2);
        g.fill();

        // Magenta H II starburst knots
        if (Math.random() < 0.055 && dist > 35) {
          g.globalCompositeOperation = 'screen';
          g.fillStyle = 'rgba(255, 100, 210, 0.5)';
          g.beginPath();
          g.arc(x, y, starR * 2.8, 0, Math.PI * 2);
          g.fill();
          g.globalCompositeOperation = 'source-over';
        }

        // Blue O-star clusters
        if (Math.random() < 0.04 && dist > 25) {
          g.fillStyle = 'rgba(140, 200, 255, 0.55)';
          g.beginPath();
          g.arc(x, y, starR * 2.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    }

    // ── 4. Dark Interstellar Dust Lanes ───────────────────────────────────
    g.globalCompositeOperation = 'multiply';
    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (arm * Math.PI * 2) / numArms + 0.3;

      for (let i = 0; i < 120; i++) {
        const t = i / 120;
        const theta = armOffset + t * Math.PI * 3.5;
        const dist = 18 + Math.pow(t, 1.2) * (size * 0.36);
        const x = cx + Math.cos(theta) * dist;
        const y = cy + Math.sin(theta) * dist;

        const dustR = 4 + t * 12;
        const dustAlpha = 0.07 + t * 0.08;
        g.fillStyle = `rgba(8, 6, 18, ${dustAlpha.toFixed(3)})`;
        g.beginPath();
        g.arc(x, y, dustR, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';

    // ── 5. Galactic Bar (central bar feature of barred spirals) ──────────
    const barGrad = g.createLinearGradient(cx - size * 0.18, cy, cx + size * 0.18, cy);
    barGrad.addColorStop(0, 'rgba(255, 235, 180, 0)');
    barGrad.addColorStop(0.3, 'rgba(255, 240, 195, 0.28)');
    barGrad.addColorStop(0.5, 'rgba(255, 245, 210, 0.42)');
    barGrad.addColorStop(0.7, 'rgba(255, 240, 195, 0.28)');
    barGrad.addColorStop(1, 'rgba(255, 235, 180, 0)');
    g.fillStyle = barGrad;
    g.save();
    g.translate(cx, cy);
    g.rotate(0.35);
    g.fillRect(-size * 0.18, -size * 0.048, size * 0.36, size * 0.096);
    g.restore();

    // ── 6. Dense Core Bulge (old red/yellow stellar population) ──────────
    const bulge = g.createRadialGradient(cx, cy, 0, cx, cy, size * 0.12);
    bulge.addColorStop(0, 'rgba(255, 252, 240, 0.95)');
    bulge.addColorStop(0.2, 'rgba(255, 240, 195, 0.75)');
    bulge.addColorStop(0.55, 'rgba(255, 210, 140, 0.40)');
    bulge.addColorStop(0.85, 'rgba(240, 180, 100, 0.15)');
    bulge.addColorStop(1, 'rgba(200, 140, 70, 0)');
    g.fillStyle = bulge;
    g.beginPath();
    g.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
    g.fill();

    // ── 7. AGN / Quasar Core accretion glow ──────────────────────────────
    // Active galactic nucleus — hot blue-white inner disk
    const agn = g.createRadialGradient(cx, cy, 0, cx, cy, 22);
    agn.addColorStop(0, '#ffffff');
    agn.addColorStop(0.15, '#f0f8ff');
    agn.addColorStop(0.45, 'rgba(200, 220, 255, 0.8)');
    agn.addColorStop(0.8, 'rgba(160, 190, 255, 0.35)');
    agn.addColorStop(1, 'rgba(120, 160, 255, 0)');
    g.fillStyle = agn;
    g.beginPath();
    g.arc(cx, cy, 22, 0, Math.PI * 2);
    g.fill();

    // AGN relativistic jets (vertical)
    g.globalCompositeOperation = 'screen';
    for (const dir of [-1, 1]) {
      const jetGrad = g.createLinearGradient(cx, cy, cx, cy + dir * size * 0.3);
      jetGrad.addColorStop(0, 'rgba(200, 220, 255, 0.45)');
      jetGrad.addColorStop(0.5, 'rgba(160, 200, 255, 0.15)');
      jetGrad.addColorStop(1, 'rgba(120, 180, 255, 0)');
      g.strokeStyle = jetGrad;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + (Math.random() - 0.5) * 4, cy + dir * size * 0.3);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';

    // ── 8. Two satellite dwarf galaxies (LMC/SMC analogues) ──────────────
    const dwarfPositions = [
      { dx: size * 0.3, dy: size * 0.28, rx: 22, ry: 14, rot: 0.6 },
      { dx: -size * 0.25, dy: -size * 0.32, rx: 14, ry: 9, rot: -0.4 },
    ];
    for (const d of dwarfPositions) {
      const ddx = cx + d.dx;
      const ddy = cy + d.dy;
      const dGrad = g.createRadialGradient(ddx, ddy, 0, ddx, ddy, d.rx);
      dGrad.addColorStop(0, 'rgba(255, 245, 210, 0.65)');
      dGrad.addColorStop(0.4, 'rgba(220, 230, 255, 0.28)');
      dGrad.addColorStop(1, 'rgba(160, 185, 240, 0)');
      g.fillStyle = dGrad;
      g.save();
      g.translate(ddx, ddy);
      g.rotate(d.rot);
      g.beginPath();
      g.ellipse(0, 0, d.rx, d.ry, 0, 0, Math.PI * 2);
      g.fill();
      // Scattered stars within dwarf
      for (let s = 0; s < 60; s++) {
        const sa = Math.random() * Math.PI * 2;
        const sr = Math.random() * d.rx * 0.85;
        const sx2 = Math.cos(sa) * sr;
        const sy2 = Math.sin(sa) * sr * (d.ry / d.rx);
        g.fillStyle = `rgba(255, 250, 230, ${(0.15 + Math.random() * 0.45).toFixed(2)})`;
        g.beginPath();
        g.arc(sx2, sy2, 0.5 + Math.random() * 1.2, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  }

  draw(state: SceneState): void {
    const { ctx, theme, intensity, journey, width, height, time, mouse } = state;
    if (theme === 'light' || !this.offscreen) return;

    const elapsed = journey.elapsed;
    // Canonical mission-clock bounds mapped onto the live 2-minute loop.
    const galaxyStart = scaleSec(3360); // 56:00 → 01:52
    const galaxyEnd = scaleSec(3540);   // 59:00 → 01:58
    const hintStart = scaleSec(2520);   // 42:00 → 01:24

    const isGalaxySection = elapsed >= galaxyStart && elapsed <= galaxyEnd;
    const isDistantHint = elapsed >= hintStart && elapsed < galaxyStart;

    if (!isGalaxySection && !isDistantHint) return;

    let sectionAlpha = 0.15;
    if (isGalaxySection) {
      const prog = (elapsed - galaxyStart) / (galaxyEnd - galaxyStart);
      sectionAlpha = Math.sin(prog * Math.PI) * 0.9;
    }

    const effectiveAlpha = sectionAlpha * intensity;
    if (effectiveAlpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = effectiveAlpha;

    const px = mouse.x * 12 + journey.camera.swayX * 0.25;
    const py = mouse.y * 9 + journey.camera.swayY * 0.25;
    const gx = width * 0.70 + px;
    const gy = height * 0.36 + py;

    const rot = time * 0.012;
    const baseScale = isGalaxySection ? 1.55 : 0.75;
    const scale = (Math.min(width, height) / 800) * baseScale;

    ctx.translate(gx, gy);
    ctx.rotate(0.42);       // inclination
    ctx.scale(1.0, 0.40);   // elliptical foreshortening (inclined view)
    ctx.rotate(rot);

    ctx.drawImage(
      this.offscreen,
      -this.offSize * 0.5 * scale,
      -this.offSize * 0.5 * scale,
      this.offSize * scale,
      this.offSize * scale
    );

    ctx.restore();

    // Quasar core flash — subtle pulsing on top
    if (isGalaxySection) {
      const prog = (elapsed - 3360) / (3540 - 3360);
      const pulse = 0.5 + 0.5 * Math.sin(time * 3.5);
      const coreAlpha = Math.sin(prog * Math.PI) * 0.35 * pulse * intensity;
      const scale2 = (Math.min(width, height) / 800) * 1.55;

      ctx.save();
      ctx.globalAlpha = coreAlpha;
      // Position the quasar core
      ctx.translate(gx + px * 0.05, gy + py * 0.05);
      const qGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 25 * scale2);
      qGrad.addColorStop(0, '#ffffff');
      qGrad.addColorStop(0.3, 'rgba(200, 220, 255, 0.8)');
      qGrad.addColorStop(1, 'rgba(120, 160, 255, 0)');
      ctx.fillStyle = qGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 25 * scale2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  dispose(): void {
    this.offscreen = null;
  }
}
