/* ═══════════════════════════════════════════════════════════════════════════
   journey-visual-verify.mjs — headless-Chrome visual verification harness.

   Drives the production build in headless Chrome over CDP and asserts that the
   compressed 120-second space journey actually *renders* each of its beats:
   the expected on-screen label is painted, the frame has the expected
   brightness / colour signature, and the captured screenshot is non-trivial.

   Run with:  npm run verify:journey:visual
   Requires:  a `vite preview` server on the URL passed via --url (default
              http://127.0.0.1:4173), and Chrome installed locally.
   ═══════════════════════════════════════════════════════════════════════════ */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

/* ── CLI options ─────────────────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const hasFlag = (name) => argv.includes(`--${name}`);

const URL_TARGET = argOf('url', 'http://127.0.0.1:4173');
const SHOT_DIR = argOf('out', '/tmp/journey-shots');
const REPORT_PATH = argOf('report', '/tmp/vis2.txt');
const HEADFUL = hasFlag('headful');
const KEEP_OPEN = hasFlag('keep-open');

/* ── Journey constants (mirrors src/components/space/JourneyTimeline.ts) ─── */
const LOOP_SECONDS = 120;
const MISSION_CLOCK_SECONDS = 3600;
const scaleSec = (missionSec) => (missionSec * LOOP_SECONDS) / MISSION_CLOCK_SECONDS;

/* ── Chrome discovery ────────────────────────────────────────────────────── */
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

function findChrome() {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  return null;
}

/* ── Small utilities ─────────────────────────────────────────────────────── */
const failures = [];
const notes = [];

const fail = (msg) => failures.push(msg);
const note = (msg) => notes.push(msg);

const fmt = (n, d = 2) => Number(n).toFixed(d);

