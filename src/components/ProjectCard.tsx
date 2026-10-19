import React, { useRef, useState } from 'react';
import { ExternalLink, Github, ChevronDown, ChevronUp, Layers, CheckCircle2 } from 'lucide-react';
import { Project } from '../data/portfolio';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <article
      ref={cardRef}
      className={`glass-panel project-card ${styles.card}`}
      data-reveal
      data-category={project.category}
    >
      {/* Specular Glare Overlay */}
      <div className={styles.cardGlare} aria-hidden="true" />

      {/* Media Preview Container - Clickable with Pop-out on Hover */}
      {project.liveUrl || project.githubUrl ? (
        <a
          href={project.liveUrl || project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.imageLink}
          aria-label={`Open ${project.liveUrl ? 'live demo' : 'source code'} for ${project.title}`}
          title={`Click to open ${project.liveUrl ? 'live demo' : 'source code'}`}
        >
          <div className={styles.imageContainer}>
            <img
              src={project.image}
              alt={`${project.title} Preview Screenshot`}
              className={styles.image}
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>
      ) : (
        <div className={styles.imageContainer}>
          <img
            src={project.image}
            alt={`${project.title} Preview Screenshot`}
            className={styles.image}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* Card Content Header & Meta */}
      <div className={styles.content}>
        <div className={styles.headerMeta}>
          <div className={styles.tagsWrapper}>
            <span className={`${styles.categoryBadge} ${styles[project.category]}`}>
              {project.categoryLabel}
            </span>
          </div>
          <span className={styles.sysId}>{project.sysId}</span>
        </div>

        <h3 className={styles.title}>
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.titleLink}
            >
              {project.title}
            </a>
          ) : (
            <span>{project.title}</span>
          )}
        </h3>

        <p className={styles.description}>{project.description}</p>

        {/* Technology Pill Badges */}
        <div className={styles.techList}>
          {project.technologies.slice(0, 4).map((tech) => (
            <span key={tech} className={styles.techBadge}>
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className={styles.moreBadge}>
              +{project.technologies.length - 4}
            </span>
          )}
        </div>

        {/* Expandable Technical Deep-Dive Accordion */}
        {expanded && (
          <div className={styles.expandedDetails}>
            <div className={styles.problemBox}>
              <span className={styles.detailLabel}>
                <Layers size={13} /> PROBLEM ADDRESSED
              </span>
              <p className={styles.problemText}>{project.problemSolved}</p>
            </div>

            <div className={styles.featuresBox}>
              <span className={styles.detailLabel}>KEY CAPABILITIES</span>
              <ul className={styles.featuresList}>
                {project.keyFeatures.map((feat, idx) => (
                  <li key={idx} className={styles.featureItem}>
                    <CheckCircle2 size={13} className={styles.checkIcon} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Card Footer Actions */}
        <div className={styles.actions}>
          <div className={styles.externalLinks}>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionBtnPrimary}
                aria-label={`View live demo of ${project.title}`}
              >
                <span>Live Demo</span>
                <ExternalLink size={14} />
              </a>
            )}

            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtnSecondary}
              aria-label={`View source code of ${project.title} on GitHub`}
            >
              <Github size={14} />
              <span>Source</span>
            </a>
          </div>

          <button
            type="button"
            className={styles.expandToggleBtn}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            title={expanded ? 'Collapse project details' : 'Expand project details'}
          >
            <span>{expanded ? 'Less' : 'Specs'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
};
