/* ═══════════════════════════════════════════════════════════════════════════
   ForegroundParticleLayer — sparse drifting dust motes in the near field.
   These carry the strongest mouse parallax (~0.6x), reinforcing the sense
   that the viewer is looking through a window into depth. Kept very faint so
   they never compete with content.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { SceneState, SpaceLayer } from './types';
import { randRange } from './rng';

interface Mote {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
  phase: number;
  pulse: number;
}

export class ForegroundParticleLayer implements SpaceLayer {
  private motes: Mote[] = [];
  private width = 0;
  private height = 0;

  init(state: SceneState): void {
    const { width, height, rand, quality, theme } = state;
    this.width = width;
    this.height = height;
    this.motes = [];
    if (theme === 'light') return;

    const count = quality === 'low' ? 12 : quality === 'medium' ? 22 : 36;
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x: rand() * width,
        y: rand() * height,
        vx: randRange(rand, -3, 3),
        vy: randRange(rand, -1.5, 1.5),
        r: randRange(rand, 0.6, 2.2),
        alpha: randRange(rand, 0.05, 0.22),
        phase: rand() * Math.PI * 2,
        pulse: randRange(rand, 0.3, 1.0),
      });
    }
  }

  update(state: SceneState): void {
    const { dt } = state;
    for (const m of this.motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < -10) m.x = this.width + 10;
      else if (m.x > this.width + 10) m.x = -10;
      if (m.y < -10) m.y = this.height + 10;
      else if (m.y > this.height + 10) m.y = -10;
    }
  }

  draw(state: SceneState): void {
    const { ctx, mouse, scrollY, time, intensity, theme } = state;
    if (theme === 'light') return;
    ctx.save();
    for (const m of this.motes) {
      // Strong foreground parallax (~0.6x) + scroll drift.
      const ox = mouse.x * 34;
      const oy = mouse.y * 24 - scrollY * 0.1;
      const pulse = 0.7 + 0.3 * Math.sin(m.phase + time * m.pulse);
      ctx.globalAlpha = m.alpha * pulse * intensity;
      ctx.fillStyle = '#cfe6ff';
      ctx.beginPath();
      ctx.arc(m.x + ox, m.y + oy, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
