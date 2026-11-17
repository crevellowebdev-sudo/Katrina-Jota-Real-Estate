import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import * as motion from 'motion/react-m';
import { useSpring } from 'motion/react';

const pageMessages: Record<string, string> = {
  '/': "Let's head home.",
  '/about': 'Get to know me.',
  '/for-sellers': 'Thinking of selling your home?',
  '/for-buyers': "Let's find your next home.",
  '/contact': "Let's start a conversation.",
};

function conversationFor(target: HTMLElement) {
  const custom = target.getAttribute('data-cursor-label');
  if (custom) return custom;
  const href = target.getAttribute('href') ?? '';
  if (href.startsWith('tel:')) return "Let's give Katrina a call.";
  if (/^(mailto:|https:\/\/mail\.google\.com)/.test(href)) return "Let's write Katrina an email.";
  if (target.matches('.mobile-menu-trigger')) return "Let's explore the pages.";
  if (target.getAttribute('aria-label') === 'Close navigation') return "Let's close the menu.";
  if (target.matches('button[data-subscribe]')) return "Let's keep in touch.";
  if (target.matches('#inquiry-form button[type="submit"]')) return "Let's send your inquiry.";
  if (target.matches('.review-button')) return "Let's review your details.";
  if (href === '#main-content') return "Let's skip to the page content.";
  if (href) {
    const destination = new URL(href, window.location.href);
    if (destination.origin === window.location.origin) {
      if (destination.pathname === '/contact') {
        if (destination.searchParams.get('interest') === 'buy') return 'Tell me about your ideal home.';
        if (destination.searchParams.get('interest') === 'sell') return "Let's request a home evaluation.";
        if (target.classList.contains('primary-button')) return "Let's arrange your free consultation.";
      }
      if (destination.pathname === '/' && target.classList.contains('primary-button')) return "Let's head back home.";
      if (pageMessages[destination.pathname]) return pageMessages[destination.pathname];
    }
  }
  // Unrecognized controls use their own action label rather than an unrelated prompt.
  return target.getAttribute('aria-label') || target.textContent?.replace(/\s+/g, ' ').trim() || 'Open link';
}

function bubblePosition(point: { x: number; y: number }, size: { width: number; height: number }) {
  const above = point.y - size.height - 14;
  return {
    left: Math.max(12, Math.min(point.x + 16, innerWidth - size.width - 12)),
    top: Math.max(12, Math.min(above >= 12 ? above : point.y + 20, innerHeight - size.height - 12)),
  };
}

// Adapted from the supplied cursor-bubble.tsx using the site's existing motion library.
export default function CursorBubble() {
  const { key } = useLocation();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [host, setHost] = useState<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const size = useRef({ width: 180, height: 34 });
  const pointer = useRef({ x: 0, y: 0 });
  const x = useSpring(0, { stiffness: 650, damping: 50, mass: .35 });
  const y = useSpring(0, { stiffness: 650, damping: 50, mass: .35 });

  useEffect(() => {
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(pointer.matches && !reduced.matches);
    update();
    pointer.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      pointer.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);

  useLayoutEffect(() => {
    if (bubbleRef.current) {
      size.current = {
        width: bubbleRef.current.offsetWidth,
        height: bubbleRef.current.offsetHeight,
      };
      // A longer label must fit even when the pointer stops at the viewport edge.
      const { left, top } = bubblePosition(pointer.current, size.current);
      x.jump(left);
      y.jump(top);
    }
  }, [label, host, enabled, x, y]);

  useEffect(() => {
    setVisible(false);
    setHost(null);
    if (!enabled) return;
    let current: HTMLElement | null = null;
    const hide = () => { current = null; setVisible(false); };
    const resize = () => { hide(); x.jump(0); y.jump(0); };
    const position = (event: PointerEvent, snap: boolean) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      const { left, top } = bubblePosition(pointer.current, size.current);
      if (snap) { x.jump(left); y.jump(top); }
      else { x.set(left); y.set(top); }
    };
    const move = (event: PointerEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('a[href], button, [role="button"]') : null;
      if (event.pointerType !== 'mouse' || !target || target.matches(':disabled, [aria-disabled="true"]') || target.closest('[inert]') || document.querySelector('.opening-screen')) {
        if (current) hide();
        return;
      }
      if (target !== current) {
        const text = conversationFor(target);
        // Render inside an open dialog so its top layer also includes the bubble.
        setHost(target.closest<HTMLDialogElement>('dialog[open]'));
        setLabel(text);
        setVisible(true);
        position(event, current === null);
        current = target;
      } else position(event, false);
    };
    document.addEventListener('pointerover', move);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', hide);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('keydown', hide);
    document.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerover', move);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', hide);
      document.removeEventListener('pointerdown', hide);
      document.removeEventListener('keydown', hide);
      document.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, key, x, y]);

  if (!enabled) return null;
  return createPortal(<motion.div className="cursor-bubble-position" aria-hidden="true" style={{ x, y }}>
    <motion.div
      ref={bubbleRef}
      className="cursor-bubble"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : .96 }}
      transition={{ duration: .18, ease: [.22, 1, .36, 1] }}
    >{label}</motion.div>
  </motion.div>, host ?? document.body);
}
