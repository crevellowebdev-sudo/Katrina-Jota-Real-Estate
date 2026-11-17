import { useRef } from 'react';
import * as motion from 'motion/react-m';
import { useReducedMotion, useScroll, useTransform } from 'motion/react';
import type { ProcessStep } from '../data/site';

// Adapted from the supplied timeline.tsx: scroll-drawn connectors, growing
// markers and rising text, preserving a sequential, accessible vertical list.
function TimelineStep({ step, index }: { step: ProcessStep; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'start 45%'] });
  const scale = useTransform(scrollYProgress, [0, .6], [.6, 1]);
  const branch = useTransform(scrollYProgress, [0, .65], [0, 1]);
  const y = useTransform(scrollYProgress, [.1, 1], [28, 0]);
  const x = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const opacity = useTransform(scrollYProgress, [.1, .8], [.9, 1]);
  return <li ref={ref} className="buying-timeline-step">
    <motion.span className="buying-timeline-node" aria-hidden="true" style={reduced ? undefined : { scale }}>{String(index + 1).padStart(2, '0')}</motion.span>
    <motion.span className="buying-timeline-branch" aria-hidden="true" style={reduced ? undefined : { scaleX: branch }} />
    <motion.div className="buying-timeline-copy" style={reduced ? undefined : { x, y, opacity }}>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
    </motion.div>
  </li>;
}

export default function Timeline({ steps }: { steps: ProcessStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] });
  return <div ref={ref} className="buying-scroll-timeline" data-buying-timeline>
    <motion.span className="buying-timeline-progress" aria-hidden="true" style={{ scaleY: reduced ? 1 : scrollYProgress }} />
    <ol aria-label="The buying process steps">
      {steps.map((step, index) => <TimelineStep key={step.title} step={step} index={index} />)}
    </ol>
  </div>;
}

