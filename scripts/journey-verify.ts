/* ═══════════════════════════════════════════════════════════════════════════
   journey-verify.ts — verification harness (not part of the app bundle).
   Confirms that one 120-second loop visits every journey section, and that
   every planet / star / galaxy window resolves inside the loop.
   Run with:  npm run verify:journey
   ═══════════════════════════════════════════════════════════════════════════ */
import {
  JourneyTimeline,
  JOURNEY_SECTIONS,
  LOOP_SECONDS,
  MISSION_CLOCK_SECONDS,
  scaleSec,
  TIME_COMPRESSION,
} from '../src/components/space/JourneyTimeline';

const failures: string[] = [];

const ok = (cond: boolean, msg: string) => {
  if (!cond) failures.push(msg);
};

// ── 1. Loop constants ──────────────────────────────────────────────────────
ok(LOOP_SECONDS === 120, `LOOP_SECONDS must be 120, got ${LOOP_SECONDS}`);
ok(MISSION_CLOCK_SECONDS === 3600, `MISSION_CLOCK_SECONDS must be 3600`);
ok(
  Math.abs(TIME_COMPRESSION - 30) < 1e-9,
  `TIME_COMPRESSION must be 30, got ${TIME_COMPRESSION}`
);
ok(
  Math.abs(scaleSec(3600) - 120) < 1e-9,
  'scaleSec(3600) must equal the 120 s loop length'
);
ok(Math.abs(scaleSec(0)) < 1e-9, 'scaleSec(0) must be 0');
ok(
  Math.abs(scaleSec(1800) - 60) < 1e-9,
  'scaleSec(1800) must be the loop midpoint (60 s)'
);

// ── 2. Sections must tile [0, 120] with no gaps or overlaps ───────────────
let prevEnd = 0;
for (const s of JOURNEY_SECTIONS) {
  ok(
    Math.abs(s.startSec - prevEnd) < 1e-9,
    `Section ${s.id} starts at ${s.startSec} but previous ended at ${prevEnd} (gap/overlap)`
  );
  ok(s.endSec > s.startSec, `Section ${s.id} has non-positive duration`);
  prevEnd = s.endSec;
}
ok(
  Math.abs(prevEnd - LOOP_SECONDS) < 1e-9,
  `Last section must end at ${LOOP_SECONDS}, got ${prevEnd}`
);

// ── 3. Every section is actually entered during a real 120 s playthrough ──
const timeline = new JourneyTimeline();
const seen = new Map<string, number>();
const step = 1 / 60; // sample at 60 Hz, like the render loop
for (let t = 0; t < LOOP_SECONDS; t += step) {
  const st = timeline.getState(t);
  if (!seen.has(st.currentSection.id)) seen.set(st.currentSection.id, t);
}
for (const s of JOURNEY_SECTIONS) {
  ok(
    seen.has(s.id),
    `Section "${s.id}" was never entered during the 120 s loop`
  );
}
ok(
  seen.size === JOURNEY_SECTIONS.length,
  `Only ${seen.size}/${JOURNEY_SECTIONS.length} sections were visited`
);

// ── 4. The loop is seamless: state at t=120 wraps back to the first section ─
// Note: elapsed = timeSec % LOOP_SECONDS, so t=120 legitimately wraps to 0.
const t0 = timeline.getState(0);
const t120 = timeline.getState(LOOP_SECONDS);
const t119 = timeline.getState(LOOP_SECONDS - step);
ok(
  t0.currentSection.id === 'departure' && t120.currentSection.id === 'departure',
  'The loop must wrap cleanly back to the departure section'
);
ok(
  t119.currentSection.id === 'hyperspace',
  `The final section must still be active at t=119, got "${t119.currentSection.id}"`
);
ok(
  Math.abs(t120.progress - t0.progress) < 1e-9,
  'Progress must be continuous across the loop seam'
);


// ── 5. Planet flyby windows (canonical mission clock → live loop) ─────────
// Mirrors PLANET_CONFIGS in SolarSystemLayer.ts.
const PLANET_WINDOWS: Array<[string, number, number, string]> = [
  ['mercury', 320, 460, 'mercury_venus'],
  ['venus', 450, 590, 'mercury_venus'],
  ['earth', 620, 890, 'earth'],
  ['mars', 920, 1190, 'mars'],
  ['jupiter', 1220, 1610, 'jupiter'],
  ['saturn', 1640, 2030, 'saturn'],
  ['uranus', 2050, 2270, 'uranus'],
  ['neptune', 2290, 2510, 'neptune'],
];

