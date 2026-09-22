/**
 * Next-Gen Futuristic Portfolio Interactions & Cyber Visual Engine
 * - Dark / Light Theme Manager (persisted + OS preference aware)
 * - Interactive Neural Particle Canvas
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
    const THEME_COLORS = { dark: '#030712', light: '#f2f6fc' };
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

    const applyTheme = (theme, persist) => {
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
            themeColorMeta.setAttribute('content', THEME_COLORS[resolved]);
        }

        if (themeToggle) {
            const isLight = resolved === 'light';
            themeToggle.setAttribute('aria-pressed', String(isLight));
            themeToggle.setAttribute('title', isLight ? 'Switch to dark mode' : 'Switch to light mode');
        }

        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: resolved } }));
    };

    // The inline head bootstrap already painted the correct theme - re-apply to sync control state
    applyTheme(root.getAttribute('data-theme') || (colorSchemeQuery.matches ? 'light' : 'dark'));

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
        });
    }

    // Follow the OS preference until the visitor makes an explicit choice
    const handleSystemThemeChange = (event) => {
        if (readStoredTheme()) return;
        applyTheme(event.matches ? 'light' : 'dark');
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
            }
        };

        const resolvePalette = () => (
            document.documentElement.getAttribute('data-theme') === 'light'
                ? PARTICLE_PALETTES.light
                : PARTICLE_PALETTES.dark
        );

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

        // Re-skin the constellation when the visitor flips the theme
        document.addEventListener('themechange', () => {
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
    const glyphs = '0101_#@$%=+-~*<>[]{}/\\^!&?';

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
