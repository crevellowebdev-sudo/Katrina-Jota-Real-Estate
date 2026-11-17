import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import * as motion from 'motion/react-m';
import { useScroll, useTransform } from 'motion/react';

const reducedQuery = '(prefers-reduced-motion: reduce)';
function subscribeReduced(callback: () => void) {
  const query = window.matchMedia(reducedQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
export function useHeroReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(reducedQuery).matches, () => true);
}

export default function ScrollExpansionVideo({ target }: { target: RefObject<HTMLElement | null> }) {
  const reduced = useHeroReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] });
  const inset = useTransform(scrollYProgress, [0, .85], compact
    ? ['65% 16% 10% 16%', '0% 0% 0% 0%']
    : ['35% 38% 35% 38%', '0% 0% 0% 0%']);
  useEffect(() => {
    const el = video.current;
    if (!el || reduced || failed) return;
    // Pause playback while the hero is offscreen.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) el.pause();
      else void el.play().catch(() => { /* The poster remains if autoplay is unavailable. */ });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, failed]);
  if (reduced || failed) return null;
  return <div className="home-centered-video">
    <motion.div className="home-expansion-video" style={{ inset }}>
      <video ref={video} src="/images/herovid.mp4" poster="/images/hero.jpg" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" onError={() => setFailed(true)} />
    </motion.div>
  </div>;
}
