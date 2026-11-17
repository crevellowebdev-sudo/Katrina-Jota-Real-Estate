import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { InquiryProvider } from '../context/InquiryContext';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Home from '../pages/Home';
import About from '../pages/About';
import ForSellers from '../pages/ForSellers';
import ForBuyers from '../pages/ForBuyers';
import Contact from '../pages/Contact';
import Legal from '../pages/Legal';
export { getPageSeo, normalizeSiteUrl, indexablePaths, staticPaths } from './metadata';

export function renderPage(pathname: string) {
  const page = pathname === '/' ? <Home /> : pathname === '/about' ? <About /> : pathname === '/for-sellers' ? <ForSellers /> :
    pathname === '/for-buyers' ? <ForBuyers /> : pathname === '/contact' ? <Contact /> :
    pathname === '/privacy-policy' ? <Legal document="privacy" /> : pathname === '/terms-and-conditions' ? <Legal document="terms" /> :
    <section className="container not-found"><h1>Let's find your way home.</h1><p>This page isn't here, but your next chapter is still ahead.</p><a href="/">Return Home</a></section>;
  const html = renderToString(<MotionConfig reducedMotion="always"><LazyMotion features={domAnimation} strict>
    <StaticRouter location={pathname}><InquiryProvider>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader /><main id="main-content" tabIndex={-1}>{page}</main><SiteFooter />
    </InquiryProvider></StaticRouter>
  </LazyMotion></MotionConfig>);
  // Build-time snapshots must remain readable without JavaScript. The client starts
  // its normal animations when React takes over; no hidden entrance styles persist.
  return html.replace(/<form\b/g, '<form inert=""').replace(/ style="([^"]*)"/g, (_, styles: string) => {
    const visibleStyles = styles.split(';').filter(rule => !/^\s*(opacity|transform|clip-path):/.test(rule)).join(';');
    return visibleStyles ? ` style="${visibleStyles}"` : '';
  });
}
