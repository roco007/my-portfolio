import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '../animations/useReducedMotion';
import { GREETING_REPLY, matchAnswer, PREDEFINED_QUESTIONS } from '../data/chatbotKnowledge';
import styles from './AiAvatarChat.module.css';

/**
 * Chat window for the floating AI avatar. A small offline rule-based bot:
 * predefined question chips + free text, matched against the portfolio
 * knowledge base (src/data/chatbotKnowledge.ts). Unrecognized questions get
 * an explicit ERR::404 "didn't understand" reply — no bluffing.
 */

interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  text: string;
}

/** Pause before the bot "types" its reply. */
const REPLY_DELAY_MS = 650;

/** URL-ish tokens turned into anchors: http(s), mailto:, and the resume PDF path. */
const LINK_SPLIT_RE = /(https?:\/\/[^\s]+|mailto:[^\s]+|\/[^\s]*\.pdf)/g;

const renderText = (text: string): ReactNode[] =>
  text.split(LINK_SPLIT_RE).map((part, i) => {
    if (i % 2 === 1) {
      return (
        <a
          key={i}
          className={styles.link}
          href={part}
          target={part.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
        >
          {part}
        </a>
      );
    }
    return part;
  });

export const AiAvatarChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const prefersReducedMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'bot', text: GREETING_REPLY },
  ]);
  const [typing, setTyping] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextIdRef = useRef<number>(1);

  // Focus the input so visitors can type straight away.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Esc closes the window (mirrors the × button).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Never leak a pending reply timer.
  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  // Keep the newest messages in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { id: nextIdRef.current++, role: 'user', text }]);
    setDraft('');
    setTyping(true);
    const { reply } = matchAnswer(text);
    timerRef.current = window.setTimeout(
      () => {
        setMessages((m) => [...m, { id: nextIdRef.current++, role: 'bot', text: reply }]);
        setTyping(false);
      },
      prefersReducedMotion ? 300 : REPLY_DELAY_MS,
    );
  };

  return (
    <div
      className={styles.window}
      id="raj-ai-chat"
      role="dialog"
      aria-label="Chat with Raj's AI portfolio assistant"
    >
      <header className={styles.header}>
        <span className={styles.statusDot} aria-hidden="true" />
        <span className={styles.title}>RAJ.AI // PORTFOLIO AGENT</span>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close chat window"
        >
          ✕
        </button>
      </header>

      <div className={styles.messages} ref={listRef} role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? styles.msgUser : styles.msgBot}>
            {m.role === 'bot' && (
              <span className={styles.msgTag} aria-hidden="true">
                RAJ.AI&gt;
              </span>
            )}
            <p className={styles.msgText}>{renderText(m.text)}</p>
          </div>
        ))}
        {typing && (
          <div className={styles.typing} aria-label="Raj.AI is typing">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </div>
        )}
      </div>

      <div className={styles.chips} role="group" aria-label="Predefined questions">
        {PREDEFINED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            className={styles.chip}
            onClick={() => send(q)}
            disabled={typing}
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className={styles.inputRow}
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <input
          ref={inputRef}
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask me about this portfolio…"
          aria-label="Type your question"
          maxLength={240}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={typing || !draft.trim()}
          aria-label="Send message"
        >
          ↵
        </button>
      </form>
    </div>
  );
};
