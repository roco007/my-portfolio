import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Square } from 'lucide-react';
import { PERSONAL_INFO, PROJECTS, SKILL_CATEGORIES, SOCIAL_LINKS } from '../data/portfolio';
import styles from './DeveloperTerminal.module.css';

interface DeveloperTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (newTheme?: 'dark' | 'light') => void;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  output: React.ReactNode;
}

const AVAILABLE_COMMANDS = [
  { name: '/help', desc: 'Display interactive command manual' },
  { name: '/about', desc: 'Technical biography & AI systems background' },
  { name: '/skills', desc: 'Core capabilities & technical proficiency radar' },
  { name: '/projects', desc: 'List all deployed production units' },
  { name: '/theme', desc: 'Switch theme (/theme dark or /theme light)' },
  { name: '/contact', desc: 'Direct encrypted communication uplinks' },
  { name: '/clear', desc: 'Clear the terminal screen buffer' },
  { name: '/exit', desc: 'Close developer terminal HUD' },
];

export const DeveloperTerminal: React.FC<DeveloperTerminalProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [pastCommands, setPastCommands] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Global keydown: Esc to close, Ctrl + ` to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCommand = (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setPastCommands((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase().replace(/^\//, '');
    const args = parts.slice(1);

    let outputNode: React.ReactNode = null;

    switch (cmd) {
      case 'help': {
        outputNode = (
          <div className={styles.helpTable}>
            <p className={styles.termHighlight}>AVAILABLE SYSTEM COMMANDS:</p>
            {AVAILABLE_COMMANDS.map((c) => (
              <div key={c.name} className={styles.tableRow}>
                <span
                  className={styles.clickableCmd}
                  onClick={() => handleCommand(c.name)}
                >
                  {c.name}
                </span>
                <span className={styles.tableDesc}>{c.desc}</span>
              </div>
            ))}
          </div>
        );
        break;
      }

      case 'about':
      case 'bio': {
        outputNode = (
          <div className={styles.outputBlock}>
            <p className={styles.termHighlight}>{PERSONAL_INFO.name} // {PERSONAL_INFO.role}</p>
            <p>{PERSONAL_INFO.bio[0]}</p>
            <p className={styles.termSub}>{PERSONAL_INFO.bio[1]}</p>
            <p className={styles.termDim}>Location: {PERSONAL_INFO.location} | Status: {PERSONAL_INFO.status}</p>
          </div>
        );
        break;
      }

      case 'skills':
      case 'tech': {
        outputNode = (
          <div className={styles.outputBlock}>
            <p className={styles.termHighlight}>TECHNICAL PROFICIENCY RADAR:</p>
            {SKILL_CATEGORIES.map((cat) => (
              <div key={cat.id} className={styles.skillGroup}>
                <p className={styles.skillTitle}>[{cat.title}]</p>
                <div className={styles.skillChips}>
                  {cat.skills.map((s) => (
                    <span key={s.name} className={s.highlight ? styles.chipHighlight : styles.chip}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
        break;
      }

      case 'projects':
      case 'ls': {
        outputNode = (
          <div className={styles.outputBlock}>
            <p className={styles.termHighlight}>DEPLOYED PRODUCTION UNITS ({PROJECTS.length} TOTAL):</p>
            <div className={styles.projectList}>
              {PROJECTS.map((p) => (
                <div key={p.id} className={styles.projectRow}>
                  <span className={styles.projSys}>{p.sysId}</span>
                  <span className={styles.projTitle}>{p.title}</span>
                  <span className={styles.projCat}>[{p.categoryLabel}]</span>
                  <div className={styles.projLinks}>
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className={styles.termLink}>
                        Demo ↗
                      </a>
                    )}
                    <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.termLink}>
                      GitHub ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
      }

      case 'theme': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'dark' || sub === 'light') {
          onToggleTheme(sub);
          outputNode = <p className={styles.termHighlight}>Switched UI Theme to: {sub.toUpperCase()}</p>;
        } else {
          onToggleTheme();
          outputNode = <p className={styles.termHighlight}>Toggled UI Theme to: {theme === 'dark' ? 'LIGHT' : 'DARK'}</p>;
        }
        break;
      }

      case 'contact': {
        outputNode = (
          <div className={styles.outputBlock}>
            <p className={styles.termHighlight}>COMMUNICATION UPLINKS:</p>
            <p>Email: <a href={`mailto:${PERSONAL_INFO.email}`} className={styles.termLink}>{PERSONAL_INFO.email}</a></p>
            <div className={styles.socialRows}>
              {SOCIAL_LINKS.map((s) => (
                <p key={s.name}>
                  {s.name}: <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.termLink}>{s.handle} ↗</a>
                </p>
              ))}
            </div>
          </div>
        );
        break;
      }

      case 'clear': {
        setHistory([]);
        setInputVal('');
        return;
      }

      case 'exit': {
        onClose();
        return;
      }

      default: {
        outputNode = (
          <p className={styles.termError}>
            Command not recognized: "{trimmed}". Type <span className={styles.clickableCmd} onClick={() => handleCommand('/help')}>/help</span> to see valid commands.
          </p>
        );
        break;
      }
    }

    setHistory((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        command: trimmed,
        output: outputNode,
      },
    ]);

    setInputVal('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommand(inputVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pastCommands.length === 0) return;
      const nextIdx = historyIndex + 1 < pastCommands.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIdx);
      setInputVal(pastCommands[pastCommands.length - 1 - nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(pastCommands[pastCommands.length - 1 - nextIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.terminalOverlay} role="dialog" aria-modal="true" aria-label="Developer CLI Console">
      <div className={styles.backdrop} onClick={onClose} />

      <div className={`${styles.window} ${isMaximized ? styles.maximized : ''}`}>
        {/* Terminal Header Bar */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={`${styles.dot} ${styles.red}`}
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close Terminal"
            >
              <X size={10} />
            </button>
            <button
              type="button"
              className={`${styles.dot} ${styles.yellow}`}
              onClick={onClose}
              title="Minimize"
              aria-label="Minimize Terminal"
            >
              <Minus size={10} />
            </button>
            <button
              type="button"
              className={`${styles.dot} ${styles.green}`}
              onClick={() => setIsMaximized(!isMaximized)}
              title="Maximize"
              aria-label="Maximize Terminal"
            >
              <Square size={8} />
            </button>
            <span className={styles.title}>
              [SYS.KERNEL // DEV-CLI v2.0]
            </span>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.shortcutHint}>Press Esc or Ctrl+` to exit</span>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className={styles.body}>
          {/* Welcome Banner */}
          <div className={styles.welcomeBanner}>
            <pre className={styles.asciiArt}>{`
 ██████╗   █████╗        ██╗    ██████╗  ███████╗██╗   ██╗
 ██╔══██╗ ██╔══██╗       ██║    ██╔══██╗ ██╔════╝██║   ██║
 ██████╔╝ ███████║       ██║    ██║  ██║ █████╗  ██║   ██║
 ██╔══██╗ ██╔══██║  ██   ██║    ██║  ██║ ██╔══╝  ╚██╗ ██╔╝
 ██║  ██║ ██║  ██║  ╚█████╔╝    ██████╔╝ ███████╗ ╚████╔╝ 
 ╚═╝  ╚═╝ ╚═╝  ╚═╝   ╚════╝     ╚═════╝  ╚══════╝  ╚═══╝  
            `}</pre>
            <p className={styles.welcomeTitle}>
              ⚡ <span className={styles.termHighlight}>RAJ COLACO // AI & FULL-STACK SYSTEMS TERMINAL</span> ⚡
            </p>
            <p className={styles.welcomeSub}>
              Type <span className={styles.clickableCmd} onClick={() => handleCommand('/help')}>/help</span> for commands, or select a shortcut below:
            </p>
            <div className={styles.quickCmds}>
              {AVAILABLE_COMMANDS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={styles.quickCmdBtn}
                  onClick={() => handleCommand(c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rendered History Items */}
          {history.map((item) => (
            <div key={item.id} className={styles.historyEntry}>
              <div className={styles.inputEcho}>
                <span className={styles.prompt}>raj@kernel:~$</span>
                <span className={styles.cmdText}>{item.command}</span>
              </div>
              <div className={styles.outputContent}>{item.output}</div>
            </div>
          ))}

          <div ref={outputEndRef} />

          {/* Active Command Input Line */}
          <form className={styles.inputRow} onSubmit={handleSubmit}>
            <span className={styles.prompt}>raj@kernel:~$</span>
            <input
              ref={inputRef}
              type="text"
              className={styles.terminalInput}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
              aria-label="Terminal Command Input"
              placeholder="type /help or select above..."
            />
          </form>
        </div>
      </div>
    </div>
  );
};
