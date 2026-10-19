import React from 'react';
import { useScrambleText } from '../animations/useScrambleText';

interface ScrambleTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  as?: React.ElementType;
  totalDuration?: number;
  intervalMs?: number;
  autoTriggerOnMount?: boolean;
  className?: string;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  as: Component = 'span',
  totalDuration = 25,
  intervalMs = 30,
  autoTriggerOnMount = false,
  className,
  onMouseEnter,
  ...rest
}) => {
  const { displayText, triggerScramble } = useScrambleText(text, {
    totalDuration,
    intervalMs,
    autoTriggerOnMount,
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    triggerScramble();
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  return (
    <Component
      className={className}
      onMouseEnter={handleMouseEnter}
      data-original={text}
      style={{ cursor: 'pointer', ...rest.style }}
      {...rest}
    >
      {displayText}
    </Component>
  );
};
