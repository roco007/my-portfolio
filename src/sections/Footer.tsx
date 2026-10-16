import React from 'react';
import { ArrowUp } from 'lucide-react';
import { PERSONAL_INFO, SOCIAL_LINKS, NAV_LINKS } from '../data/portfolio';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.container}`}>
        <div className={styles.topRow}>
          {/* Identity & Status */}
          <div className={styles.identity}>
            <a href="#hero" className={styles.logo}>
              <span className={styles.bracket}>[</span>
              <span className={styles.logoAccent}>RC</span>
              <span className={styles.logoDot}>.</span>
              <span className={styles.logoRole}>DEV</span>
              <span className={styles.bracket}>]</span>
            </a>
            <p className={styles.identityRole}>{PERSONAL_INFO.role}</p>
            <div className={styles.statusIndicator}>
              <span className={styles.pulseDot} />
              <span>SYSTEM STATUS: OPERATIONAL // ZERO COMPROMISES</span>
            </div>
          </div>

          {/* Quick Section Navigation */}
          <nav className={styles.footerNav} aria-label="Footer Navigation">
            <span className={styles.navHeading}>QUICK ACCESS</span>
            <ul className={styles.navList}>
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a href={`#${link.id}`} className={styles.navLink}>
                    <span className={styles.linkNumber}>{link.number}.</span>
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Verified Social Uplinks */}
          <div className={styles.socialCol}>
            <span className={styles.navHeading}>VERIFIED CHANNELS</span>
            <ul className={styles.socialList}>
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                  >
                    {link.name} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Year & Back to Top */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {currentYear} {PERSONAL_INFO.name}. Engineered with React 19, TypeScript & Anime.js 4.
          </p>

          <button
            type="button"
            className={styles.backToTopBtn}
            onClick={scrollToTop}
            aria-label="Back to top of page"
            title="Back to top"
          >
            <span>RETURN TO TOP</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};