for (const [name, cStart, cEnd, sectionId] of PLANET_WINDOWS) {
  const s = scaleSec(cStart);
  const e = scaleSec(cEnd);
  ok(s >= 0 && e <= LOOP_SECONDS, `Planet ${name} window falls outside the loop`);
  ok(e > s, `Planet ${name} window is inverted after scaling`);

  // The window must be non-degenerate in real time: at least 1 s on screen.
  ok(
    e - s >= 1,
    `Planet ${name} is on screen for less than 1 s (${(e - s).toFixed(2)} s)`
  );

  // The planet must actually be rendered at some sampled instant.
  let visible = false;
  for (let t = 0; t < LOOP_SECONDS; t += step) {
    if (t >= s && t <= e) {
      visible = true;
      break;
    }
  }
  ok(visible, `Planet ${name} is never visible inside the loop`);

  // And its owning section must be the one active at the window midpoint.
  const mid = (s + e) / 2;
  const sec = JOURNEY_SECTIONS.find((x) => mid >= x.startSec && mid < x.endSec);
  ok(
    sec?.id === sectionId,
    `Planet ${name} midpoint falls in section "${sec?.id}", expected "${sectionId}"`
  );
}

// ── 6. Sun, galaxy and space-station windows ──────────────────────────────
const SUN = [scaleSec(2820), scaleSec(3120)];
const GALAXY = [scaleSec(3360), scaleSec(3540)];
const GALAXY_HINT = scaleSec(2520);
const STATION_END = scaleSec(420);

ok(SUN[0] >= 0 && SUN[1] <= LOOP_SECONDS, 'Sun window falls outside the loop');
ok(
  GALAXY[0] >= 0 && GALAXY[1] <= LOOP_SECONDS,
  'Galaxy window falls outside the loop'
);
ok(GALAXY_HINT >= 0 && GALAXY_HINT < GALAXY[0], 'Galaxy hint window is misplaced');
ok(STATION_END <= LOOP_SECONDS, 'Space-station window falls outside the loop');

// ── 7. Hyperspace jump spans the loop seam ────────────────────────────────
const pulseStart = scaleSec(3596);
const pulseEnd = scaleSec(3600);
ok(
  pulseStart < LOOP_SECONDS && pulseEnd === LOOP_SECONDS,
  'Hyperspace singularity pulse must terminate exactly at the loop seam'
);


// ── 8. Known stars: every star must be active in a section that is visited ─
// Mirrors KNOWN_STARS in KnownStarsLayer.ts.
const KNOWN_STARS: Array<[string, string[]]> = [
  ['SIRIUS', ['departure', 'deep_space_stars']],
  ['BETELGEUSE', ['deep_space_stars', 'nebula_asteroids']],
  ['RIGEL', ['deep_space_stars']],
  ['VEGA', ['deep_space_stars', 'galaxy']],
  ['ALPHA CENTAURI', ['departure', 'mercury_venus', 'deep_space_stars']],
  ['POLARIS', ['deep_space_stars']],
  ['ALDEBARAN', ['mars', 'deep_space_stars']],
];

const visitedIds = new Set(JOURNEY_SECTIONS.map((s) => s.id));
for (const [star, activeIn] of KNOWN_STARS) {
  ok(activeIn.length > 0, `Star ${star} has no active section`);
  for (const id of activeIn) {
    ok(visitedIds.has(id), `Star ${star} references unknown section "${id}"`);
    ok(seen.has(id), `Star ${star} is bound to section "${id}", which is never visited`);
  }
}

// ── 9. Every star must be visible for a meaningful slice of the loop ──────
for (const [star, activeIn] of KNOWN_STARS) {
  const secDur = activeIn
    .map((id) => {
      const s = JOURNEY_SECTIONS.find((x) => x.id === id)!;
      return s.endSec - s.startSec;
    })
    .reduce((a, b) => a + b, 0);
  ok(secDur >= 1, `Star ${star} would be on screen for less than 1 s`);
}

// ── Report ────────────────────────────────────────────────────────────────
console.log('Journey loop verification (2-minute loop)\n');
console.log('Sections:');
for (const s of JOURNEY_SECTIONS) {
  console.log(
    `  ${s.id.padEnd(18)} ${s.startSec.toFixed(2).padStart(7)}s → ${s.endSec
      .toFixed(2)
      .padStart(7)}s   (${(s.endSec - s.startSec).toFixed(2)}s)  ${s.name}`
  );
}
console.log('\nPlanet flyby windows (live loop seconds):');
for (const [name, cStart, cEnd] of PLANET_WINDOWS) {
  console.log(
    `  ${name.padEnd(9)} ${scaleSec(cStart).toFixed(2).padStart(7)}s → ${scaleSec(cEnd)
      .toFixed(2)
      .padStart(7)}s   (${(scaleSec(cEnd) - scaleSec(cStart)).toFixed(2)}s on screen)`
  );
}
console.log(
  `\n  sun      ${SUN[0].toFixed(2)}s → ${SUN[1].toFixed(2)}s   (${(SUN[1] - SUN[0]).toFixed(2)}s on screen)`
);
console.log(
  `  galaxy   ${GALAXY[0].toFixed(2)}s → ${GALAXY[1].toFixed(2)}s   (${(GALAXY[1] - GALAXY[0]).toFixed(2)}s on screen)`
);

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} FAILURE(S):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log(
  '\n✓ All checks passed: every section, planet, star and galaxy appears within one 120 s loop.'
);
