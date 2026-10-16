import { useState, useEffect } from 'react';

/**
 * Hook to detect and react to user's reduced motion system preference.
 */
export function useReducedMotion(): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  return matches;
}
