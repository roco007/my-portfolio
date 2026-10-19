import { useEffect, useState } from 'react';
import { useReducedMotion } from '../animations/useReducedMotion';
import { AiAvatarChat } from './AiAvatarChat';
import styles from './AiAvatar.module.css';

/**
 * Where the real portrait lives (relative path — the site deploys with
 * base './' on GitHub Pages). Drop the animated image (PNG/WebP/GIF) at
 *   public/easter-egg/ai-avatar.png
 * and it is used automatically. Until then the stylized SVG placeholder
 * renders, so the Easter egg is never a broken image.
 */
const AVATAR_SOURCES = ['easter-egg/ai-avatar.png', 'easter-egg/ai-avatar.svg'];

/**
 * The "reveal" face shown after the hover flip. Drop the real AI-generated
 * portrait at
 *   public/easter-egg/ai-avatar-on-hover.png
 * and it replaces the fallback automatically.
 */
const HOVER_SOURCES = ['easter-egg/ai-avatar-on-hover.png', 'easter-egg/ai-avatar-on-hover.svg'];

/** Delay before the companion pops in after the intro finishes (ms). */
const ENTRANCE_DELAY_MS = 1100;

interface AiAvatarProps {
  /** Driven by App once the intro overlay clears; also replays on intro replay. */
  visible: boolean;
}

/**
 * Floating "AI version of me" companion — bottom-right corner, above the CLI
 * trigger. Greets with a speech bubble, bobs gently, flips horizontally on
 * hover to reveal an alternate AI portrait, and opens a chat window on click
 * where visitors can ask about the portfolio.
 */
export const AiAvatar: React.FC<AiAvatarProps> = ({ visible }) => {
  const prefersReducedMotion = useReducedMotion();
  const [entered, setEntered] = useState<boolean>(false);
  const [srcIndex, setSrcIndex] = useState<number>(0);
  const [hoverSrcIndex, setHoverSrcIndex] = useState<number>(0);
  const [hoverFaceReady, setHoverFaceReady] = useState<boolean>(false);
  const [nodding, setNodding] = useState<boolean>(false);
  const [bubbleKey, setBubbleKey] = useState<number>(0);
  const [chatOpen, setChatOpen] = useState<boolean>(false);

  // Entrance: wait for the intro to clear, then a short beat before popping in.
  useEffect(() => {
    if (!visible) {
      setEntered(false);
      setChatOpen(false); // replaying the intro also resets the companion
      return;
    }
    if (prefersReducedMotion) {
      setEntered(true);
      return;
    }
    const timer = window.setTimeout(() => setEntered(true), ENTRANCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [visible, prefersReducedMotion]);

  const handleImageError = () => {
    setSrcIndex((i) => (i + 1 < AVATAR_SOURCES.length ? i + 1 : i));
  };

  const handleHoverImageError = () => {
    // Walk the fallback chain; if exhausted, keep the last source (SVG always exists).
    setHoverSrcIndex((i) => (i + 1 < HOVER_SOURCES.length ? i + 1 : i));
  };

  const handleAvatarClick = () => {
    // Toggle the chat window; nod + replay the bubble pop for a little life.
    setChatOpen((open) => !open);
    setNodding(false);
    setBubbleKey((k) => k + 1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNodding(true));
    });
  };

  const show = visible && entered;

  return (
    <div className={styles.dock} data-visible={show || undefined} aria-hidden={!show || undefined}>
      <div className={styles.floatWrap}>
        {!chatOpen && (
          <div className={styles.bubble} key={bubbleKey} role="note">
            <span className={styles.bubbleDot} aria-hidden="true" />
            <p className={styles.bubbleText}>Guess the AI(Artistic Intelligence) that created me….</p>
            <span className={styles.tail} aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          className={styles.avatarBtn}
          data-flip={hoverFaceReady || undefined}
          data-nod={nodding || undefined}
          onClick={handleAvatarClick}
          aria-label={
            chatOpen ? 'Close chat with Raj’s AI portfolio assistant' : 'Open chat with Raj’s AI portfolio assistant'
          }
          aria-expanded={chatOpen}
          aria-controls={chatOpen ? 'raj-ai-chat' : undefined}
          onAnimationEnd={() => setNodding(false)}
        >
          <span className={styles.flipper}>
            <span className={styles.faceFront}>
              <img
                className={styles.avatar}
                src={AVATAR_SOURCES[srcIndex]}
                alt="AI-generated winking avatar of Raj Colaco"
                width={128}
                height={128}
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={handleImageError}
              />
            </span>
            <span className={styles.faceBack} aria-hidden="true">
              <img
                className={styles.avatar}
                src={HOVER_SOURCES[hoverSrcIndex]}
                alt=""
                width={128}
                height={128}
                loading="lazy"
                decoding="async"
                draggable={false}
                onLoad={() => setHoverFaceReady(true)}
                onError={handleHoverImageError}
              />
            </span>
          </span>
        </button>
      </div>

      {chatOpen && show && <AiAvatarChat onClose={() => setChatOpen(false)} />}
    </div>
  );
};
