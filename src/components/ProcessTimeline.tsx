import { useRef } from 'react';
import * as motion from 'motion/react-m';
import { useReducedMotion, useScroll } from 'motion/react';
import type { ProcessStep } from '../data/site';
import { ScrollReveal } from './ui';

export default function ProcessTimeline({ steps, variant = 'selling' }: { steps: ProcessStep[]; variant?: 'selling' | 'buying' }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 75%'] });
  return <ol ref={ref} className={`process-timeline process-timeline--${variant}`}>
    {steps.map((step, index) => <li key={step.title}>
      {index === 0 && <motion.span className="timeline-progress" aria-hidden="true" style={{ scaleY: reduceMotion ? 1 : scrollYProgress }} />}
      <ScrollReveal className="process-step">
        <span className="process-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <div className="process-copy"><h3>{step.title}</h3><p>{step.description}</p></div>
      </ScrollReveal>
    </li>)}
  </ol>;
}
