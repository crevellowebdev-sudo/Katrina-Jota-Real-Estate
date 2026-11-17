import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import * as motion from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { business, navigation } from '../data/site';
import { PrimaryButton } from './ui';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open, triggerRef]);

  return <dialog ref={dialogRef} id="mobile-navigation" className="mobile-navigation" aria-label="Site navigation" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <div className="mobile-menu-top"><div onClick={onClose}><BrandWordmark /></div><button ref={closeRef} className="menu-toggle" onClick={onClose} aria-label="Close navigation"><X size={25} strokeWidth={1.3} /></button></div>
    {open && <motion.div className="mobile-menu-body" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <nav aria-label="Mobile navigation">{navigation.map((item, index) => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}><span className="mobile-nav-number">0{index + 1}</span>{item.label}</NavLink>)}</nav>
      <PrimaryButton to="/contact" onClick={onClose}>Book a Free Consultation</PrimaryButton>
      <a className="mobile-contact" href={business.phoneHref}>{business.phone}</a>
    </motion.div>}
  </dialog>;
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
      <button ref={triggerRef} className="menu-toggle mobile-menu-trigger" aria-expanded={open} aria-controls="mobile-navigation" aria-label="Open navigation menu" onClick={() => setOpen(true)}><span>MENU</span><Menu size={25} strokeWidth={1.3} /></button>
    </div>
    <MobileNavigation open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} />
  </header>;
}
