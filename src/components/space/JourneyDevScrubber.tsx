import React, { useState, useEffect } from 'react';
import type { JourneyState } from './JourneyTimeline';
import { LOOP_SECONDS } from './JourneyTimeline';

interface JourneyDevScrubberProps {
  journeyState: JourneyState | null;
  onScrub: (progress: number | null) => void;
}

/**
 * Checkpoints sit at the midpoint of each journey section, expressed as a
 * 0..1 progress fraction of the 2-minute loop. Because the schedule is
 * authored on the canonical 3600 s mission clock and compressed
 * proportionally, the midpoints below are the same fractions of the loop as
 * they were of the original 60-minute voyage.
 */
const CHECKPOINTS = [
  { label: '4% Station', prog: 0.042, desc: 'Departure & Orbital Station' },
  { label: '12% Mercury', prog: 0.125, desc: 'Inner Planets' },
  { label: '21% Venus', prog: 0.208, desc: 'Sulfuric Atmosphere' },
  { label: '25% Earth', prog: 0.25, desc: 'Terra & Moon' },
  { label: '29% Mars', prog: 0.292, desc: 'Ares Corridor' },
  { label: '39% Jupiter', prog: 0.392, desc: 'Jovian Giant' },
  { label: '51% Saturn', prog: 0.508, desc: 'Chronos Rings' },
  { label: '60% Uranus', prog: 0.6, desc: 'Cyan Void' },
  { label: '67% Neptune', prog: 0.667, desc: 'Deep Azure' },
  { label: '74% Stars', prog: 0.742, desc: 'Known Star Systems' },
  { label: '82% Sun', prog: 0.825, desc: 'Solar Perihelion' },
  { label: '90% Nebula', prog: 0.9, desc: 'Carina & Asteroids' },
  { label: '96% Galaxy', prog: 0.958, desc: 'Spiral Galaxy' },
  { label: '99% Warp', prog: 0.992, desc: 'Hyperspace Jump' },
];

/** Formatted loop length, e.g. "02:00". */
const LOOP_CHRONO = `${String(Math.floor(LOOP_SECONDS / 60)).padStart(2, '0')}:${String(LOOP_SECONDS % 60).padStart(2, '0')}`;

export const JourneyDevScrubber: React.FC<JourneyDevScrubberProps> = ({
  journeyState,
  onScrub,
}) => {
  const isDev = Boolean(import.meta.env?.DEV);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisibleInProd, setIsVisibleInProd] = useState(false);
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    // Check initial search params
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.has('dev') || p.has('journey') || p.has('t') || localStorage.getItem('space-debug') === 'true') {
        setIsOpen(true);
        setIsVisibleInProd(true);
      }
    }

    // Keyboard shortcut Shift + J to toggle
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        setIsVisibleInProd(true);
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (journeyState && !isManual) {
      setSliderVal(journeyState.progress * 100);
    }
  }, [journeyState, isManual]);

  // Section 28: Hide or remove debug controls from production unless explicitly requested
  if (!isDev && !isVisibleInProd && !isOpen) {
    return null;
  }

  if (!isOpen) {
    return (<></>);
  }

  const currentSec = journeyState?.currentSection;
  const chrono = journeyState?.chronoString ?? '00:00';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '92%',
        maxWidth: '720px',
        background: 'rgba(8, 12, 20, 0.92)',
        border: '1px solid rgba(100, 200, 255, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 200, 255, 0.15)',
        borderRadius: '8px',
        padding: '14px 18px',
        fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
        color: '#e2e8f0',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00cec9', fontWeight: 'bold', fontSize: '13px' }}>
            🛰️ DEEP SPACE 2-MIN FLIGHT SCRUBBER
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: isManual ? 'rgba(255, 177, 66, 0.2)' : 'rgba(46, 204, 113, 0.2)',
              color: isManual ? '#ffb142' : '#2ecc71',
              border: `1px solid ${isManual ? '#ffb142' : '#2ecc71'}`,
            }}
          >
            {isManual ? 'MANUAL TIME OVERRIDE' : 'REALTIME AUTOPILOT'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isManual && (
            <button
              type="button"
              onClick={() => {
                setIsManual(false);
                onScrub(null);
              }}
              style={{
                background: 'rgba(46, 204, 113, 0.2)',
                border: '1px solid #2ecc71',
                color: '#2ecc71',
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ▶ Resume Realtime
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
            }}
            title="Close scrubber"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Telemetry info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '11px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>MISSION CHRONO: </span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{chrono} / {LOOP_CHRONO}</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>PROGRESS: </span>
          <span style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{((journeyState?.progress ?? 0) * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>VELOCITY: </span>
          <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{journeyState?.velocity ?? '0.42c'}</span>
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <span style={{ color: '#64748b' }}>SECTOR: </span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            {currentSec?.name} ({currentSec?.sectorCode})
          </span>
        </div>
      </div>

      {/* Main slider */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="range"
          min="0"
          max="100"
          step="0.05"
          value={sliderVal}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setSliderVal(val);
            setIsManual(true);
            onScrub(val / 100);
          }}
          style={{
            width: '100%',
            accentColor: '#38bdf8',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Quick Jump Buttons (Section 28 Requirements: 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 99%) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {CHECKPOINTS.map((cp) => (
          <button
            key={cp.label}
            type="button"
            onClick={() => {
              setSliderVal(cp.prog * 100);
              setIsManual(true);
              onScrub(cp.prog);
            }}
            title={cp.desc}
            style={{
              flex: '1 0 calc(16.6% - 4px)',
              minWidth: '70px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(100, 200, 255, 0.25)',
              color: '#93c5fd',
              fontSize: '10px',
              padding: '4px 2px',
              borderRadius: '3px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {cp.label}
          </button>
        ))}
      </div>
    </div>
  );
};
