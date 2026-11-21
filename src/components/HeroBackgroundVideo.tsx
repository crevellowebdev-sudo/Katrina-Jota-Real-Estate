import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const mobileQuery = '(max-width: 700px), (max-width: 900px) and (orientation: portrait)';
const reducedQuery = '(prefers-reduced-motion: reduce)';

type HeroMedia = { source: string; poster: string; still: boolean };

const desktopVideo: HeroMedia = { source: '/images/hero-loop.mp4', poster: '/images/hero-loop-poster.jpg', still: false };
const mobileVideo: HeroMedia = { source: '/images/hero-loop-mobile.mp4', poster: '/images/hero-loop-mobile-poster.jpg', still: false };
const desktopStill: HeroMedia = { ...desktopVideo, still: true };
const mobileStill: HeroMedia = { ...mobileVideo, still: true };

function subscribe(callback: () => void) {
  const queries = [mobileQuery, reducedQuery].map(query => window.matchMedia(query));
  queries.forEach(query => query.addEventListener('change', callback));
  return () => queries.forEach(query => query.removeEventListener('change', callback));
}

function getMedia(): HeroMedia {
  const mobile = window.matchMedia(mobileQuery).matches;
  if (window.matchMedia(reducedQuery).matches) return mobile ? mobileStill : desktopStill;
  return mobile ? mobileVideo : desktopVideo;
}

export default function HeroBackgroundVideo() {
  const media = useSyncExternalStore(subscribe, getMedia, () => null);
  return media ? <HeroVideoMedia key={media.source} media={media} /> : null;
}

function HeroVideoMedia({ media }: { media: HeroMedia }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (media.still) return;
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
  }, [failed, media.still, media.source]);

  if (media.still || failed) {
    return <div className="home-hero-video-layer is-ready" aria-hidden="true">
      <img src={media.poster} alt="" width={1920} height={1080} decoding="async" fetchPriority="high" />
    </div>;
  }

  return <div className={`home-hero-video-layer${ready ? ' is-ready' : ''}`} aria-hidden="true">
      <video ref={videoRef} src={media.source} poster={media.poster}
        autoPlay muted loop playsInline preload="auto" tabIndex={-1} disablePictureInPicture
        onPlaying={() => setReady(true)} onError={() => setFailed(true)} />
    </div>;
}
