import React, { useState, useEffect, useRef } from 'react';
import { Mail, Copy, Check, ExternalLink, Send, MessageSquare, Terminal } from 'lucide-react';
import { PERSONAL_INFO, SOCIAL_LINKS } from '../data/portfolio';
import { SectionHeading } from '../components/SectionHeading';
import { Button } from '../components/Button';
import { setupScrollReveal } from '../animations/scroll';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './Contact.module.css';

interface ContactProps {
  onOpenTerminal: () => void;
}

export const Contact: React.FC<ContactProps> = ({ onOpenTerminal }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState<boolean>(false);

  // Direct message composer state (constructs a mailto link with verified subject and body)
  const [subject, setSubject] = useState<string>('Project Collaboration / Engineering Opportunity');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const cleanup = setupScrollReveal(sectionRef.current, {
      threshold: 0.1,
      reducedMotion,
    });
    return () => cleanup();
  }, [reducedMotion]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PERSONAL_INFO.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const mailtoUrl = `mailto:${PERSONAL_INFO.email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(message)}`;

  return (
    <section id="contact" ref={sectionRef} className="section-wrapper" aria-labelledby="contact-title">
      <div className="container">
        <SectionHeading
          number="06"
          tag="COMMUNICATION UPLINK"
          title="INITIALIZE DIRECT COMMUNICATION & COLLABORATION"
          highlightWord="COMMUNICATION"
          subtitle="Interested in building frontier AI architectures, multi-agent evaluation suites, or high-performance web systems? Establish an uplink."
        />

        <div className={styles.grid}>
          {/* Left Column: Quick Connect Card */}
          <div className={`glass-panel ${styles.uplinkCard}`} data-reveal>
            <div className={styles.cardHeader}>
              <div className={styles.beaconStatus}>
                <span className={styles.beaconDot} />
                <span className={styles.beaconText}>SYS.UPLINK // READY</span>
              </div>
              <span className={styles.encryptionBadge}>DIRECT CHANNEL</span>
            </div>

            <div className={styles.mainCtaBox}>
              <h3 className={styles.ctaTitle}>Let's build something extraordinary together.</h3>
              <p className={styles.ctaText}>
                Whether you have an ambitious AI project, need a technical advisor for agentic workflows, or want to discuss engineering opportunities, my inbox is open.
              </p>

              {/* Email Address with Copy Button */}
              <div className={styles.emailPill}>
                <Mail size={16} className={styles.mailIcon} />
                <span className={styles.emailText}>{PERSONAL_INFO.email}</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={copyEmail}
                  title="Copy email to clipboard"
                  aria-label="Copy email address"
                >
                  {copied ? (
                    <>
                      <Check size={14} className={styles.checkIcon} />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <Button
                  variant="primary"
                  size="md"
                  href={mailtoUrl}
                  icon={<Send size={15} />}
                >
                  TRANSMIT EMAIL
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={onOpenTerminal}
                  icon={<Terminal size={15} />}
                >
                  INTERACTIVE CLI
                </Button>
              </div>
            </div>

            {/* Verified Social Networks Grid */}
            <div className={styles.socialGrid}>
              {SOCIAL_LINKS.filter((s) => s.platform !== 'email').map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialCard}
                  aria-label={`Open ${link.name} profile in new tab`}
                >
                  <div className={styles.socialInfo}>
                    <span className={styles.socialName}>{link.name}</span>
                    <span className={styles.socialHandle}>{link.handle}</span>
                  </div>
                  <ExternalLink size={14} className={styles.socialArrow} />
                </a>
              ))}
            </div>
          </div>

          {/* Right Column: Direct Pre-formatted Message Composer */}
          <div className={`glass-panel ${styles.composerCard}`} data-reveal>
            <div className={styles.composerHeader}>
              <MessageSquare size={16} className={styles.composerIcon} />
              <span className={styles.composerTitle}>PRE-FORMAT TRANSMISSION</span>
            </div>

            <p className={styles.composerDesc}>
              Draft your note below. Clicking Transmit opens your native email client with all fields pre-populated directly to {PERSONAL_INFO.email}.
            </p>

            <form
              className={styles.composerForm}
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = mailtoUrl;
              }}
            >
              <div className={styles.fieldGroup}>
                <label htmlFor="contact-subject" className={styles.fieldLabel}>
                  TRANSMISSION SUBJECT
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  className={styles.fieldInput}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject..."
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="contact-message" className={styles.fieldLabel}>
                  MESSAGE PAYLOAD
                </label>
                <textarea
                  id="contact-message"
                  className={styles.fieldTextarea}
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your project, timeline, or idea..."
                  required
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                icon={<Send size={15} />}
                className={styles.submitBtn}
              >
                OPEN EMAIL CLIENT WITH MESSAGE
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
