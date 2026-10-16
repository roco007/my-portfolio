import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { PROJECTS, Project, ProjectCategory } from '../data/portfolio';
import { ProjectCard } from './ProjectCard';
import styles from './HorizontalProjectsDeck.module.css';

interface HorizontalProjectsDeckProps {
  onRotate?: (angle: number, activeIndex: number, activeTitle: string) => void;
}

export const HorizontalProjectsDeck: React.FC<HorizontalProjectsDeckProps> = ({
  onRotate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftStartRef = useRef<number>(0);

  // Filter projects by category
  const filteredProjects: Project[] = selectedCategory === 'all'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === selectedCategory);

  // Compute rotation & active project whenever scroll happens
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;

    // Calculate rotation angle: 2 full revolutions across the entire horizontal reel
    const angle = ratio * 720;

    // Estimate current active card
    const cardSlotWidth = 370; // 350px card + 20px gap
    const index = Math.min(
      Math.max(Math.round(el.scrollLeft / cardSlotWidth), 0),
      filteredProjects.length - 1
    );

    setActiveCardIndex(index);
    const activeProject = filteredProjects[index] || filteredProjects[0];
    onRotate?.(angle, index, activeProject.title);
  }, [filteredProjects, onRotate]);

  // Convert vertical mouse wheel into horizontal scroll when hovering over deck
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If predominantly vertical scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2 && e.deltaY > 0;

        // If not at hard boundary, intercept and scroll horizontally
        if (!atStart && !atEnd) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 0.95;
          handleScroll();
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleScroll]);

  // Initial report of rotation on mount or category change
  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftStartRef.current = trackRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // scroll sensitivity
    trackRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    handleScroll();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Step scroll buttons
  const scrollStep = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const shift = 370; // 1 card
    trackRef.current.scrollBy({
      left: direction === 'left' ? -shift : shift,
      behavior: 'smooth',
    });
  };

  // Jump to specific card dot
  const scrollToCard = (idx: number) => {
    if (!trackRef.current) return;
    trackRef.current.scrollTo({
      left: idx * 370,
      behavior: 'smooth',
    });
  };

  // Category counts
  const countAll = PROJECTS.length;
  const countAi = PROJECTS.filter((p) => p.category === 'ai').length;
  const countUtil = PROJECTS.filter((p) => p.category === 'utility').length;
  const countInteract = PROJECTS.filter((p) => p.category === 'interactive').length;

  return (
    <div className={styles.deckWrapper} aria-label="Horizontal Project Deck">
      {/* Controls Bar: Category Filters & Nav Arrows */}
      <div className={styles.controlsBar}>
        <div className={styles.filterGroup}>
          <button
            type="button"
            className={`${styles.filterBtn} ${selectedCategory === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <span>ALL</span>
            <span className={styles.filterCount}>({countAll})</span>
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${selectedCategory === 'ai' ? styles.filterBtnActive : ''}`}
            onClick={() => setSelectedCategory('ai')}
          >
            <span>AI &amp; AGENTS</span>
            <span className={styles.filterCount}>({countAi})</span>
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${selectedCategory === 'utility' ? styles.filterBtnActive : ''}`}
            onClick={() => setSelectedCategory('utility')}
          >
            <span>DEV UTILITIES</span>
            <span className={styles.filterCount}>({countUtil})</span>
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${selectedCategory === 'interactive' ? styles.filterBtnActive : ''}`}
            onClick={() => setSelectedCategory('interactive')}
          >
            <span>3D &amp; INTERACTIVE</span>
            <span className={styles.filterCount}>({countInteract})</span>
          </button>
        </div>

        <div className={styles.navHintGroup}>
          <div className={styles.scrollHintPill}>
            <span>SCROLL HORIZONTALLY TO ROTATE DISC</span>
            <span className={styles.arrowIcon}>
              <ArrowRight size={12} />
            </span>
          </div>

          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => scrollStep('left')}
            disabled={activeCardIndex === 0}
            title="Previous project"
            aria-label="Previous project"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => scrollStep('right')}
            disabled={activeCardIndex >= filteredProjects.length - 1}
            title="Next project"
            aria-label="Next project"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track containing all project cards */}
      <div
        ref={trackRef}
        className={styles.trackContainer}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        tabIndex={0}
        role="region"
        aria-label="Scrollable horizontal projects carousel"
      >
        {filteredProjects.map((project) => (
          <div key={project.id} className={styles.cardSlot}>
            <ProjectCard project={project} />
          </div>
        ))}
      </div>

      {/* Bottom Progress Scrubber & Pips */}
      <div className={styles.scrubberBar}>
        <div className={styles.dotsRail}>
          {filteredProjects.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`${styles.dotPip} ${idx === activeCardIndex ? styles.dotPipActive : ''}`}
              onClick={() => scrollToCard(idx)}
              title={`Jump to project ${idx + 1}`}
              aria-label={`Jump to project ${idx + 1}`}
            />
          ))}
        </div>

        <div className={styles.counterTag}>
          <span className={styles.counterHighlight}>
            {String(activeCardIndex + 1).padStart(2, '0')}
          </span>{' '}
          / {String(filteredProjects.length).padStart(2, '0')} UNITS
        </div>
      </div>
    </div>
  );
};
