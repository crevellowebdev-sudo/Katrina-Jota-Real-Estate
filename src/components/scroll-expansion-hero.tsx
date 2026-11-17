import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import * as motion from 'motion/react-m';
import { useScroll, useTransform } from 'motion/react';
import { Pause, Play } from 'lucide-react';

const reducedQuery = '(prefers-reduced-motion: reduce)';
const compactQuery = '(max-width: 900px), (max-height: 600px)';
function subscribeCompact(callback: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
export function useHeroCompactLayout() {
  return useSyncExternalStore(subscribeCompact, () => window.matchMedia(compactQuery).matches, () => true);
}
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
  const [paused, setPaused] = useState(false);
  const compact = useHeroCompactLayout();
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] });
  const inset = useTransform(scrollYProgress, [0, .85], compact
    ? ['65% 16% 10% 16%', '0% 0% 0% 0%']
    : ['35% 38% 35% 38%', '0% 0% 0% 0%']);
  useEffect(() => {
    const el = video.current;
    if (!el || reduced || failed) return;
    // Pause playback while the hero is offscreen.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || paused) el.pause();
      else void el.play().catch(() => { /* The poster remains if autoplay is unavailable. */ });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, failed, paused]);
  if (reduced || failed) return null;
  return <div className={compact ? 'home-inline-video' : 'home-centered-video'}>
    <motion.div className="home-expansion-video" style={compact ? undefined : { inset }}>
      <video ref={video} src="/images/home-interior.mp4" poster="/images/home-interior-poster.jpg" width={1920} height={1080} autoPlay muted loop playsInline preload="metadata" aria-label="Illustrative interior walkthrough of a home" aria-describedby="home-video-description" onError={() => setFailed(true)}>
        Illustrative interior walkthrough of a home. This video is used for atmosphere and is not a property listing.
      </video>
      <button type="button" className="home-video-control" aria-label={paused ? 'Play home interior video' : 'Pause home interior video'} onClick={() => {
        const next = !paused;
        setPaused(next);
        if (next) video.current?.pause();
        else void video.current?.play().catch(() => {});
      }}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}<span>{paused ? 'Play video' : 'Pause video'}</span></button>
    </motion.div>
    <p id="home-video-description" className="sr-only">Muted footage moves through a residential interior with an open kitchen and dining area. The rooms are illustrative and are not advertised as a property for sale.</p>
  </div>;
}
