import { useEffect, useState } from 'react';


export default function OpeningScreen() {
  const [visible, setVisible] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  });

  useEffect(() => {
    if (!visible) return;
    const dismiss = () => setVisible(false);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => { if (media.matches) dismiss(); };
    // Fallback only: normal dismissal follows the CSS exit animation.
    const timer = window.setTimeout(dismiss, 2200);
    // Immediately uncover the page when the visitor starts interacting.
    window.addEventListener('keydown', dismiss, { once: true });
    window.addEventListener('pointerdown', dismiss, { once: true, passive: true });
    window.addEventListener('wheel', dismiss, { once: true, passive: true });
    media.addEventListener('change', onPreference);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('wheel', dismiss);
      media.removeEventListener('change', onPreference);
    };
  }, [visible]);

  if (!visible) return null;
  return <div className="opening-screen" aria-hidden="true" onAnimationEnd={event => {
    if (event.target === event.currentTarget && event.animationName === 'opening-curtain') setVisible(false);
  }}>
    <div className="opening-screen-brand">
      <img src="/images/logo-transparent.png" alt="Katrina Jota Real Estate logo" width={2142} height={734} fetchPriority="high" onError={() => setVisible(false)} />
      <span className="opening-screen-rule" />
    </div>
  </div>;
}
