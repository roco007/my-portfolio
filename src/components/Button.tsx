import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  target?: string;
  rel?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  target,
  rel,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}) => {
  const combinedClass = `${styles.btn} ${styles[variant]} ${styles[size]} ${className}`;

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
      {icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
    </>
  );

  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('mailto:');
    return (
      <a
        href={href}
        className={combinedClass}
        target={target || (isExternal ? '_blank' : undefined)}
        rel={rel || (isExternal ? 'noopener noreferrer' : undefined)}
      >
        {content}
      </a>
    );
  }

  return (
    <button className={combinedClass} {...props}>
      {content}
    </button>
  );
};
