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

    const readStoredTheme = () => {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            return (stored === 'light' || stored === 'dark') ? stored : null;
        } catch (err) {
            return null;
        }
    };

    const commitMatrix = (matrixOn) => {
        const on = !!matrixOn;
        // Matrix mode is session-only: it is never persisted, so a reload
        // always boots back into the default OFF state.
        root.setAttribute('data-matrix-mode', String(on));

        if (themeColorMeta) {
            const currentTheme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            themeColorMeta.setAttribute('content', on ? MATRIX_THEME_COLORS[currentTheme] : THEME_COLORS[currentTheme]);
        }

        updateLogoForMatrixMode();
        updateHeroBadgeForMatrixMode();
        document.dispatchEvent(new CustomEvent('matrixmodechange', { detail: { matrix: on } }));
    };

    const updateLogoForMatrixMode = () => {
        const matrixOn = root.getAttribute('data-matrix-mode') === 'true';
        const logoText = document.querySelector('.logo-text');
        const logoSub = document.querySelector('.logo-sub');
        if (logoText) logoText.innerText = matrixOn ? 'Hello' : 'AI';
        if (logoSub) logoSub.innerText = matrixOn ? 'NEO!!!' : 'SYSTEMS';
    };

    const updateHeroBadgeForMatrixMode = () => {
        const matrixOn = root.getAttribute('data-matrix-mode') === 'true';
        const badge = document.querySelector('.badge-text.scramble-target');
        if (!badge) return;
        const original = matrixOn ? 'RAJ COLACO // NEXT-GEN AI' : 'RAJ COLACO // NEXT-GEN AI';
        badge.setAttribute('data-original', original);
        // Sync visible text immediately so the badge reflects the mode even before the next scramble tick
        if (!badge._scrambleTimer) {
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
        // No overlay, no WAAPI, or reduced motion: instant swap, no covering.
        if (!wipeOverlay || !wipeOverlay.animate || !Element.prototype.animate) {
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
        const toMatrix = toPending && toPending.kind === 'matrix'
            ? !!toPending.value
            : fromMatrix;
        if (fromMatrix || toMatrix) {
            wipeOverlay.setAttribute('data-edge', 'matrix');
        } else {
            wipeOverlay.removeAttribute('data-edge');
        }

        // Swap the real theme FIRST: fragments (old theme color) sit on top of
        // the new theme and flake away revealing it = disintegration.
        swapUnderCover();
        if (wipePending) {
            const next = wipePending;
            wipePending = null;
            if (next.kind === 'theme') {
                commitTheme(next.value, true);
            } else {
                commitMatrix(next.value);
            }
        }

        // Build a tile grid covering the viewport. Each tile disintegrates
        // top-rows first with per-tile jitter so the old theme crumbles away.
        const vw = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0, 320);
        const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 320);
        const cols = vw < 640 ? 10 : 16;
        const rows = vh < 640 ? 12 : 18;
        const fragW = Math.ceil(vw / cols) + 1;
        const fragH = Math.ceil(vh / rows) + 1;
        wipeOverlay.innerHTML = '';
        wipeOverlay.classList.add('is-disintegrating');
        wipeOverlay.style.visibility = 'visible';

        const animations = [];
        const rowBase = 320; // top row goes first, ~320ms head start over bottom
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const frag = document.createElement('div');
                frag.className = 'wipe-fragment';
                frag.style.left = (c * fragW - 1) + 'px';
                frag.style.top = (r * fragH - 1) + 'px';
                frag.style.width = fragW + 'px';
                frag.style.height = fragH + 'px';
                wipeOverlay.appendChild(frag);

                // Top-to-bottom ordering with jitter + slight column stagger.
                const jitter = Math.random() * 160;
                const delay = (r / Math.max(rows - 1, 1)) * rowBase + (c / Math.max(cols - 1, 1)) * 60 + jitter;
                const driftX = (Math.random() - 0.5) * 44;
                // Fragments fall slightly and shrink into nothing (ash-like).
                const anim = frag.animate(
                    [
                        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
                        // Glitch flicker mid-break (green tint lands via data-edge glow).
                        { transform: `translate(${driftX * 0.3}px, -3px) scale(1.02)`, opacity: 1, offset: 0.35 },
                        { transform: `translate(${driftX}px, 26px) scale(0.12)`, opacity: 0 }
                    ],
                    { duration: WIPE_PHASE_MS, delay, easing: WIPE_EASING, fill: 'forwards' }
                );
                animations.push(anim);
            }
        }

        const teardown = () => {
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

        const totalMs = WIPE_PHASE_MS + rowBase + 160 + 60 + 120;
        let settled = false;
        const done = () => {
            if (settled) return;
            settled = true;
            teardown();
        };
        if (animations.length && animations[0] && animations[0].finished) {
            Promise.all(animations.map((a) => a.finished.catch(() => {}))).then(done).catch(done);
        }
        setTimeout(done, totalMs);
    };

    const requestThemeSwap = (kind, value) => {
        if (wipeRunning) {
            wipePending = { kind, value };
            return;
        }
        if (kind === 'theme') {
            const target = value === 'light' ? 'light' : 'dark';
            const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            // Dark/light swaps are instant (no disintegration).
            commitTheme(target, true);
            return;
        } else {
            const target = !!value;
            const current = root.getAttribute('data-matrix-mode') === 'true';
            if (target === current) {
                commitMatrix(target);
                return;
            }
            if (target === true && current === false) {
                // Non-matrix -> Matrix only: disintegrate the old UI.
                runThemeWipe(() => commitMatrix(target));
            } else {
                // Matrix -> non-matrix: instant, no animation.
                commitMatrix(target);
            }
        }
    };

    // Inline head bootstrap painted the correct theme; re-apply to sync controls.
    // Matrix mode is session-only: it always boots OFF on reload. Discard any
    // stored value left behind by earlier versions of this feature.
    commitTheme(root.getAttribute('data-theme') || (colorSchemeQuery.matches ? 'light' : 'dark'));
    try {
        localStorage.removeItem(MATRIX_STORAGE_KEY);
    } catch (err) {
        // Storage unavailable - nothing to discard
    }
    commitMatrix(false);

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
            requestThemeSwap('matrix', nextMatrix);
            window.location.hash = 'home';
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const coarsePointerQuery = window.matchMedia('(hover: none) or (pointer: coarse)');
    if (canvas && !(reduceMotionQuery && reduceMotionQuery.matches)) {
        const ctx = canvas.getContext('2d');
        let width = 0;
        let height = 0;
        let dpr = 1;
        let particles = [];
        let mouse = { x: null, y: null, radius: 170 };
        let animationFrameId = null;
        let resizeFrameId = null;
        let isAnimating = false;
        let lastFrameTime = 0;
        const frameInterval = coarsePointerQuery.matches ? 1000 / 24 : 1000 / 30;

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
            dpr = Math.min(window.devicePixelRatio || 1, coarsePointerQuery.matches ? 1 : 1.5);
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            // Responsive particle count based on screen area
            const particleCount = Math.min(
                Math.floor((width * height) / (coarsePointerQuery.matches ? 23000 : 18000)),
                coarsePointerQuery.matches ? 32 : 64
            );
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

        const drawParticles = (timestamp) => {
            if (!isAnimating) return;
            if (timestamp - lastFrameTime < frameInterval) {
                animationFrameId = requestAnimationFrame(drawParticles);
                return;
            }
            lastFrameTime = timestamp;
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

                    if (mDist > 0 && mDist < mouse.radius) {
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

        const startAnimation = () => {
            if (isAnimating || document.hidden) return;
            isAnimating = true;
            lastFrameTime = performance.now() - frameInterval;
            animationFrameId = requestAnimationFrame(drawParticles);
        };

        const stopAnimation = () => {
            isAnimating = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        };

        window.addEventListener('resize', () => {
            if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
            resizeFrameId = requestAnimationFrame(() => {
                resizeFrameId = null;
                resizeCanvas();
            });
        });

        if (!coarsePointerQuery.matches) {
            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });

            window.addEventListener('mouseleave', () => {
                mouse.x = null;
                mouse.y = null;
            });
        }

        // Pause animation when tab is inactive to preserve resources
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAnimation();
            } else {
                startAnimation();
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
        startAnimation();
    }

    // -------------------------------------------------------------
    // 3. Custom Sci-Fi Reticle Cursor (Desktop)
    // -------------------------------------------------------------
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    if (dot && ring && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !(reduceMotionQuery && reduceMotionQuery.matches)) {
        let mouseX = -100;
        let mouseY = -100;
        let ringX = -100;
        let ringY = -100;
        let cursorFrameId = null;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.left = `${mouseX}px`;
            dot.style.top = `${mouseY}px`;
            if (!cursorFrameId) cursorFrameId = requestAnimationFrame(renderRing);
        });

        const renderRing = () => {
            // Smooth physics lerp
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;

            ring.style.left = `${ringX}px`;
            ring.style.top = `${ringY}px`;

            if (Math.abs(mouseX - ringX) > 0.1 || Math.abs(mouseY - ringY) > 0.1) {
                cursorFrameId = requestAnimationFrame(renderRing);
            } else {
                cursorFrameId = null;
            }
        };

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

    if (!coarsePointerQuery.matches && !(reduceMotionQuery && reduceMotionQuery.matches)) {
        projectCards.forEach(card => {
        let isHovered = false;
        let tiltFrameId = null;
        let pointerEvent = null;

        card.addEventListener('mouseenter', () => {
            isHovered = true;
        });

        card.addEventListener('mousemove', (e) => {
            if (!isHovered) return;
            pointerEvent = e;
            if (tiltFrameId) return;

            tiltFrameId = requestAnimationFrame(() => {
            tiltFrameId = null;
            if (!pointerEvent || !isHovered) return;

            const rect = card.getBoundingClientRect();
            const x = pointerEvent.clientX - rect.left;
            const y = pointerEvent.clientY - rect.top;

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
        });

        card.addEventListener('mouseleave', () => {
            isHovered = false;
            pointerEvent = null;
            if (tiltFrameId) cancelAnimationFrame(tiltFrameId);
            tiltFrameId = null;
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
        });
    }

    // -------------------------------------------------------------
    // 5. Cyber Text Decryption / Hacker Scramble Effect
    // -------------------------------------------------------------
    const scrambleElements = document.querySelectorAll('.scramble-target');
    const glyphs = '0101_#@$%=+-~*<>[]{}/\\^!&?░▒▓█▀▄▌▐▖▗▘▙▚▛▜▝▞▟■▲△♢♡♤♧♣♤ SELECT >';

    const scrambleText = (el) => {
        const originalText = el.getAttribute('data-original') || el.innerText;
        let iteration = 0;
        const totalDuration = 25; // number of tick frames
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
        }, 30);
    };

    // Trigger scramble on initial load
    if (!(reduceMotionQuery && reduceMotionQuery.matches)) {
        setTimeout(() => {
            scrambleElements.forEach(el => scrambleText(el));
        }, 400);

        // Scramble again on hover for added fun
        scrambleElements.forEach(el => {
            el.addEventListener('mouseenter', () => scrambleText(el));
        });
    }

    // -------------------------------------------------------------
    // 6. Interactive Category Filter System
    // -------------------------------------------------------------
    const filterPills = document.querySelectorAll('.filter-pill');

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Update active pill
            filterPills.forEach(p => {
                p.classList.remove('active');
                p.setAttribute('aria-pressed', 'false');
            });
            pill.classList.add('active');
            pill.setAttribute('aria-pressed', 'true');

            const filterValue = pill.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const isMatch = filterValue === 'all' || category === filterValue;

                if (isMatch) {
                    const wasHidden = card.classList.contains('filter-hide');
                    card.classList.remove('filter-hide');
                    if (wasHidden && !(reduceMotionQuery && reduceMotionQuery.matches)) {
                        card.classList.remove('filter-show');
                        void card.offsetWidth;
                        card.classList.add('filter-show');
                    }
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

    // -------------------------------------------------------------
    // 8. Interactive Cyberpunk Developer Terminal / CLI Controller
    // -------------------------------------------------------------
    const terminalHud = document.getElementById('cyber-terminal-hud');
    const terminalWindow = document.getElementById('terminal-window');
    const terminalNavTrigger = document.getElementById('terminal-nav-trigger');
    const terminalDockTrigger = document.getElementById('terminal-dock-trigger');
    const termBtnClose = document.getElementById('term-btn-close');
    const termBtnMin = document.getElementById('term-btn-min');
    const termBtnMax = document.getElementById('term-btn-max');
    const terminalBackdrop = document.getElementById('terminal-backdrop');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalForm = document.getElementById('terminal-form');
    const terminalInput = document.getElementById('terminal-input');
    const terminalPromptLabel = document.getElementById('terminal-prompt-label');
    const terminalModeBadge = document.getElementById('terminal-mode-badge');

    if (terminalHud && terminalInput) {
        let isTerminalOpen = false;
        let isMaximized = false;
        const commandHistory = [];
        let historyIndex = -1;
        let isStreaming = false;
        let lastFocusedElement = null;
        const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        })[character]);

        const syncTerminalMode = () => {
            const isMatrix = root.getAttribute('data-matrix-mode') === 'true';
            if (terminalPromptLabel) {
                terminalPromptLabel.innerText = isMatrix ? 'neo@matrix:~$ ' : 'raj@neural:~$ ';
            }
            if (terminalModeBadge) {
                terminalModeBadge.innerText = isMatrix ? 'MODE: MATRIX.CORE' : 'MODE: CYBER.CORE';
            }
        };

        document.addEventListener('matrixmodechange', syncTerminalMode);
        syncTerminalMode();

        const openTerminal = () => {
            lastFocusedElement = document.activeElement;
            isTerminalOpen = true;
            terminalHud.classList.add('is-open');
            terminalHud.setAttribute('aria-hidden', 'false');
            syncTerminalMode();
            setTimeout(() => {
                terminalInput.focus();
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }, 60);
        };

        const closeTerminal = () => {
            isTerminalOpen = false;
            terminalHud.classList.remove('is-open');
            terminalHud.setAttribute('aria-hidden', 'true');
            terminalInput.blur();
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        };

        const toggleTerminal = () => {
            if (isTerminalOpen) closeTerminal();
            else openTerminal();
        };

        if (terminalNavTrigger) terminalNavTrigger.addEventListener('click', toggleTerminal);
        if (terminalDockTrigger) terminalDockTrigger.addEventListener('click', toggleTerminal);
        if (termBtnClose) termBtnClose.addEventListener('click', closeTerminal);
        if (termBtnMin) termBtnMin.addEventListener('click', closeTerminal);
        if (terminalBackdrop) terminalBackdrop.addEventListener('click', closeTerminal);

        if (termBtnMax) {
            termBtnMax.addEventListener('click', () => {
                isMaximized = !isMaximized;
                terminalWindow.classList.toggle('is-maximized', isMaximized);
            });
        }

        // Global hotkey: Ctrl + ` or Backquote when not typing elsewhere
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.code === 'Backquote')) {
                e.preventDefault();
                toggleTerminal();
            } else if (e.key === 'Escape' && isTerminalOpen) {
                e.preventDefault();
                closeTerminal();
            } else if (e.key === 'Tab' && isTerminalOpen && terminalWindow) {
                const focusable = Array.from(terminalWindow.querySelectorAll(
                    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )).filter((element) => !element.closest('[aria-hidden="true"]'));
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        // Focus input on click anywhere inside the terminal body
        const terminalBody = document.getElementById('terminal-body');
        if (terminalBody) {
            terminalBody.addEventListener('click', (e) => {
                if (!e.target.closest('a, button')) {
                    terminalInput.focus();
                }
            });
        }

        const appendOutput = (html, isEcho = false) => {
            const line = document.createElement('div');
            line.className = 'term-line';
            if (isEcho) {
                line.className = 'term-line term-command-echo';
                const prompt = root.getAttribute('data-matrix-mode') === 'true' ? 'neo@matrix:~$' : 'raj@neural:~$';
                line.innerHTML = `<span class="term-echo-prompt">${prompt}</span> <span class="term-echo-text">${escapeHtml(html)}</span>`;
            } else {
                line.innerHTML = html;
            }
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        };

        // Command definitions & Slash Command Registry
        const SLASH_COMMANDS = [
            {
                name: '/help',
                alias: 'help',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                desc: 'List all commands and keyboard shortcuts'
            },
            {
                name: '/theme',
                alias: 'theme',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
                desc: 'Switch between dark and light themes [Tab to toggle]'
            },
            {
                name: '/projects',
                alias: 'projects',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
                desc: 'List all built production systems [Tab to cycle filters]'
            },
            {
                name: '/cat',
                alias: 'cat',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
                desc: 'Deep-dive project spec & GitHub repo [Tab to cycle]'
            },
            {
                name: '/agent',
                alias: 'agent',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
                desc: 'Live streaming AI agent multi-step reasoning simulation'
            },
            {
                name: '/skills',
                alias: 'skills',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
                desc: 'Interactive technical proficiency & capability radar'
            },
            {
                name: '/about',
                alias: 'about',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                desc: 'Technical biography & AI architecture background'
            },
            {
                name: '/matrix',
                alias: 'matrix',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
                desc: 'Toggle the slow-motion Matrix reality disintegration'
            },
            {
                name: '/contact',
                alias: 'contact',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
                desc: 'Direct uplinks for email, GitHub, and LinkedIn'
            },
            {
                name: '/clear',
                alias: 'clear',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
                desc: 'Clear the terminal output screen buffer'
            },
            {
                name: '/exit',
                alias: 'exit',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
                desc: 'Close / dock the terminal HUD window'
            }
        ];

        const THEME_OPTIONS = ['/theme dark', '/theme light'];
        const PROJECTS_OPTIONS = ['/projects', '/projects --tag ai', '/projects --tag fullstack', '/projects --tag frontend', '/projects --tag tools'];

        // Get dynamic projects from DOM
        const getProjectsList = () => {
            const cards = document.querySelectorAll('.project-card');
            const list = [];
            cards.forEach((card, idx) => {
                const titleEl = card.querySelector('h3 a') || card.querySelector('h3');
                const title = titleEl ? titleEl.innerText.trim() : `Unit-${idx + 1}`;
                const descEl = card.querySelector('p');
                const desc = descEl ? descEl.innerText.trim() : '';
                const tagEls = card.querySelectorAll('.tag');
                const tags = Array.from(tagEls).map(t => t.innerText.trim());
                const linkEl = card.querySelector('a.card-live-overlay') || card.querySelector('a.card-overlay');
                const link = linkEl ? linkEl.getAttribute('href') : '#';
                const githubEl = card.querySelector('a[href*="github.com"]') || card.querySelector('h3 a');
                const githubLink = githubEl ? githubEl.getAttribute('href') : null;
                const cat = card.getAttribute('data-category') || 'general';
                list.push({ title, desc, tags, link, githubLink, cat });
            });
            return list;
        };

        const getCatOptions = () => {
            const projects = getProjectsList();
            if (projects.length > 0) {
                return projects.map(p => `/cat ${p.title}`);
            }
            return ['/cat DocuRelease AI', '/cat Rate Shift Uk', '/cat HH Judge AI', '/cat Opportunity AI'];
        };

        // Slash suggestions palette manager
        const terminalSlashMenu = document.getElementById('terminal-slash-menu');
        let activeSlashIndex = 0;
        let filteredSlashCommands = [];
        let isSlashMenuOpen = false;

        const updateSlashMenuHighlight = () => {
            if (!terminalSlashMenu) return;
            const items = terminalSlashMenu.querySelectorAll('.slash-menu-item');
            items.forEach((item, idx) => {
                if (idx === activeSlashIndex) {
                    item.classList.add('is-selected');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('is-selected');
                }
            });
        };

        const renderSlashMenu = (query) => {
            if (!terminalSlashMenu) return;
            const clean = query.startsWith('/') ? query.slice(1).toLowerCase().trim() : query.toLowerCase().trim();
            filteredSlashCommands = SLASH_COMMANDS.filter(cmd => {
                return cmd.alias.startsWith(clean) || cmd.name.startsWith('/' + clean);
            });

            if (filteredSlashCommands.length === 0) {
                closeSlashMenu();
                return;
            }

            if (activeSlashIndex >= filteredSlashCommands.length) {
                activeSlashIndex = 0;
            }

            let html = '';
            filteredSlashCommands.forEach((cmd, idx) => {
                const isSelected = idx === activeSlashIndex;
                html += `<div class="slash-menu-item ${isSelected ? 'is-selected' : ''}" data-index="${idx}" data-cmd="${cmd.name}">
                    <span class="slash-item-icon">${cmd.icon}</span>
                    <span class="slash-item-name">${cmd.name}</span>
                    <span class="slash-item-desc">${cmd.desc}</span>
                </div>`;
            });

            terminalSlashMenu.innerHTML = html;
            terminalSlashMenu.classList.add('is-visible');
            terminalSlashMenu.setAttribute('aria-hidden', 'false');
            isSlashMenuOpen = true;

            terminalSlashMenu.querySelectorAll('.slash-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cmdName = item.getAttribute('data-cmd');
                    selectSlashCommand(cmdName);
                });
            });

            updateSlashMenuHighlight();
        };

        const closeSlashMenu = () => {
            if (!terminalSlashMenu || !isSlashMenuOpen) return;
            terminalSlashMenu.classList.remove('is-visible');
            terminalSlashMenu.setAttribute('aria-hidden', 'true');
            terminalSlashMenu.innerHTML = '';
            isSlashMenuOpen = false;
            activeSlashIndex = 0;
        };

        const selectSlashCommand = (cmdName) => {
            terminalInput.value = cmdName + ' ';
            terminalInput.focus();
            closeSlashMenu();
        };

        const executeCommand = (rawInput) => {
            const trimmed = rawInput.trim();
            if (!trimmed) return;

            closeSlashMenu();
            appendOutput(trimmed, true);
            commandHistory.push(trimmed);
            historyIndex = commandHistory.length;

            const parts = trimmed.split(' ');
            const rawCmd = parts[0].toLowerCase();
            const cmd = rawCmd.startsWith('/') ? rawCmd.slice(1) : rawCmd;
            const args = parts.slice(1);

            switch (cmd) {
                case 'help': {
                    let out = '<div class="term-table">';
                    out += '<div class="term-row"><span class="term-cell-cmd">/help</span><span class="term-cell-desc">Display interactive command list & shortcuts</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/theme &lt;dark|light&gt;</span><span class="term-cell-desc">Switch site theme (press Tab to toggle options)</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/projects [--tag]</span><span class="term-cell-desc">List all built systems (press Tab to cycle filters)</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/cat &lt;name&gt;</span><span class="term-cell-desc">Deep-dive technical spec & GitHub repo (press Tab to cycle)</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/agent &lt;query&gt;</span><span class="term-cell-desc">Live streaming AI agent reasoning simulation</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/skills</span><span class="term-cell-desc">Interactive technical skill radar & proficiencies</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/about</span><span class="term-cell-desc">Technical biography & systems background</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/matrix</span><span class="term-cell-desc">Toggle the slow-motion Matrix reality simulation</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/contact</span><span class="term-cell-desc">Display direct communication uplinks</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/clear</span><span class="term-cell-desc">Clear the terminal display buffer</span></div>';
                    out += '<div class="term-row"><span class="term-cell-cmd">/exit</span><span class="term-cell-desc">Close / minimize the terminal window</span></div>';
                    out += '</div>';
                    out += '<p class="term-sub-dim">Tip: Type "/" for suggestion palette. Press Tab after /theme, /cat, or /projects to toggle options.</p>';
                    appendOutput(out);
                    break;
                }

                case 'about':
                case 'bio': {
                    let out = '<p><span class="term-highlight">RAJ COLACO</span> // Next-Gen AI Systems & Full-Stack Architect</p>';
                    out += '<p class="term-sub">Specializing in autonomous multi-agent evaluation frameworks, generative AI pipelines, real-time developer suites, and high-performance interactive interfaces.</p>';
                    out += '<p class="term-sub-dim">Currently engineering scalable AI products, LLM evaluation pipelines (Gemini 2.5 Pro / Claude 3.5), distributed graph analysis engines, and neural visualizers.</p>';
                    appendOutput(out);
                    break;
                }

                case 'skills':
                case 'tech': {
                    let out = '<p class="term-highlight">CORE TECHNICAL CAPABILITIES & PROFICIENCY RADAR:</p>';
                    out += '<p><strong>[01] AI & AGENTIC SYSTEMS</strong> <span class="term-cmd">[████████████] 98%</span><br>';
                    out += '<span class="term-badge-tag">Multi-Agent Debate</span><span class="term-badge-tag">LLM Evals</span><span class="term-badge-tag">RAG Architecture</span><span class="term-badge-tag">LangGraph</span><span class="term-badge-tag">Prompt Engineering</span></p>';
                    out += '<p><strong>[02] FULL-STACK & CLOUD</strong> <span class="term-cmd">[███████████░] 94%</span><br>';
                    out += '<span class="term-badge-tag">TypeScript</span><span class="term-badge-tag">Node.js</span><span class="term-badge-tag">Python (FastAPI)</span><span class="term-badge-tag">PostgreSQL</span><span class="term-badge-tag">Docker</span><span class="term-badge-tag">WebSockets</span></p>';
                    out += '<p><strong>[03] FRONTEND & INTERACTION</strong> <span class="term-cmd">[███████████░] 92%</span><br>';
                    out += '<span class="term-badge-tag">React / Next.js</span><span class="term-badge-tag">Modern Vanilla CSS</span><span class="term-badge-tag">Canvas / WebGL</span><span class="term-badge-tag">High-Perf UI</span><span class="term-badge-tag">WAAPI</span></p>';
                    out += '<p><strong>[04] TOOLING & INFRASTRUCTURE</strong> <span class="term-cmd">[██████████░░] 88%</span><br>';
                    out += '<span class="term-badge-tag">Git CI/CD</span><span class="term-badge-tag">Linux / POSIX</span><span class="term-badge-tag">Vercel</span><span class="term-badge-tag">Vector DBs</span><span class="term-badge-tag">Redis</span></p>';
                    appendOutput(out);
                    break;
                }

                case 'projects':
                case 'ls': {
                    const tagFilter = args.find(a => a.startsWith('--tag=') || a === '--tag') ? (args[args.indexOf('--tag') + 1] || args[0].replace('--tag=', '')) : null;
                    const projects = getProjectsList();
                    let matched = projects;
                    if (tagFilter) {
                        matched = projects.filter(p => p.cat.toLowerCase().includes(tagFilter.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase())));
                    }
                    let out = `<p class="term-highlight">DEPLOYED PRODUCTION UNITS (${matched.length} ACTIVE):</p>`;
                    out += '<div class="term-table">';
                    matched.forEach((p) => {
                        const title = escapeHtml(p.title);
                        const tagsStr = p.tags.slice(0, 2).map(t => `[${escapeHtml(t)}]`).join(' ');
                        const liveLink = p.link && p.link !== '#' ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer" class="term-link">Demo ↗</a>` : '';
                        const ghLink = p.githubLink ? `<a href="${escapeHtml(p.githubLink)}" target="_blank" rel="noopener noreferrer" class="term-link">GitHub ↗</a>` : '';
                        const linksFormatted = [liveLink, ghLink].filter(Boolean).join(' | ');
                        out += `<div class="term-row">
                            <span class="term-cell-cmd">${title}</span>
                            <span class="term-cell-desc">${tagsStr}${linksFormatted ? ' - ' + linksFormatted : ''} (type: cat "${title}")</span>
                        </div>`;
                    });
                    out += '</div>';
                    appendOutput(out);
                    break;
                }

                case 'cat': {
                    const rawQuery = args.join(' ').replace(/^["']|["']$/g, '').toLowerCase().trim();
                    if (!rawQuery) {
                        appendOutput('<p class="term-sub">Usage: /cat &lt;project-name&gt; (e.g. /cat "Instant QR" or /cat DocuRelease)</p>');
                        break;
                    }
                    const normQuery = rawQuery.replace(/[^a-z0-9]/g, '');
                    const projects = getProjectsList();
                    const found = projects.find(p => {
                        const titleLower = p.title.toLowerCase();
                        const normTitle = titleLower.replace(/[^a-z0-9]/g, '');
                        const normCat = p.cat.toLowerCase().replace(/[^a-z0-9]/g, '');

                        let repoMatch = false;
                        if (p.githubLink) {
                            const repo = p.githubLink.split('/').filter(Boolean).pop().toLowerCase();
                            const normRepo = repo.replace(/[^a-z0-9]/g, '');
                            if (repo.includes(rawQuery) || (normQuery && (normRepo.includes(normQuery) || normQuery.includes(normRepo)))) {
                                repoMatch = true;
                            }
                        }

                        return titleLower.includes(rawQuery) ||
                               (normQuery && (normTitle.includes(normQuery) || normQuery.includes(normTitle))) ||
                               (normQuery && normCat.includes(normQuery)) ||
                               repoMatch;
                    });
                    if (!found) {
                        appendOutput(`<p class="term-sub">System unit matching "${escapeHtml(rawQuery)}" not found. Type <span class="term-cmd">/projects</span> to view all units.</p>`);
                    } else {
                        let out = `<p class="term-highlight">SYSTEM SPECIFICATION: ${escapeHtml(found.title.toUpperCase())}</p>`;
                        out += `<p class="term-sub"><strong>Category:</strong> [${escapeHtml(found.cat.toUpperCase())}] | <strong>Tags:</strong> ${found.tags.map(escapeHtml).join(', ')}</p>`;
                        out += `<p><strong>Overview:</strong> ${escapeHtml(found.desc)}</p>`;
                        if (found.githubLink) {
                            out += `<p><strong>GitHub Repository:</strong> <a href="${escapeHtml(found.githubLink)}" target="_blank" rel="noopener noreferrer" class="term-link">${escapeHtml(found.githubLink)} ↗</a></p>`;
                        }
                        if (found.link && found.link !== '#' && found.link !== found.githubLink) {
                            out += `<p><strong>Live Demo:</strong> <a href="${escapeHtml(found.link)}" target="_blank" rel="noopener noreferrer" class="term-link">${escapeHtml(found.link)} ↗</a></p>`;
                        }
                        appendOutput(out);
                    }
                    break;
                }

                case 'agent':
                case 'eval': {
                    const prompt = args.join(' ');
                    if (!prompt) {
                        appendOutput('<p class="term-sub">Usage: agent &lt;your query or task description&gt;</p><p class="term-sub-dim">Example: agent "Evaluate RAG vs Fine-tuning for multi-agent systems"</p>');
                        break;
                    }
                    if (isStreaming) {
                        appendOutput('<p class="term-sub">Agent kernel is already processing a thread. Please wait...</p>');
                        break;
                    }
                    isStreaming = true;
                    appendOutput(`<p class="term-sub"><span class="term-highlight">[AGENT KERNEL]</span> Dispatching autonomous reasoning chain for: "${escapeHtml(prompt)}"</p>`);

                    const streamBox = document.createElement('div');
                    streamBox.className = 'term-line term-token-stream';
                    streamBox.innerHTML = '<span class="stream-content">Initializing neural tokenizer...</span><span class="term-stream-cursor"></span>';
                    terminalOutput.appendChild(streamBox);
                    terminalOutput.scrollTop = terminalOutput.scrollHeight;

                    const contentSpan = streamBox.querySelector('.stream-content');

                    const responses = [
                        `Analyzed task: "${prompt}".\n` +
                        `• Decomposing multi-step dependencies via neural DAG.\n` +
                        `• Context evaluation: Verified token budget (4,096 tokens allocated).\n` +
                        `• Consensus verdict: For production reliability, combining semantic vector routing with structured agent verification produces a 34% drop in hallucination rates compared to naive zero-shot generation.\n` +
                        `• Latency: 78ms | Confidence: 99.2% | Status: CONVERGED.`,

                        `Running evaluation sequence for: "${prompt}".\n` +
                        `• Parallel verification executed across 3 sub-agent nodes.\n` +
                        `• Node A (Heuristics): Pass.\n` +
                        `• Node B (Latency optimization): P99 estimated at 42ms.\n` +
                        `• Synthesis: Architecture validated against production benchmarks. Operational ready.`
                    ];

                    const textToStream = responses[Math.floor(Math.random() * responses.length)];
                    const words = textToStream.split(' ');
                    let wIdx = 0;
                    contentSpan.innerText = '';

                    const streamTimer = setInterval(() => {
                        if (wIdx < words.length) {
                            contentSpan.innerText += (wIdx === 0 ? '' : ' ') + words[wIdx];
                            wIdx++;
                            terminalOutput.scrollTop = terminalOutput.scrollHeight;
                        } else {
                            clearInterval(streamTimer);
                            isStreaming = false;
                            const cursor = streamBox.querySelector('.term-stream-cursor');
                            if (cursor) cursor.remove();
                            appendOutput('<p class="term-sub-dim">⚡ Stream finished. Telemetry: 54.2 tokens/sec | Model: Gemini-2.5-Neural | State: IDLE</p>');
                        }
                    }, 45);
                    break;
                }

                case 'matrix': {
                    appendOutput('<p class="term-highlight">[SYSTEM OVERRIDE] Toggling Matrix reality simulation...</p>');
                    const nextMatrix = root.getAttribute('data-matrix-mode') !== 'true';
                    requestThemeSwap('matrix', nextMatrix);
                    break;
                }

                case 'theme': {
                    const mode = args[0] ? args[0].toLowerCase() : '';
                    if (mode === 'light' || mode === 'dark') {
                        requestThemeSwap('theme', mode);
                        appendOutput(`<p class="term-sub">Theme switched to <span class="term-cmd">${mode.toUpperCase()}</span> mode.</p>`);
                    } else {
                        const current = root.getAttribute('data-theme') || 'dark';
                        const next = current === 'light' ? 'dark' : 'light';
                        requestThemeSwap('theme', next);
                        appendOutput(`<p class="term-sub">Theme toggled to <span class="term-cmd">${next.toUpperCase()}</span> mode.</p>`);
                    }
                    break;
                }

                case 'contact':
                case 'ping': {
                    let out = '<p class="term-highlight">COMMUNICATION UPLINKS:</p>';
                    out += '<p>• <strong>Email:</strong> <a href="mailto:raj45colaco@gmail.com" class="term-link">raj45colaco@gmail.com</a></p>';
                    out += '<p>• <strong>GitHub:</strong> <a href="https://github.com/roco007" target="_blank" rel="noopener noreferrer" class="term-link">github.com/roco007 ↗</a></p>';
                    out += '<p>• <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/raj-colaco/" target="_blank" rel="noopener noreferrer" class="term-link">linkedin.com/in/raj-colaco ↗</a></p>';
                    out += '<p>• <strong>Status:</strong> <span class="term-cmd">AVAILABLE // FORWARD-DEPLOYED & SENIOR AI ROLES</span></p>';
                    appendOutput(out);
                    break;
                }

                case 'clear':
                case 'cls': {
                    terminalOutput.innerHTML = '';
                    break;
                }

                case 'sudo': {
                    if (args.join(' ').includes('rm -rf')) {
                        appendOutput('<p style="color:#ff4444; font-weight:700;">[CRITICAL ALERT] UNAUTHORIZED ROOT ACCESS DETECTED.</p>');
                        appendOutput('<p style="color:#ff8888;">Purging kernel sectors: /root /sys /dev /neural-matrix ...</p>');
                        setTimeout(() => {
                            appendOutput('<p class="term-cmd">⚡ [FAILSAFE ENGAGED] Security watchdog neutralized breach. Nice try, hacker.</p>');
                        }, 700);
                    } else {
                        appendOutput('<p class="term-sub">Permission denied: guest user cannot execute sudo commands without biometric uplink.</p>');
                    }
                    break;
                }

                case 'exit':
                case 'quit': {
                    closeTerminal();
                    break;
                }

                default: {
                    appendOutput(`<p class="term-sub">Command not recognized: "<span style="color:#ff6666;">${escapeHtml(trimmed)}</span>". Type <span class="term-cmd">/help</span> or <span class="term-cmd">/</span> for suggestions.</p>`);
                    break;
                }
            }
        };

        terminalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = terminalInput.value;
            terminalInput.value = '';
            executeCommand(val);
        });

        // Real-time Slash Menu Filtering on Input
        terminalInput.addEventListener('input', () => {
            const val = terminalInput.value;
            if (val.startsWith('/')) {
                // If it contains spaces and arguments (e.g. "/theme " or "/cat "), close popup
                if (val.includes(' ')) {
                    closeSlashMenu();
                } else {
                    renderSlashMenu(val);
                }
            } else {
                closeSlashMenu();
            }
        });

        // Close slash menu on click outside
        document.addEventListener('click', (e) => {
            if (isSlashMenuOpen && terminalSlashMenu && !terminalSlashMenu.contains(e.target) && e.target !== terminalInput) {
                closeSlashMenu();
            }
        });

        // Keyboard navigation for slash menu, command history, and cyclic Tab option toggling
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                if (isSlashMenuOpen && filteredSlashCommands.length > 0) {
                    e.preventDefault();
                    activeSlashIndex = (activeSlashIndex - 1 + filteredSlashCommands.length) % filteredSlashCommands.length;
                    updateSlashMenuHighlight();
                    return;
                }
                e.preventDefault();
                if (commandHistory.length > 0 && historyIndex > 0) {
                    historyIndex--;
                    terminalInput.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                if (isSlashMenuOpen && filteredSlashCommands.length > 0) {
                    e.preventDefault();
                    activeSlashIndex = (activeSlashIndex + 1) % filteredSlashCommands.length;
                    updateSlashMenuHighlight();
                    return;
                }
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    terminalInput.value = commandHistory[historyIndex];
                } else {
                    historyIndex = commandHistory.length;
                    terminalInput.value = '';
                }
            } else if (e.key === 'Enter') {
                if (isSlashMenuOpen && filteredSlashCommands.length > 0) {
                    e.preventDefault();
                    const chosen = filteredSlashCommands[activeSlashIndex] || filteredSlashCommands[0];
                    selectSlashCommand(chosen.name);
                    return;
                }
            } else if (e.key === 'Escape') {
                if (isSlashMenuOpen) {
                    e.preventDefault();
                    closeSlashMenu();
                    return;
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();

                // If slash menu is visible, complete current highlighted suggestion
                if (isSlashMenuOpen && filteredSlashCommands.length > 0) {
                    const chosen = filteredSlashCommands[activeSlashIndex] || filteredSlashCommands[0];
                    selectSlashCommand(chosen.name);
                    return;
                }

                const currentVal = terminalInput.value;
                const trimmed = currentVal.trim();

                // 1. Theme option cycling: "/theme" or "/theme " or "/theme dark" or "/theme light"
                if (/^(\/)?theme(\s+.*)?$/i.test(trimmed)) {
                    let idx = THEME_OPTIONS.findIndex(opt => opt.toLowerCase() === trimmed.toLowerCase());
                    const nextIdx = (idx + 1) % THEME_OPTIONS.length;
                    terminalInput.value = THEME_OPTIONS[nextIdx];
                    return;
                }

                // 2. Cat project cycling: "/cat" or "/cat " or "/cat <project>"
                if (/^(\/)?cat(\s+.*)?$/i.test(trimmed)) {
                    const catOptions = getCatOptions();
                    if (catOptions.length > 0) {
                        let idx = catOptions.findIndex(opt => opt.toLowerCase() === trimmed.toLowerCase());
                        if (idx === -1) {
                            const arg = trimmed.replace(/^(\/)?cat\s*/i, '').trim();
                            if (arg) {
                                idx = catOptions.findIndex(opt => opt.toLowerCase().includes(arg.toLowerCase()));
                            }
                        }
                        const nextIdx = (idx + 1) % catOptions.length;
                        terminalInput.value = catOptions[nextIdx];
                        return;
                    }
                }

                // 3. Projects filter cycling: "/projects" or "/projects " or "/projects --tag ..."
                if (/^(\/)?projects(\s+.*)?$/i.test(trimmed)) {
                    let idx = PROJECTS_OPTIONS.findIndex(opt => opt.toLowerCase() === trimmed.toLowerCase());
                    const nextIdx = (idx + 1) % PROJECTS_OPTIONS.length;
                    terminalInput.value = PROJECTS_OPTIONS[nextIdx];
                    return;
                }

                // Default auto-complete for any slash command
                if (trimmed) {
                    const norm = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
                    const match = SLASH_COMMANDS.find(c => c.name.startsWith(norm.toLowerCase()));
                    if (match) {
                        terminalInput.value = match.name + ' ';
                    }
                }
            }
        });
    }
});
