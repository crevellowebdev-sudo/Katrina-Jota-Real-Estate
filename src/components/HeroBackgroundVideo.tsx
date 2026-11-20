import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const mobileQuery = '(max-width: 900px)';
const reducedQuery = '(prefers-reduced-motion: reduce)';
function subscribe(callback: () => void) {
  const queries = [mobileQuery, reducedQuery].map(query => window.matchMedia(query));
  queries.forEach(query => query.addEventListener('change', callback));
  return () => queries.forEach(query => query.removeEventListener('change', callback));
}
function getVideoSource() {
  if (window.matchMedia(reducedQuery).matches) return null;
  return window.matchMedia(mobileQuery).matches ? '/images/herovidmobile.mp4' : '/images/herovid.mp4';
}

export default function HeroBackgroundVideo() {
  const source = useSyncExternalStore(subscribe, getVideoSource, () => null);
  return source ? <HeroVideoSource key={source} source={source} /> : null;
}

function HeroVideoSource({ source }: { source: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    let active = true;
    let inView = true;
    const updatePlayback = () => {
      if (!inView || document.hidden) { video.pause(); return; }
      void video.play().catch((error: unknown) => {
        // A pause or unmount can interrupt a pending play request.
        if (active && !(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(video);
    document.addEventListener('visibilitychange', updatePlayback);
    updatePlayback();
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
      video.pause();
    };
  }, [source, failed]);

  if (failed) return null;
  return <div className={`home-hero-video-layer${ready ? ' is-ready' : ''}`} aria-hidden="true">
      <video ref={videoRef} src={source} poster="/images/editorial-home.jpg"
        autoPlay muted loop playsInline preload="metadata" tabIndex={-1}
        onPlaying={() => setReady(true)} onError={() => setFailed(true)} />
  </div>;
}
