import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 400);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  if (!visible) return null;
  return <button
    type="button"
    className="primary-button back-to-top"
    aria-label="Back to top"
    data-cursor-label="Let's head back to the top."
    onClick={() => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }}
  ><ArrowUp size={20} strokeWidth={1.5} aria-hidden="true" /></button>;
}
