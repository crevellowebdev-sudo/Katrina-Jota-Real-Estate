import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { stagger, useAnimate } from 'motion/react';
import { business, navigation } from '../data/site';
import { PrimaryButton } from './ui';
import { useHeroReducedMotion } from './scroll-expansion-hero';

export function BrandWordmark({ footer = false }: { footer?: boolean }) {
  return <Link to="/" className={`brand-wordmark ${footer ? 'brand-wordmark--footer' : ''}`} aria-label="Katrina Jota Real Estate home">
    <img className="brand-logo" src="/images/logo-transparent.png" alt="Katrina Jota Real Estate logo" width={2142} height={734} decoding="async" />
  </Link>;
}

export function DesktopNavigation() {
  return <nav className="desktop-navigation" aria-label="Main navigation">
    {navigation.map(item => <NavLink end={item.to === '/'} key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>{item.label}</NavLink>)}
  </nav>;
}

export function MobileNavigation({ open, onClose, triggerRef }: { open: boolean; onClose: () => void; triggerRef: RefObject<HTMLButtonElement | null> }) {
  const [dialogRef, animate] = useAnimate<HTMLDialogElement>();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const openingPlayback = useRef<{ complete: () => void } | null>(null);
  const reduceMotion = useHeroReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || (!open && !dialog.open)) return;
    let active = true;
    if (open) {
      if (previousOverflow.current === null) previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (!dialog.open) dialog.showModal();
      closeRef.current?.focus();
    }
    const immediate = reduceMotion || (!open && window.matchMedia('(min-width: 1280px)').matches);
    const playback = open ? animate([
      [dialog, { opacity: [0, 1], y: [-14, 0] }, { duration: immediate ? 0 : .4, at: 0 }],
      ['.mobile-menu-body nav a', { opacity: [0, 1], x: 0, y: [14, 0] }, { duration: immediate ? 0 : .38, delay: immediate ? 0 : stagger(.045), at: immediate ? 0 : .06 }],
      ['.mobile-menu-body > .primary-button, .mobile-contact', { opacity: [0, 1], y: [10, 0] }, { duration: immediate ? 0 : .35, at: immediate ? 0 : .2 }],
    ], { defaultTransition: { ease: [.22, 1, .36, 1] } }) : animate([
      ['.mobile-menu-body nav a', { opacity: 0, x: 0, y: -10 }, { duration: immediate ? 0 : .18, delay: immediate ? 0 : stagger(.02, { from: 'last' }), at: 0 }],
      ['.mobile-menu-body > .primary-button, .mobile-contact', { opacity: 0, y: 8 }, { duration: immediate ? 0 : .18, at: 0 }],
      [dialog, { opacity: 0, y: -12 }, { duration: immediate ? 0 : .25, at: immediate ? 0 : .08 }],
    ], { defaultTransition: { ease: [.4, 0, .2, 1] } });
    openingPlayback.current = open ? playback : null;
    if (!open) void playback.finished.then(() => {
      if (!active) return;
      dialog.close();
      document.body.style.overflow = previousOverflow.current ?? '';
      previousOverflow.current = null;
      if (triggerRef.current?.getClientRects().length) triggerRef.current.focus({ preventScroll: true });
    });
    return () => {
      active = false;
      openingPlayback.current = null;
      playback.stop();
    };
  }, [animate, dialogRef, open, reduceMotion, triggerRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      dialog?.close();
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
    };
  }, [dialogRef]);

  return <dialog ref={dialogRef} id="mobile-navigation" className="mobile-navigation" aria-label="Site navigation" onFocusCapture={() => { if (open) openingPlayback.current?.complete(); }} onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <div className="mobile-menu-top"><div onClick={onClose}><BrandWordmark /></div><button ref={closeRef} className="menu-toggle" onClick={onClose} aria-label="Close navigation"><MenuGlyph expanded={open} /></button></div>
    <div className="mobile-menu-body">
      <nav aria-label="Mobile navigation">{navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}><span>{item.label}</span></NavLink>)}</nav>
      <PrimaryButton to="/contact" onClick={onClose}>Book a Free Consultation</PrimaryButton>
      <a className="mobile-contact" href={business.phoneHref}>{business.phone}</a>
    </div>
  </dialog>;
}

function MenuGlyph({ expanded }: { expanded: boolean }) {
  return <span className="menu-glyph" data-expanded={expanded} aria-hidden="true"><i /><i /><i /></span>;
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener('scroll', update, { passive: true });
    const desktop = window.matchMedia('(min-width: 1280px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => { window.removeEventListener('scroll', update); desktop.removeEventListener('change', closeOnDesktop); };
  }, []);
  return <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
    <div className="container header-inner">
      <BrandWordmark />
      <DesktopNavigation />
      <PrimaryButton to="/contact" className="header-cta">Book a Free Consultation</PrimaryButton>
      <button ref={triggerRef} className="menu-toggle mobile-menu-trigger" aria-expanded={open} aria-controls="mobile-navigation" aria-label="Open navigation menu" onClick={() => setOpen(true)}><span>MENU</span><MenuGlyph expanded={open} /></button>
    </div>
    <MobileNavigation open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} />
  </header>;
}
