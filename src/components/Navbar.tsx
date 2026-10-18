import React, { useState, useEffect } from 'react';
import { Terminal, Menu, X, Github, Mail, Play, Download } from 'lucide-react';
import { NAV_LINKS, SOCIAL_LINKS } from '../data/portfolio';
import { getNearestStoryChapter, getStoryChapterById } from '../data/storyChapters';
import { ThemeToggle } from './ThemeToggle';
import styles from './Navbar.module.css';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenTerminal: () => void;
  onReplayIntro?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenTerminal,
  onReplayIntro,
}) => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      // 1. Header background blur on scroll
      const scrolled = window.scrollY > 30;
      setIsScrolled(scrolled);

      // 2. Scroll progress calculation
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const ratio = window.scrollY / totalHeight;
        setScrollProgress(ratio * 100);

        setActiveSection(getNearestStoryChapter(ratio).id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const chapter = getStoryChapterById(id);
    if (chapter) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: chapter.target * maxScroll,
        behavior: 'smooth',
      });
      return;
    }

    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Scroll Progress Bar matching animejs red */}
      <div
        className={styles.progressBar}
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <header
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}
        role="banner"
      >
        <div className={`container ${styles.navContainer}`}>
          {/* Logo / Identity matching animejs font & red dot */}
          <a
            href="#hero"
            onClick={(e) => scrollToSection(e, 'hero')}
            className={styles.logo}
            aria-label="Raj Colaco - Home"
          >
            <span className={styles.logoName}>raj.colaco</span>
            <span className={styles.logoDot} />
          </a>

          {/* Desktop Navigation Links matching animejs */}
          <nav className={styles.desktopNav} aria-label="Primary Navigation">
            <ul className={styles.navList}>
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(e) => scrollToSection(e, link.id)}
                      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Nav Actions */}
          <div className={styles.navActions}>
            {/* Replay Intro Button */}
            {onReplayIntro && (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onReplayIntro}
                title="Replay Welcome Intro Animation"
                aria-label="Replay Welcome Intro Animation"
              >
                <Play size={14} />
              </button>
            )}

            {/* Terminal CLI Button */}
            <button
              type="button"
              className={styles.cliBtn}
              onClick={onOpenTerminal}
              title="Open Developer CLI Console (Ctrl + `)"
              aria-label="Open Developer CLI Console"
            >
              <Terminal size={14} />
              <span>CLI</span>
            </button>

            {/* GitHub Profile Link */}
            <a
              href={
                SOCIAL_LINKS.find((s) => s.platform === 'github')?.url ||
                'https://github.com/roco007'
              }
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
              title="GitHub Profile"
              aria-label="GitHub Profile"
            >
              <Github size={16} />
            </a>

            {/* Theme Toggle */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <a
              href="/Raj_Colaco_Resume.pdf"
              download
              className={styles.resumeBtn}
              title="Download Raj Colaco's resume as a PDF"
              aria-label="Download Raj Colaco's resume as a PDF"
            >
              <Download size={14} />
              <span>RESUME</span>
            </a>

            {/* Signature Red Contact Pill matching Anime.js SPONSOR button */}
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, 'contact')}
              className={styles.contactBtn}
              aria-label="Contact Raj Colaco"
            >
              <Mail size={13} />
              <span>CONTACT</span>
            </a>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className={styles.mobileToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className={styles.mobileDrawer} role="dialog" aria-modal="true">
            <nav aria-label="Mobile Navigation">
              <ul className={styles.mobileList}>
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(e) => scrollToSection(e, link.id)}
                      className={`${styles.mobileLink} ${activeSection === link.id ? styles.active : ''}`}
                    >
                      <span className={styles.mobileNumber}>{link.number}.</span>
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="/Raj_Colaco_Resume.pdf"
                    download
                    className={styles.mobileResumeBtn}
                  >
                    <Download size={15} />
                    <span>DOWNLOAD RESUME</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    onClick={(e) => scrollToSection(e, 'contact')}
                    className={styles.mobileContactBtn}
                  >
                    <Mail size={15} />
                    <span>CONTACT RAJ</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};
