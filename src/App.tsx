import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AmbientCanvas } from './components/AmbientCanvas';
import { DeveloperTerminal } from './components/DeveloperTerminal';
import { InteractiveMotionLab } from './components/InteractiveMotionLab';
import { TimelineScrubber } from './components/TimelineScrubber';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Skills } from './sections/Skills';
import { Projects } from './sections/Projects';
import { Experience } from './sections/Experience';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('portfolio-theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  const [terminalOpen, setTerminalOpen] = useState<boolean>(false);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch {
      // Storage unavailable
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#050811' : '#f8fafc');
    }
  }, [theme]);

  const toggleTheme = (targetTheme?: 'dark' | 'light') => {
    if (targetTheme) {
      setTheme(targetTheme);
    } else {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* Ambient Canvas Background */}
      <AmbientCanvas theme={theme} />

      {/* Primary Navigation */}
      <Navbar
        theme={theme}
        onToggleTheme={() => toggleTheme()}
        onOpenTerminal={() => setTerminalOpen(true)}
      />

      {/* Main Content Sections */}
      <main id="main-content" tabIndex={-1}>
        <Hero onOpenTerminal={() => setTerminalOpen(true)} />
        <InteractiveMotionLab />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact onOpenTerminal={() => setTerminalOpen(true)} />
      </main>

      {/* Floating Scrubber Dock (Anime.js aesthetic) */}
      <div className="bottom-scrubber-dock">
        <TimelineScrubber activeSection="hero" />
      </div>

      {/* Footer */}
      <Footer />

      {/* Developer CLI Terminal Modal */}
      <DeveloperTerminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Floating CLI Dock Trigger (Bottom Right) */}
      <button
        type="button"
        className="floating-terminal-trigger"
        onClick={() => setTerminalOpen(true)}
        title="Open Developer Console (Ctrl + `)"
        aria-label="Toggle Developer Terminal"
      >
        <Terminal size={15} />
        <span>&gt;_ CLI</span>
        <span className="kbd-badge">Ctrl+`</span>
      </button>

      <style>{`
        .bottom-scrubber-dock {
          position: fixed;
          bottom: 1.5rem;
          left: 1.5rem;
          z-index: 900;
          display: flex;
          align-items: center;
        }

        .floating-terminal-trigger {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 900;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border-subtle);
          color: var(--accent-cyan);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.55rem 0.95rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          box-shadow: 0 8px 25px -4px rgba(0, 0, 0, 0.5), 0 0 15px rgba(var(--accent-cyan-rgb), 0.2);
          transition: all var(--transition-fast);
        }

        .floating-terminal-trigger:hover {
          transform: translateY(-2px);
          border-color: var(--accent-cyan);
          background: var(--bg-card-hover);
          box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 22px rgba(var(--accent-cyan-rgb), 0.4);
        }

        .kbd-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-dim);
          color: var(--text-tertiary);
          font-size: 0.65rem;
          padding: 0.15rem 0.35rem;
          border-radius: var(--radius-xs);
        }

        @media (max-width: 640px) {
          .floating-terminal-trigger .kbd-badge {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

export default App;
