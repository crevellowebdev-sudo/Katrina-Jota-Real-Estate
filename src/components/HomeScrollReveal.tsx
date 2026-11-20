import { useRef, type ReactNode } from 'react';
import { useScroll, useSpring, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useHeroReducedMotion } from './scroll-expansion-hero';

// Each layer follows its own viewport position, so reveals reverse naturally.
export default function HomeScrollReveal({ children, className = '', distance = 28 }: {
  children: ReactNode; className?: string; distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useHeroReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, mass: .3 });
  const opacity = useTransform(progress, [0, .14, .86, 1], [0, 1, 1, 0]);
  const y = useTransform(progress, [0, 1], [distance, -distance]);

  return <motion.div ref={ref} className={`home-scroll-reveal ${className}`}
    style={reduced ? { opacity: 1, y: 0 } : { opacity, y }}>
    {children}
  </motion.div>;
}
