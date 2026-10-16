import React from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={styles.toggleBtn}
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={!isDark}
    >
      <span className={styles.iconWrapper}>
        {isDark ? (
          <Sun className={styles.iconSun} size={18} aria-hidden="true" />
        ) : (
          <Moon className={styles.iconMoon} size={18} aria-hidden="true" />
        )}
      </span>
      <span className={styles.label}>{isDark ? 'LIGHT' : 'DARK'}</span>
    </button>
  );
};
