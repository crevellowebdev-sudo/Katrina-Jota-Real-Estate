import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import * as motion from 'motion/react-m';
import { domAnimation, LazyMotion, MotionConfig, useReducedMotion } from 'motion/react';
import SiteHeader from './components/SiteHeader';
import OpeningScreen from './components/OpeningScreen';
import CursorBubble from './components/cursor-bubble';
import BackToTop from './components/BackToTop';
import ScrollChoreography from './components/ScrollChoreography';
import SiteFooter from './components/SiteFooter';
import { editorialEase, PrimaryButton } from './components/ui';
import { InquiryProvider } from './context/InquiryContext';
import { applyPageSeo, normalizeSiteUrl } from './seo/metadata';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const ForSellers = lazy(() => import('./pages/ForSellers'));
const ForBuyers = lazy(() => import('./pages/ForBuyers'));
const Contact = lazy(() => import('./pages/Contact'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const Legal = lazy(() => import('./pages/Legal'));

function RouteEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const firstRender = useRef(true);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    applyPageSeo(location.pathname, normalizeSiteUrl(import.meta.env.VITE_SITE_URL));
  }, [location.pathname]);

  useEffect(() => {
    const first = firstRender.current;
    firstRender.current = false;
    const saved = navigationType === 'POP' ? positions.current.get(location.key) ?? 0 : 0;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: saved, behavior: 'instant' });
      if (!first) document.getElementById('main-content')?.focus({ preventScroll: true });
    });
    const save = () => {
      // Ignore viewport clamping from the next route's temporary loading layout.
      const currentKey = window.history.state?.key ?? 'default';
      if (currentKey === location.key) positions.current.set(location.key, window.scrollY);
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', save); };
  }, [location.key, navigationType]);
  return null;
}

function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  return <motion.div
    className="page-transition"
    initial={reduceMotion || location.key === 'default' ? false : { opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: reduceMotion ? 0 : 0.35, ease: editorialEase }}
  >{children}</motion.div>;
}

function SiteLayout() {
  const location = useLocation();
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <OpeningScreen />
    <CursorBubble />
    <SiteHeader />
    <RouteEffects />
    <ScrollChoreography />
    <main id="main-content" tabIndex={-1}>
      <Suspense fallback={<div className="route-loading" role="status">Preparing your next chapter...</div>}>
        {/* Start the entrance when the destination is ready, including lazy-loaded pages. */}
        <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/for-sellers" element={<ForSellers />} />
          <Route path="/for-buyers" element={<ForBuyers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/privacy-policy" element={<Legal document="privacy" />} />
          <Route path="/terms-and-conditions" element={<Legal document="terms" />} />
          <Route path="*" element={<section className="container not-found"><p className="eyebrow">A DIFFERENT DIRECTION</p><h1>Let's find your way home.</h1><p>This page isn't here, but your next chapter is still ahead.</p><PrimaryButton to="/">Return Home</PrimaryButton></section>} />
        </Routes>
        </PageTransition>
      </Suspense>
    </main>
    <SiteFooter />
    <BackToTop />
  </>;
}

export default function App() {
  return <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict><BrowserRouter><InquiryProvider><SiteLayout /></InquiryProvider></BrowserRouter></LazyMotion></MotionConfig>;
}
