/**
 * - Dark / Light Theme Manager (persisted + OS preference aware)
 * - Interactive Matrix Particle Canvas
 * - 3D Holographic Card Tilt & Dynamic Glare
 * - Cyber Text Decryption / Hacker Scramble Effect
 * - Dual-Ring Sci-Fi Reticle Cursor
 * - Dynamic Category Filtering
 * - Intersection Observer Animations
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. Theme Manager (Dark / Light Mode)
    // -------------------------------------------------------------
    const THEME_STORAGE_KEY = 'portfolio-theme';
    const MATRIX_STORAGE_KEY = 'portfolio-matrix-mode';
    const THEME_COLORS = { dark: '#030712', light: '#f2f6fc' };
    const MATRIX_THEME_COLORS = { dark: '#050608', light: '#e7f4e4' };
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeColorMeta = document.getElementById('theme-color-meta');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: light)');
    let scrambleTextFn = null;

    const readStoredTheme = () => {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            return (stored === 'light' || stored === 'dark') ? stored : null;
        } catch (err) {
            return null;
        }
    };

    const commitMatrix = (matrixOn, persist, slowMotion = false) => {
        const on = !!matrixOn;
        root.setAttribute('data-matrix-mode', String(on));

        if (themeColorMeta) {
            const currentTheme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            themeColorMeta.setAttribute('content', on ? MATRIX_THEME_COLORS[currentTheme] : THEME_COLORS[currentTheme]);
        }

        updateLogoForMatrixMode();
        updateHeroBadgeForMatrixMode(slowMotion);
        document.dispatchEvent(new CustomEvent('matrixmodechange', { detail: { matrix: on } }));
    };

    const updateLogoForMatrixMode = () => {
        const matrixOn = root.getAttribute('data-matrix-mode') === 'true';
        const logoText = document.querySelector('.logo-text');
        const logoSub = document.querySelector('.logo-sub');
        if (logoText) logoText.innerText = matrixOn ? 'Hello' : 'AI';
        if (logoSub) logoSub.innerText = matrixOn ? 'NEO!!!' : 'SYSTEMS';
    };

    const updateHeroBadgeForMatrixMode = (slowMotion = false) => {
        const matrixOn = root.getAttribute('data-matrix-mode') === 'true';
        const badge = document.querySelector('.badge-text.scramble-target');
        if (!badge) return;
        const original = matrixOn ? 'MATRIX // NEXT-GEN AI' : 'RAJ COLACO // NEXT-GEN AI';
        badge.setAttribute('data-original', original);
        if (badge._scrambleTimer) {
            clearInterval(badge._scrambleTimer);
            badge._scrambleTimer = null;
        }
        if (matrixOn && slowMotion && typeof scrambleTextFn === 'function') {
            scrambleTextFn(badge, 95, 40); // ~3.8 seconds slow-motion decryption
        } else {
            badge.innerText = original;
        }
    };

    const commitTheme = (theme, persist) => {
        const resolved = theme === 'light' ? 'light' : 'dark';
        root.setAttribute('data-theme', resolved);

        if (persist) {
            try {
                localStorage.setItem(THEME_STORAGE_KEY, resolved);
            } catch (err) {
                // Storage unavailable (e.g. private mode) - theme still applies for this session
            }
        }

        if (themeColorMeta) {
            const currentTheme = resolved === 'light' ? 'light' : 'dark';
            themeColorMeta.setAttribute('content', root.getAttribute('data-matrix-mode') === 'true' ? MATRIX_THEME_COLORS[currentTheme] : THEME_COLORS[currentTheme]);
        }

        if (themeToggle) {
            const isLight = resolved === 'light';
            themeToggle.setAttribute('aria-pressed', String(isLight));
            themeToggle.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
        }

        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: resolved } }));
    };

    const WIPE_PHASE_MS = 700;
    const WIPE_EASING = 'cubic-bezier(0.55, 0.06, 0.35, 1)';
    const wipeOverlay = document.getElementById('theme-wipe-overlay');
    const reduceMotionQuery = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let wipePending = null;
    let wipeRunning = false;

    const shadeKeyForState = (theme, matrixOn) =>
        (matrixOn ? 'matrix-' : '') + (theme === 'light' ? 'light' : 'dark');

    const runThemeWipe = (swapUnderCover) => {
        if (!wipeOverlay) {
            swapUnderCover();
            return;
        }
        if (reduceMotionQuery && reduceMotionQuery.matches) {
            swapUnderCover();
            return;
        }
        if (wipeRunning) return;
        wipeRunning = true;

        const fromTheme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const fromMatrix = root.getAttribute('data-matrix-mode') === 'true';
        wipeOverlay.setAttribute('data-shade', shadeKeyForState(fromTheme, fromMatrix));
        const toPending = wipePending;
        const toMatrix = toPending && toPending.kind === 'matrix' ? !!toPending.value : !fromMatrix;
        if (fromMatrix || toMatrix) {
            wipeOverlay.setAttribute('data-edge', 'matrix');
        } else {
            wipeOverlay.removeAttribute('data-edge');
        }

        const vw = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0, 320);
        const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 320);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        wipeOverlay.innerHTML = '';
        wipeOverlay.classList.add('is-disintegrating');
        wipeOverlay.style.visibility = 'visible';

        // Disintegration canvas: samples the geometry of all currently visible UI elements
        const canvas = document.createElement('canvas');
        canvas.className = 'disintegration-canvas';
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
        canvas.style.width = vw + 'px';
        canvas.style.height = vh + 'px';
        wipeOverlay.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            swapUnderCover();
            wipeOverlay.classList.remove('is-disintegrating');
            wipeOverlay.style.visibility = 'hidden';
            wipeOverlay.innerHTML = '';
            wipeRunning = false;
            return;
        }

        // Detect all UI elements currently visible within the viewport
        const visibleBoxes = [];
        const candidates = document.querySelectorAll(
            '.cyber-nav, .hero-content, .hero-telemetry-hud, .hero-badge, .project-card, .section-header, .filter-pills, .contact-card, .footer-content'
        );
        candidates.forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.bottom > 10 && r.top < vh - 10 && r.right > 10 && r.left < vw - 10) {
                visibleBoxes.push({
                    x: Math.max(0, r.left),
                    y: Math.max(0, r.top),
                    w: Math.min(vw - Math.max(0, r.left), r.width),
                    h: Math.min(vh - Math.max(0, r.top), r.height)
                });
            }
        });

        if (visibleBoxes.length === 0) {
            visibleBoxes.push({ x: 20, y: 70, w: vw - 40, h: vh - 100 });
        }

        const glyphChars = '0101_#@$%=+-~*<>[]{}/\\^!&?░▒▓█▀▄▌▐▖▗▘▙▚▛▜▝▞▟■▲△♢♡♤♧♣♤';
        const particles = [];
        const baseColor = fromTheme === 'light' ? 'rgba(14, 116, 144, ' : 'rgba(0, 240, 255, ';
        const targetColor = 'rgba(0, 255, 65, ';

        visibleBoxes.forEach((box) => {
            // 1. Perimeter border crack shards
            const perimeter = 2 * (box.w + box.h);
            const edgeCount = Math.min(180, Math.max(36, Math.floor(perimeter / 16)));
            for (let i = 0; i < edgeCount; i++) {
                let px, py;
                const edge = Math.random();
                if (edge < 0.25) {
                    px = box.x + Math.random() * box.w;
                    py = box.y + (Math.random() - 0.5) * 4;
                } else if (edge < 0.5) {
                    px = box.x + Math.random() * box.w;
                    py = box.y + box.h + (Math.random() - 0.5) * 4;
                } else if (edge < 0.75) {
                    px = box.x + (Math.random() - 0.5) * 4;
                    py = box.y + Math.random() * box.h;
                } else {
                    px = box.x + box.w + (Math.random() - 0.5) * 4;
                    py = box.y + Math.random() * box.h;
                }
                particles.push({
                    x: px * dpr,
                    y: py * dpr,
                    vx: (Math.random() - 0.5) * 0.9 * dpr,
                    vy: (Math.random() - 0.55) * 1.1 * dpr,
                    size: (Math.random() * 4 + 2) * dpr,
                    alpha: 1,
                    decay: Math.random() * 0.005 + 0.0035,
                    color: Math.random() > 0.4 ? targetColor : baseColor,
                    isGlyph: Math.random() > 0.45,
                    char: glyphChars[Math.floor(Math.random() * glyphChars.length)],
                    delay: Math.random() * 1600, // Organic slow-motion stagger across the first 1.6s
                    wobble: Math.random() * Math.PI * 2
                });
            }

            // 2. Surface disintegration flakes
            const area = box.w * box.h;
            const surfaceCount = Math.min(150, Math.max(24, Math.floor(area / 2600)));
            for (let i = 0; i < surfaceCount; i++) {
                particles.push({
                    x: (box.x + Math.random() * box.w) * dpr,
                    y: (box.y + Math.random() * box.h) * dpr,
                    vx: (Math.random() - 0.5) * 0.8 * dpr,
                    vy: (Math.random() - 0.5) * 0.9 * dpr,
                    size: (Math.random() * 6 + 3) * dpr,
                    alpha: 1,
                    decay: Math.random() * 0.0055 + 0.0038,
                    color: Math.random() > 0.3 ? targetColor : baseColor,
                    isGlyph: Math.random() > 0.6,
                    char: glyphChars[Math.floor(Math.random() * glyphChars.length)],
                    delay: Math.random() * 1800,
                    wobble: Math.random() * Math.PI * 2
                });
            }
        });

        // Swap the real theme immediately: the Matrix mode UI is revealed
        // underneath as the disintegration particles flake and dissolve away
        swapUnderCover();

        if (wipePending) {
            const next = wipePending;
            wipePending = null;
            if (next.kind === 'theme') {
                commitTheme(next.value, true);
            } else {
                commitMatrix(next.value, true, true);
            }
        }

        const totalMs = 4000; // 4 seconds slow motion
        const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        let animId = 0;

        const teardown = () => {
            if (animId) cancelAnimationFrame(animId);
            wipeOverlay.classList.remove('is-disintegrating');
            wipeOverlay.style.visibility = 'hidden';
            wipeOverlay.innerHTML = '';
            wipeRunning = false;
            if (wipePending) {
                const next = wipePending;
                wipePending = null;
                requestThemeSwap(next.kind, next.value);
            }
        };

        const draw = () => {
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const elapsed = now - startTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Digital CRT slice displacement across the visible elements during the initial 800ms
            if ((elapsed < 800 && Math.random() < 0.6) || (elapsed < 1600 && Math.random() < 0.2)) {
                const sliceCount = 2 + Math.floor(Math.random() * 3);
                ctx.fillStyle = toMatrix ? 'rgba(0, 255, 65, 0.07)' : 'rgba(0, 240, 255, 0.07)';
                for (let s = 0; s < sliceCount; s++) {
                    const sy = Math.random() * canvas.height;
                    const sh = (Math.random() * 20 + 8) * dpr;
                    const shiftX = (Math.random() - 0.5) * 14 * dpr;
                    ctx.fillRect(shiftX, sy, canvas.width, sh);
                }
            }

            ctx.font = `${Math.round(11 * dpr)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let alive = false;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                if (elapsed < p.delay) {
                    alive = true;
                    continue;
                }
                // Slow-motion zero-g gentle drift with subtle sinusoidal wave
                p.x += p.vx + Math.sin(p.wobble + elapsed * 0.002) * 0.2 * dpr;
                p.y += p.vy;
                p.alpha -= p.decay;

                if (p.alpha > 0.01) {
                    alive = true;
                    ctx.fillStyle = p.color + Math.max(0, p.alpha) + ')';
                    if (p.isGlyph) {
                        ctx.fillText(p.char, p.x, p.y);
                    } else {
                        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
                    }
                }
            }

            if (alive && elapsed < totalMs && wipeRunning) {
                animId = requestAnimationFrame(draw);
            } else {
                teardown();
            }
        };

        animId = requestAnimationFrame(draw);
    };

    const requestThemeSwap = (kind, value) => {
        if (kind === 'theme') {
            const target = value === 'light' ? 'light' : 'dark';
            // Dark/light swaps are instant (no disintegration).
            commitTheme(target, true);
            return;
        } else {
            const target = !!value;
            const current = root.getAttribute('data-matrix-mode') === 'true';
            if (target === current) {
                commitMatrix(target, true);
                return;
            }
            if (target === true && current === false) {
                if (wipeRunning) return;
                // Non-matrix -> Matrix: 4-second slow-motion disintegration
                runThemeWipe(() => commitMatrix(target, true, true));
            } else {
                // Matrix -> non-matrix: quick without any animation
                if (wipeRunning) {
                    wipeRunning = false;
                    wipePending = null;
                    wipeOverlay.classList.remove('is-disintegrating');
                    wipeOverlay.style.visibility = 'hidden';
                    wipeOverlay.innerHTML = '';
                }
                commitMatrix(target, true, false);
            }
        }
    };

    // Inline head bootstrap painted the correct theme; re-apply to sync controls.
    commitTheme(root.getAttribute('data-theme') || (colorSchemeQuery.matches ? 'light' : 'dark'));

    // Matrix mode always defaults to false on page load
    try {
        localStorage.removeItem(MATRIX_STORAGE_KEY);
    } catch (err) {
        // Storage unavailable
    }
    commitMatrix(false, false);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            requestThemeSwap('theme', root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        });
    }

    // Matrix mode toggle via the AI.SYSTEMS logo button
    const logoButton = document.querySelector('.logo');
    if (logoButton && typeof logoButton.addEventListener === 'function') {
        logoButton.addEventListener('click', (e) => {
            e.preventDefault();
            const nextMatrix = root.getAttribute('data-matrix-mode') !== 'true';
            // Stay on current frame: no vertical slide, no hash jump
            requestThemeSwap('matrix', nextMatrix);
        });
        // Initial logo text sync in case DOM was already painted
        updateLogoForMatrixMode();
        updateHeroBadgeForMatrixMode();
    }

    // Follow the OS preference until the visitor makes an explicit choice
    const handleSystemThemeChange = (event) => {
        if (readStoredTheme()) return;
        requestThemeSwap('theme', event.matches ? 'light' : 'dark');
    };

    if (typeof colorSchemeQuery.addEventListener === 'function') {
        colorSchemeQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof colorSchemeQuery.addListener === 'function') {
        colorSchemeQuery.addListener(handleSystemThemeChange); // Legacy Safari support
    }

    // -------------------------------------------------------------
    // 2. Interactive Neural Particle Canvas Engine
    // -------------------------------------------------------------
    const canvas = document.getElementById('cyber-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = 0;
        let height = 0;
        let dpr = window.devicePixelRatio || 1;
        let particles = [];
        let mouse = { x: null, y: null, radius: 170 };
        let animationFrameId = null;

        // Palettes mirror the CSS theme tokens so the mesh stays legible on both backgrounds
        const PARTICLE_PALETTES = {
            dark: {
                dots: [
                    'rgba(0, 240, 255, ',    // Neon Cyan
                    'rgba(139, 92, 246, ',   // Neon Violet
                    'rgba(255, 42, 133, '    // Neon Pink
                ],
                link: 'rgba(0, 240, 255, ',
                linkAlpha: 0.25,
                mouseAlpha: 0.55,
                glow: 8
            },
            light: {
                dots: [
                    'rgba(14, 116, 144, ',   // Deep Cyan
                    'rgba(124, 58, 237, ',   // Deep Violet
                    'rgba(219, 39, 119, '    // Deep Pink
                ],
                link: 'rgba(14, 116, 144, ',
                linkAlpha: 0.2,
                mouseAlpha: 0.45,
                glow: 6
            },
            matrixDark: {
                dots: [
                    'rgba(0, 204, 68, ',     // Matrix Green
                    'rgba(40, 150, 40, ',    // Deeper green
                    'rgba(70, 190, 70, '     // Mid green glow
                ],
                link: 'rgba(0, 204, 68, ',
                linkAlpha: 0.28,
                mouseAlpha: 0.6,
                glow: 10
            },
            matrixLight: {
                dots: [
                    'rgba(10, 143, 58, ',    // Deep Matrix Green
                    'rgba(35, 110, 35, ',    // Slightly deeper green
                    'rgba(55, 155, 55, '     // Mid green
                ],
                link: 'rgba(10, 143, 58, ',
                linkAlpha: 0.22,
                mouseAlpha: 0.5,
                glow: 8
            }
        };

        const resolvePalette = () => {
            const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            const matrixOn = document.documentElement.getAttribute('data-matrix-mode') === 'true';
            return matrixOn ? PARTICLE_PALETTES['matrix' + capitalize(theme)] : PARTICLE_PALETTES[theme];
        };

        const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

        let palette = resolvePalette();

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            // Responsive particle count based on screen area
            const particleCount = Math.min(Math.floor((width * height) / 14000), 85);
            const colors = palette.dots;

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.65,
                    vy: (Math.random() - 0.5) * 0.65,
                    radius: Math.random() * 2 + 1,
                    baseColor: colors[Math.floor(Math.random() * colors.length)],
                    pulseSpeed: Math.random() * 0.03 + 0.01,
                    pulseVal: Math.random() * Math.PI
                });
            }
        };

        const drawParticles = () => {
            ctx.clearRect(0, 0, width, height);

            // Connect nearby particles
            const maxDist = 135;
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];

                // Update position
                p1.x += p1.vx;
                p1.y += p1.vy;

                // Bounce at edges
                if (p1.x < 0 || p1.x > width) p1.vx *= -1;
                if (p1.y < 0 || p1.y > height) p1.vy *= -1;

                p1.pulseVal += p1.pulseSpeed;
                const alpha = 0.35 + Math.sin(p1.pulseVal) * 0.25;

                // Draw Particle Dot
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${p1.baseColor}${alpha})`;
                ctx.shadowColor = `${p1.baseColor}0.8)`;
                ctx.shadowBlur = palette.glow;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Particle to particle connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDist) {
                        const lineAlpha = (1 - dist / maxDist) * palette.linkAlpha;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `${palette.link}${lineAlpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }

                // Interactive Mouse Connections
                if (mouse.x !== null && mouse.y !== null) {
                    const mdx = p1.x - mouse.x;
                    const mdy = p1.y - mouse.y;
                    const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

                    if (mDist < mouse.radius) {
                        const mouseLineAlpha = (1 - mDist / mouse.radius) * palette.mouseAlpha;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = `${palette.link}${mouseLineAlpha})`;
                        ctx.lineWidth = 1.2;
                        ctx.stroke();

                        // Gentle magnetic repulsion
                        const force = (mouse.radius - mDist) / mouse.radius;
                        p1.x += (mdx / mDist) * force * 1.2;
                        p1.y += (mdy / mDist) * force * 1.2;
                    }
                }
            }

            animationFrameId = requestAnimationFrame(drawParticles);
        };

        window.addEventListener('resize', () => {
            resizeCanvas();
        });

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        // Pause animation when tab is inactive to preserve resources
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationFrameId);
            } else {
                animationFrameId = requestAnimationFrame(drawParticles);
            }
        });

        // Re-skin the constellation when the visitor flips the theme or matrix mode
        document.addEventListener('themechange', () => {
            palette = resolvePalette();
            initParticles();
        });
        document.addEventListener('matrixmodechange', () => {
            palette = resolvePalette();
            initParticles();
        });

        resizeCanvas();
        drawParticles();
    }

    // -------------------------------------------------------------
    // 3. Custom Sci-Fi Reticle Cursor (Desktop)
    // -------------------------------------------------------------
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    if (dot && ring && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let mouseX = -100;
        let mouseY = -100;
        let ringX = -100;
        let ringY = -100;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.left = `${mouseX}px`;
            dot.style.top = `${mouseY}px`;
        });

        const renderRing = () => {
            // Smooth physics lerp
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;

            ring.style.left = `${ringX}px`;
            ring.style.top = `${ringY}px`;

            requestAnimationFrame(renderRing);
        };
        requestAnimationFrame(renderRing);

        // Hover target lock expansion
        const interactiveSelectors = 'a, button, [role="tab"], .project-card, .social-icon, .filter-pill';
        document.querySelectorAll(interactiveSelectors).forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => ring.classList.remove('cursor-hover'));
        });
    }

    // -------------------------------------------------------------
    // 4. 3D Holographic Card Tilt & Spotlight Glare
    // -------------------------------------------------------------
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        let isHovered = false;

        card.addEventListener('mouseenter', () => {
            isHovered = true;
        });

        card.addEventListener('mousemove', (e) => {
            if (!isHovered) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set spotlight coordinates for CSS radial-gradient
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // 3D perspective rotation (max +/- 10 degrees)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -9;
            const rotateY = ((x - centerX) / centerX) * 9;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            isHovered = false;
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });

    // -------------------------------------------------------------
    // 5. Cyber Text Decryption / Hacker Scramble Effect
    // -------------------------------------------------------------
    const scrambleElements = document.querySelectorAll('.scramble-target');
    const glyphs = '0101_#@$%=+-~*<>[]{}/\\^!&?░▒▓█▀▄▌▐▖▗▘▙▚▛▜▝▞▟■▲△♢♡♤♧♣♤ SELECT >';

    const scrambleText = (el, totalDuration = 25, intervalMs = 30) => {
        const originalText = el.getAttribute('data-original') || el.innerText;
        let iteration = 0;
        clearInterval(el._scrambleTimer);

        el._scrambleTimer = setInterval(() => {
            el.innerText = originalText
                .split('')
                .map((char, index) => {
                    if (char === ' ' || char === '/' || char === '.') return char;
                    if (index < (iteration / totalDuration) * originalText.length) {
                        return originalText[index];
                    }
                    return glyphs[Math.floor(Math.random() * glyphs.length)];
                })
                .join('');

            iteration++;
            if (iteration >= totalDuration) {
                el.innerText = originalText;
                clearInterval(el._scrambleTimer);
            }
        }, intervalMs);
    };
    scrambleTextFn = scrambleText;

    // Trigger scramble on initial load
    setTimeout(() => {
        scrambleElements.forEach(el => scrambleText(el));
    }, 400);

    // Scramble again on hover for added fun
    scrambleElements.forEach(el => {
        el.addEventListener('mouseenter', () => scrambleText(el));
    });

    // -------------------------------------------------------------
    // 6. Interactive Category Filter System
    // -------------------------------------------------------------
    const filterPills = document.querySelectorAll('.filter-pill');

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Update active pill
            filterPills.forEach(p => {
                p.classList.remove('active');
                p.setAttribute('aria-selected', 'false');
            });
            pill.classList.add('active');
            pill.setAttribute('aria-selected', 'true');

            const filterValue = pill.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const isMatch = filterValue === 'all' || category === filterValue;

                if (isMatch) {
                    card.classList.remove('filter-hide');
                    // Retrigger smooth fade in
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px) scale(0.98)';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0) scale(1)';
                    }, 50);
                } else {
                    card.classList.add('filter-hide');
                }
            });
        });
    });

    // -------------------------------------------------------------
    // 7. Scroll Fade-in Intersection Observer
    // -------------------------------------------------------------
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});
