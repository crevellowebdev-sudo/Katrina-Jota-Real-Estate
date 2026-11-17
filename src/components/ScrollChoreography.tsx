import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';

// Progressive enhancement: elements are visible before, during and after observation.
const targets = '[data-scroll-reveal], main h1, main h2, main .section-heading, main p, .about-portrait, .selling-image-frame, .editorial-image, .form-field, .form-actions, .footer-main > div, .footer-bottom, .asset-disclosure';

export default function ScrollChoreography() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !window.IntersectionObserver || !Element.prototype.animate) return;
    const observed = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (!entry.isIntersecting) {
          animations.get(element)?.cancel();
          animations.delete(element);
          continue;
        }
        // Never move a control while the visitor is interacting with it.
        if (element.matches(':focus-within')) continue;
        const fromAbove = entry.boundingClientRect.top < 0;
        const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
        const stagger = Math.min(Math.max(siblings.indexOf(element), 0), 3) * 35;
        const delay = Math.min(Number(element.dataset.revealDelay || 0) * 1000 + stagger, 180);
        animations.get(element)?.cancel();
        const animation = element.animate([
          { opacity: .65, transform: `translate3d(0, ${fromAbove ? -16 : 20}px, 0)` },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ], { duration: 720, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
        animations.set(element, animation);
        animation.onfinish = () => { animation.cancel(); animations.delete(element); };
      }
    }, { threshold: .08 });
    const scan = () => {
      // Lazy routes can mount after the effect. Remove detached route references.
      for (const element of observed) if (!element.isConnected) {
        observer.unobserve(element); animations.get(element)?.cancel();
        animations.delete(element); observed.delete(element);
      }
      document.querySelectorAll<HTMLElement>(targets).forEach(element => {
        // Keep the sticky buyer image steady instead of replaying fades at viewport edges.
        if (observed.has(element) || element.closest('[data-introduction-motion], [data-buying-timeline], [data-story-scroll], .home-hero, .page-hero, .buying-process-aside, [role="alert"], [role="status"]')) return;
        // Animate a composition once, rather than stacking transforms on its children.
        if (element.parentElement?.closest('[data-scroll-reveal], .section-heading, .form-field, .footer-main > div')) return;
        if (element.matches('.field-error, .form-status')) return;
        observed.add(element); observer.observe(element);
      });
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.getElementById('main-content')!, { childList: true, subtree: true });
    const settleFocus = (event: FocusEvent) => {
      for (const [element, animation] of animations) if (element.contains(event.target as Node)) {
        animation.cancel(); animations.delete(element);
      }
    };
    document.addEventListener('focusin', settleFocus);
    return () => {
      observer.disconnect(); mutations.disconnect();
      animations.forEach(animation => animation.cancel());
      document.removeEventListener('focusin', settleFocus);
    };
  }, [pathname, reduced]);
  return null;
}
