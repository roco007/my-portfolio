import { useState, useEffect, useCallback } from 'react';
import { Terminal } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AmbientCanvas } from './components/AmbientCanvas';
import { DeveloperTerminal } from './components/DeveloperTerminal';
import { TimelineScrubber } from './components/TimelineScrubber';
import { IntroAnimation } from './components/IntroAnimation';
import { PinnedStoryContainer } from './components/PinnedStoryContainer';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('portfolio-theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return 'dark'; // Anime.js signature dark aesthetic
    }
    return 'dark';
  });

  const [terminalOpen, setTerminalOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [activeChapter, setActiveChapter] = useState<string>('HEADING');

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
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#151413' : '#f6f4f2');
    }
  }, [theme]);

  const toggleTheme = (targetTheme?: 'dark' | 'light') => {
    if (targetTheme) {
      setTheme(targetTheme);
    } else {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  const handleProgressChange = useCallback((_progress: number, chapter: string) => {
    setActiveChapter((prev) => (prev === chapter ? prev : chapter));
  }, []);

  return (
    <>
      {/* Anime.js Cinematic Intro Sequence */}
      {showIntro && (
        <IntroAnimation onComplete={() => setShowIntro(false)} />
      )}

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
        onReplayIntro={() => setShowIntro(true)}
      />

      {/* Master Pinned Scrollytelling Storyboard */}
      <main id="main-content" tabIndex={-1}>
        <PinnedStoryContainer
          onOpenTerminal={() => setTerminalOpen(true)}
          onReplayIntro={() => setShowIntro(true)}
          onProgressChange={handleProgressChange}
        />
      </main>

      {/* Floating Scrubber Dock (Anime.js aesthetic) */}
      <div className="bottom-scrubber-dock">
        <TimelineScrubber activeSection={activeChapter} />
      </div>

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

        @media (max-width: 768px) {
          .bottom-scrubber-dock {
            bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px));
            left: 0.6rem;
          }

          .floating-terminal-trigger {
            bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px));
            right: 0.6rem;
            padding: 0.38rem 0.65rem;
            font-size: 0.7rem;
          }

          .floating-terminal-trigger .kbd-badge {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .bottom-scrubber-dock {
            bottom: calc(0.45rem + env(safe-area-inset-bottom, 0px));
            left: 0.45rem;
          }

          .floating-terminal-trigger {
            bottom: calc(0.45rem + env(safe-area-inset-bottom, 0px));
            right: 0.45rem;
            padding: 0.32rem 0.55rem;
          }
        }
      `}</style>
    </>
  );
}

export default App;
