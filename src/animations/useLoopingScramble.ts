import { useState, useRef, useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

const CYBER_GLYPHS = '0101_#@$%=+-~*<>[]{}/\\^!&?░▒▓█▀▄▌▐▖▗▘▙▚▛▜▝▞▟■▲△♢♡♤♧♣♤ SELECT >';

interface UseLoopingScrambleOptions {
  totalFrames?: number;
  intervalMs?: number;
  pauseMs?: number;
}

export function useLoopingScramble(
  originalText: string,
  options: UseLoopingScrambleOptions = {}
): string {
  const { totalFrames = 20, intervalMs = 30, pauseMs = 800 } = options;
  const reducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState<string>(originalText);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayText(originalText);
      return;
    }

    const len = originalText.length;

    const runCycle = () => {
      let iteration = 0;

      intervalRef.current = setInterval(() => {
        const scrambled = originalText
          .split('')
          .map((char, index) => {
            if (char === ' ' || char === '/' || char === '.' || char === ':') {
              return char;
            }
            if (index < (iteration / totalFrames) * len) {
              return originalText[index];
            }
            return CYBER_GLYPHS[Math.floor(Math.random() * CYBER_GLYPHS.length)];
          })
          .join('');

        setDisplayText(scrambled);
        iteration++;

        if (iteration >= totalFrames) {
          setDisplayText(originalText);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          timeoutRef.current = setTimeout(runCycle, pauseMs);
        }
      }, intervalMs);
    };

    timeoutRef.current = setTimeout(runCycle, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [originalText, totalFrames, intervalMs, pauseMs, reducedMotion]);

  return displayText;
}
