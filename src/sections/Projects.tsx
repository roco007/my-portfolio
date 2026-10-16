import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { PROJECTS, ProjectCategory } from '../data/portfolio';
import { SectionHeading } from '../components/SectionHeading';
import { ProjectCard } from '../components/ProjectCard';
import { setupScrollReveal } from '../animations/scroll';
import { animateFilterTransition } from '../animations/interactions';
import { useReducedMotion } from '../animations/useReducedMotion';
import styles from './Projects.module.css';

export const Projects: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const cleanup = setupScrollReveal(sectionRef.current, {
      threshold: 0.08,
      reducedMotion,
    });
    return () => cleanup();
  }, [reducedMotion]);

  const handleCategoryChange = (category: ProjectCategory) => {
    setActiveCategory(category);
    if (!reducedMotion) {
      animateFilterTransition(gridRef.current);
    }
  };

  // Filter projects by category and query
  const filteredProjects = PROJECTS.filter((project) => {
    const matchesCategory =
      activeCategory === 'all' || project.category === activeCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.technologies.some((t) => t.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  const categories: { id: ProjectCategory; label: string; count: number }[] = [
    { id: 'all', label: 'ALL UNITS', count: PROJECTS.length },
    {
      id: 'ai',
      label: 'AI & MULTI-AGENT',
      count: PROJECTS.filter((p) => p.category === 'ai').length,
    },
    {
      id: 'utility',
      label: 'DEV UTILITIES',
      count: PROJECTS.filter((p) => p.category === 'utility').length,
    },
    {
      id: 'interactive',
      label: '3D & INTERACTIVE',
      count: PROJECTS.filter((p) => p.category === 'interactive').length,
    },
  ];

  return (
    <section id="projects" ref={sectionRef} className="section-wrapper" aria-labelledby="projects-title">
      <div className="container">
        <SectionHeading
          number="04"
          tag="PROJECT ARCHIVE"
          title="PRODUCTION SYSTEMS & OPEN SOURCE ENGINES"
          highlightWord="ENGINES"
          subtitle="Explore 14 live production units spanning multi-agent AI judges, automated documentation pipelines, AST converters, and 3D celestial simulations."
        />

        {/* Filters and Search Bar HUD */}
        <div className={styles.controlsBar} data-reveal>
          <div className={styles.categoryFilters} role="group" aria-label="Filter projects by domain">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.filterBtn} ${isActive ? styles.active : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                  aria-pressed={isActive}
                >
                  <span className={styles.filterDot} />
                  <span>{cat.label}</span>
                  <span className={styles.countBadge}>({cat.count})</span>
                </button>
              );
            })}
          </div>

          <div className={styles.searchWrapper}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Filter by tech or keyword (e.g. Gemini, AST)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter projects by technology or keyword"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div ref={gridRef} className={styles.projectsGrid}>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {filteredProjects.length === 0 && (
            <div className={`glass-panel ${styles.emptyState}`}>
              <p className={styles.emptyTitle}>NO MATCHING SYSTEMS LOCATED</p>
              <p className={styles.emptyDesc}>
                No projects matched your search criteria "{searchQuery}". Try searching for another keyword or switch category.
              </p>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
