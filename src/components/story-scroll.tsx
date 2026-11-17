import { Children, useRef, type CSSProperties, type ReactNode } from 'react';
import * as motion from 'motion/react-m';
import { useReducedMotion, useScroll, useTransform } from 'motion/react';

// Adapted from the supplied story-scroll.tsx: stacked panels rotating from the
// bottom-left corner, driven by native scrolling instead of GSAP pin spacers.
export function FlowSection({ children, className = '', style, index = 0, 'aria-label': label }: {
  children: ReactNode; className?: string; style?: CSSProperties; index?: number; 'aria-label'?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 25%'] });
  const rotate = useTransform(scrollYProgress, [0, 1], [30, 0]);
  return <section ref={ref} data-flow-section aria-label={label} className={`story-flow-section ${className}`} style={{ zIndex: index + 1 }}>
    <motion.div data-flow-inner className="flow-art-container" style={{ ...style, transformOrigin: 'bottom left', rotate: reduced || index === 0 ? 0 : rotate }}>
      {children}
    </motion.div>
  </section>;
}

export default function FlowArt({ children, className = '', 'aria-label': label = 'Story scroll' }: {
  children: ReactNode; className?: string; 'aria-label'?: string;
}) {
  return <div className={`story-flow ${className}`} data-story-scroll data-panel-count={Children.count(children)} aria-label={label}>
    {children}
  </div>;
}
