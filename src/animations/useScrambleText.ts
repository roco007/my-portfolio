import { useState, useRef, useCallback, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

const CYBER_GLYPHS = '0101_#@$%=+-~*<>[]{}/\\^!&?░▒▓█▀▄▌▐▖▗▘▙▚▛▜▝▞▟■▲△♢♡♤♧♣♤ SELECT >';

interface UseScrambleTextOptions {
  totalDuration?: number; // Total number of iteration frames (default: 25)
  intervalMs?: number;    // Milliseconds between ticks (default: 30ms)
  autoTriggerOnMount?: boolean;
}

export function useScrambleText(
  originalText: string,
  options: UseScrambleTextOptions = {}
) {
  const { totalDuration = 25, intervalMs = 30, autoTriggerOnMount = false } = options;
  const reducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState<string>(originalText);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerScramble = useCallback(() => {
    if (reducedMotion) {
      setDisplayText(originalText);
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    let iteration = 0;
    const len = originalText.length;

    timerRef.current = setInterval(() => {
      const scrambled = originalText
        .split('')
        .map((char, index) => {
          if (char === ' ' || char === '/' || char === '.' || char === ':') {
            return char;
          }
          if (index < (iteration / totalDuration) * len) {
            return originalText[index];
          }
          return CYBER_GLYPHS[Math.floor(Math.random() * CYBER_GLYPHS.length)];
        })
        .join('');

      setDisplayText(scrambled);
      iteration++;

      if (iteration >= totalDuration) {
        setDisplayText(originalText);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, intervalMs);
  }, [originalText, totalDuration, intervalMs, reducedMotion]);

  useEffect(() => {
    if (autoTriggerOnMount) {
      const timeout = setTimeout(triggerScramble, 400);
      return () => clearTimeout(timeout);
    }
  }, [autoTriggerOnMount, triggerScramble]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    displayText,
    triggerScramble,
  };
}