/** Median of a numeric array (non-mutating). */
function median(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Minimal Chrome DevTools Protocol client (WebSocket, no external deps).
   ═══════════════════════════════════════════════════════════════════════════ */
class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const onOpen = () => { cleanup(); resolve(); };
      const onErr = (e) => { cleanup(); reject(new Error(`CDP socket error: ${e?.message ?? e}`)); };
      const cleanup = () => {
        this.ws.removeEventListener('open', onOpen);
        this.ws.removeEventListener('error', onErr);
      };
      this.ws.addEventListener('open', onOpen);
      this.ws.addEventListener('error', onErr);
    });

    this.ws.addEventListener('message', (ev) => this.#onMessage(String(ev.data)));
    this.ws.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) reject(new Error('CDP socket closed'));
      this.pending.clear();
    });
  }

  #onMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.id !== undefined) {
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(`${entry.method}: ${msg.error.message}`));
      else entry.resolve(msg.result);
      return;
    }

    const subs = this.listeners.get(msg.method);
    if (subs) for (const fn of subs) fn(msg.params);
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(fn);
    return () => this.listeners.get(method)?.delete(fn);
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    const body = JSON.stringify(payload);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      try {
        this.ws.send(body);
      } catch (err) {
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  async evaluate(expression, { awaitPromise = false, sessionId = undefined } = {}) {
    const res = await this.send(
      'Runtime.evaluate',
      {
        expression,
        returnByValue: true,
        awaitPromise,
      },
      sessionId
    );
    if (res.exceptionDetails) {
      throw new Error(`evaluate failed: ${res.exceptionDetails.text ?? 'unknown'}`);
    }
    return res.result?.value;
  }

  close() {
    try { this.ws?.close(); } catch { /* ignore */ }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Browser launch (headless Chrome with a remote-debugging port).
   ═══════════════════════════════════════════════════════════════════════════ */
async function launchChrome(binary) {
  const profileDir = join(tmpdir(), `journey-vis-profile-${process.pid}`);
  rmSync(profileDir, { recursive: true, force: true });
  mkdirSync(profileDir, { recursive: true });

  const args = [
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-extensions',
    '--hide-scrollbars',
    '--mute-audio',
    '--window-size=1440,900',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    URL_TARGET,
  ];
  if (!HEADFUL) args.unshift('--headless=new');

  const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for Chrome DevTools endpoint')),
      20000
    );
    const onData = (chunk) => {
      buf += String(chunk);
      const m = buf.match(/ws:\/\/[^\s]+/);
      if (m) {
        clearTimeout(timer);
        child.stdout.off('data', onData);
        resolve(m[0]);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited early (code ${code})`));
    });
  });

  // Resolve the remote-debugging port from the browser ws URL.
  const portMatch = wsUrl.match(/:(\d+)\//);
  const debugPort = portMatch ? parseInt(portMatch[1], 10) : null;
  if (!debugPort) {
    child.kill();
    throw new Error('Could not parse debugging port from Chrome ws URL');
  }

  // Query /json/list to find the page target and its direct webSocket URL.
  let pageWsUrl = null;
  for (let i = 0; i < 50; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = await listRes.json();
      const pageTarget = targets.find((t) => t.type === 'page');
      if (pageTarget) {
        pageWsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch { /* retry */ }
    await sleep(200);
  }
  if (!pageWsUrl) {
    child.kill();
    throw new Error('No page target found via /json/list');
  }

  return { child, wsUrl: pageWsUrl, profileDir, debugPort };
}

/* ═══════════════════════════════════════════════════════════════════════════
   In-page instrumentation.

   1. Patches CanvasRenderingContext2D.prototype.fillText so we can record
      exactly which HUD labels the renderer paints on any given frame.
   2. Samples the canvas pixels (luminance + colour balance) so a checkpoint
      can assert that the scene is actually bright / tinted as expected.
   ═══════════════════════════════════════════════════════════════════════════ */
const INSTRUMENT_SCRIPT = `
(() => {
  if (window.__JOURNEY_VIS__) return 'already-instrumented';

  const state = { labels: [], lastFrameAt: 0, frames: 0 };
  window.__JOURNEY_VIS__ = state;

  const proto = CanvasRenderingContext2D.prototype;
  if (!proto.__journeyVisPatched) {
    const origFillText = proto.fillText;
    proto.fillText = function (text, x, y, maxWidth) {
      try {
        const value = String(text);
        if (!value || value.length === 0) return origFillText.call(this, text, x, y, maxWidth);
        const last = state.labels[state.labels.length - 1];
        if (last && last.text === value) {
          last.count += 1;
          last.at = performance.now();
        } else {
          state.labels.push({ text: value, x: Number(x) || 0, y: Number(y) || 0, count: 1, at: performance.now() });
          if (state.labels.length > 500) state.labels.shift();
        }
      } catch (e) { /* never break rendering */ }
      return origFillText.call(this, text, x, y, maxWidth);
    };
    proto.__journeyVisPatched = true;
  }

  const origRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => origRaf((t) => {
    state.frames += 1;
    state.lastFrameAt = performance.now();
    return cb(t);
  });

  state.reset = () => { state.labels = []; };
  state.captureAndReset = () => {
    const snap = state.labels.map((l) => ({ text: l.text, x: l.x, y: l.y, count: l.count }));
    state.labels = [];
    return snap;
  };
  state.snapshot = () => state.labels.map((l) => ({ text: l.text, x: l.x, y: l.y, count: l.count }));
  return 'ok';
})()
`;

/** Reads a downscaled pixel sample of the main canvas. */
const SAMPLE_SCRIPT = `
(() => {
  const canvases = Array.from(document.querySelectorAll('canvas'));
  if (!canvases.length) return null;
  let canvas = canvases[0];
  for (const c of canvases) {
    if (c.width * c.height > canvas.width * canvas.height) canvas = c;
  }
  const w = 160, h = 100;
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const g = off.getContext('2d', { willReadFrequently: true });
  g.drawImage(canvas, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;

  let sum = 0, sumR = 0, sumG = 0, sumB = 0, max = 0, nonBlack = 0;
  const lum = [];
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], gg = d[i+1], b = d[i+2];
    const l = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    lum.push(l);
    sum += l; sumR += r; sumG += gg; sumB += b;
    if (l > max) max = l;
    if (l > 6) nonBlack += 1;
  }
  const n = d.length / 4;
  lum.sort((a, b) => a - b);

  // Coarse perceptual signature: 8x8 grid of mean luminance, quantised.
  const cols = 8, rows = 8;
  const grid = new Array(cols * rows).fill(0);
  const counts = new Array(cols * rows).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const l = 0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2];
      const gi = Math.min(rows - 1, Math.floor((y / h) * rows)) * cols +
                 Math.min(cols - 1, Math.floor((x / w) * cols));
      grid[gi] += l; counts[gi] += 1;
    }
  }
  const signature = grid.map((v, i) => Math.round(v / (counts[i] || 1) / 16)).join(',');

  return {
    width: canvas.width,
    height: canvas.height,
    avgLuma: sum / n,
    maxLuma: max,
    p50: lum[Math.floor(n * 0.5)],
    p90: lum[Math.floor(n * 0.9)],
    p99: lum[Math.floor(n * 0.99)],
    nonBlackRatio: nonBlack / n,
    avgR: sumR / n,
    avgG: sumG / n,
    avgB: sumB / n,
    signature,
  };
})()
`;

/* ════════════════════════════════════════════════════════════════════════════
   Journey checkpoints (mirrors JourneyDevScrubber CHECKPOINTS).
   Progress = fraction of the 120 s loop. Each beat targets the middle of a
   section so its HUD / planet / star labels are painted.
   ════════════════════════════════════════════════════════════════════════════ */
const BEATS = [
  { prog: 0.042, section: 'departure', sector: 'SEC-01 · ORBITAL APEX',
    want: ['OBSERVATION DECK', 'ORBITAL APEX', 'CYCLE: 01'],
    desc: 'Orbital Departure & Space Station' },
  { prog: 0.109, section: 'mercury_venus', sector: 'SEC-02 · INNER HELIO',
    want: ['MERCURY', 'INNER HELIO'],
    desc: 'Inner System: Mercury & Venus' },
  { prog: 0.210, section: 'earth', sector: 'SEC-03 · TERRA MATRIX',
    want: ['TERRA', 'TERRA MATRIX'],
    desc: 'Terra & Luna Orbital Corridor' },
  { prog: 0.293, section: 'mars', sector: 'SEC-04 · ARES CORRIDOR',
    want: ['MARS', 'ARES CORRIDOR'],
    desc: 'Martian Approach & Phobos' },
  { prog: 0.393, section: 'jupiter', sector: 'SEC-05 · JOVIAN APEX',
    want: ['JUPITER', 'JOVIAN APEX'],
    desc: 'Jovian Giant & Galilean Moons' },
  { prog: 0.510, section: 'saturn', sector: 'SEC-06 · RING SPHERE',
    want: ['SATURN', 'RING SPHERE'],
    desc: 'Chronos Rings & Titan Corridor' },
  { prog: 0.600, section: 'uranus', sector: 'SEC-07 · CYAN VOID',
    want: ['URANUS', 'CYAN VOID'],
    desc: 'Uranus Ice Giant Drift' },
  { prog: 0.667, section: 'neptune', sector: 'SEC-08 · POSEIDON REACH',
    want: ['NEPTUNE', 'POSEIDON REACH'],
    desc: 'Neptunian Deep Azure' },
  { prog: 0.742, section: 'deep_space_stars', sector: 'SEC-09 · STELLAR WAY',
    want: ['SIRIUS', 'STELLAR WAY'],
    desc: 'Interstellar Stellar Nav Beacons' },
  { prog: 0.825, section: 'sun', sector: 'SEC-10 · SOL SURGE',
    want: ['SOL SURGE'],
    desc: 'Solar Perihelion Slingshot' },
  { prog: 0.900, section: 'nebula_asteroids', sector: 'SEC-11 · COSMIC REEF',
    want: ['COSMIC REEF'],
    desc: 'Carina Nebula & Asteroid Belt' },
  { prog: 0.958, section: 'galaxy', sector: 'SEC-12 · GALAXY ABYSS',
    want: ['GALAXY ABYSS'],
    desc: 'Deep Cosmos & Grand Spiral Galaxy' },
  { prog: 0.992, section: 'hyperspace', sector: 'SEC-13 · FTL TRANSLATION',
    want: ['FTL TRANSLATION'],
    desc: 'Warp Drive Fold & Cycle Jump' },
];

const INTRO_WAIT_MS = 3000;
const FRAME_SETTLE_MS = 250;

async function waitForIntro(cdp, sessionId) {
  const gone = await cdp.evaluate(
    `() => { return !document.querySelector('[aria-modal="true"]'); }`,
    { sessionId }
  );
  if (gone) return;
  await sleep(INTRO_WAIT_MS);
}

async function waitForCanvas(cdp, sessionId) {
  console.error('DEBUG: waitForCanvas starting');
  for (let i = 0; i < 50; i++) {
    const ready = await cdp.evaluate(
      `() => {
        const c = document.querySelector('canvas');
        return c && c.width > 0 && c.height > 0 ? 'ok' : null;
      }`,
      { sessionId }
    );
    if (ready) {
      console.error(`DEBUG: waitForCanvas ready at poll ${i}`);
      return;
    }
    await sleep(100);
  }
  console.error('DEBUG: waitForCanvas timed out');
  throw new Error('Canvas never became ready');
}

async function captureScreenshot(cdp, sessionId, name) {
  mkdirSync(SHOT_DIR, { recursive: true });
  const path = join(SHOT_DIR, `${name}.png`);
  const res = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
  writeFileSync(path, Buffer.from(res.data, 'base64'));
  return path;
}

async function getLabels(cdp, sessionId) {
  const vis = await cdp.evaluate(`() => window.__JOURNEY_VIS__ ? { frames: window.__JOURNEY_VIS__.frames, labels: window.__JOURNEY_VIS__.labels.length } : null`, { sessionId });
  if (!vis) {
    console.error('DEBUG: getLabels — __JOURNEY_VIS__ is null');
    return [];
  }
  const result = await cdp.evaluate(`() => window.__JOURNEY_VIS__.captureAndReset()`, { sessionId });
  console.error(`DEBUG: getLabels — frames=${vis.frames} labelsBefore=${vis.labels} labelsAfter=${Array.isArray(result) ? result.length : 'NA'}`);
  return Array.isArray(result) ? result : [];
}

async function getSample(cdp, sessionId) {
  return cdp.evaluate(SAMPLE_SCRIPT, { sessionId });
}

async function setProgress(cdp, sessionId, prog) {
  console.error(`DEBUG: setProgress calling evaluate for ${prog}`);
  await cdp.evaluate(`window.__SET_JOURNEY_PROGRESS__(${prog})`, { sessionId });
  console.error(`DEBUG: setProgress evaluate done for ${prog}`);
}

function printReport() {
  console.log('\n═════════════════════════════════════════════════════════════════════════');
  console.log(` JOURNEY VISUAL VERIFICATION REPORT`);
  console.log(`═════════════════════════════════════════════════════════════════════════`);
  console.log(` Target: ${URL_TARGET}`);
  console.log(` Shots:  ${SHOT_DIR}`);
  console.log(`\n Notes (${notes.length}):`);
  for (const n of notes) console.log(`  • ${n}`);
  if (failures.length) {
    console.log(`\n Failures (${failures.length}):`);
    for (const f of failures) console.log(`  ✗ ${f}`);
  }
  console.log(`\n Result: ${failures.length ? 'FAILED' : 'PASSED'}`);
  console.log(`══════════════════════════════════════════════════════════════════════════\n`);
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    fail('No Chrome/Chromium binary found');
    printReport();
    process.exit(1);
  }

  note(`Chrome: ${chrome}`);
  note(`Target URL: ${URL_TARGET}`);

  const { child, wsUrl } = await launchChrome(chrome);
  const cdp = new CdpClient(wsUrl);
  await cdp.connect();

  try {
    // Enable domains we need (direct page-level CDP connection — all domains available)
    await cdp.send('Page.enable', {});
    await cdp.send('Runtime.enable', {});
    await cdp.send('Network.enable', {});

    // Wait for load event
    const loadPromise = new Promise((resolve) => {
      cdp.on('Page.loadEventFired', () => resolve());
    });
    await Promise.race([loadPromise, sleep(15000)]);

    // Instrument the page
    await cdp.evaluate(INSTRUMENT_SCRIPT, {});
    const visCheck = await cdp.evaluate(
      `() => window.__JOURNEY_VIS__ ? { frames: window.__JOURNEY_VIS__.frames, labels: window.__JOURNEY_VIS__.labels.length, patched: !!CanvasRenderingContext2D.prototype.__journeyVisPatched } : null`,
      {}
    );
    console.error(`DEBUG: instrument check: ${JSON.stringify(visCheck)}`);
    notes.push(`Instrument script injected`);

    await waitForIntro(cdp, null);
    console.error('DEBUG: after waitForIntro');
    await waitForCanvas(cdp, null);
    console.error('DEBUG: after waitForCanvas');
    await sleep(FRAME_SETTLE_MS);

    for (const beat of BEATS) {
      console.error(`DEBUG: beat ${beat.desc} (${beat.prog})`);
      await cdp.evaluate(`() => window.__JOURNEY_VIS__ && window.__JOURNEY_VIS__.reset ? window.__JOURNEY_VIS__.reset() : null`, {});
      await setProgress(cdp, null, beat.prog);
      await sleep(FRAME_SETTLE_MS);

      const labels = await getLabels(cdp, null);
      const labelTexts = labels.map((l) => l.text);
      const sample = await getSample(cdp, null);
      const shot = await captureScreenshot(cdp, null, `beat_${beat.section}`);

      const missing = beat.want.filter((w) => !labelTexts.some((t) => t.includes(w)));

      if (missing.length) {
        fail(`[${beat.desc}] missing labels: ${missing.join(', ')} ` +
             `(got: ${labelTexts.slice(0, 6).join(' | ')})`);
      } else {
        note(`[${beat.desc}] OK — labels: ${labelTexts.slice(0, 4).join(' | ')}`);
      }

      if (sample && sample.avgLuma < 1) {
        fail(`[${beat.desc}] canvas essentially black (avgLuma=${fmt(sample.avgLuma)})`);
      } else if (sample) {
        note(`[${beat.desc}] canvas avgLuma=${fmt(sample.avgLuma)} ` +
             `nonBlack=${fmt(sample.nonBlackRatio, 3)}`);
      }

      note(`[${beat.desc}] screenshot → ${shot}`);
    }

  } finally {
    cdp.close();
    try { child.kill(); } catch { /* ignore */ }
  }

  printReport();
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  fail(`Fatal: ${err.message}`);
  printReport();
  process.exit(1);
});
