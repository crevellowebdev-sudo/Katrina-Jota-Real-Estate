import { useEffect, useRef } from 'react';
import { useAnimate, useScroll, useSpring, useTransform } from 'motion/react';
import { useHeroReducedMotion } from '../components/scroll-expansion-hero';
import * as motion from 'motion/react-m';
import { editorialEase, PrimaryButton } from '../components/ui';
import HeroBackgroundVideo from '../components/HeroBackgroundVideo';
import HomeScrollReveal from '../components/HomeScrollReveal';

function HomeHero() {
  const [scope, animate] = useAnimate<HTMLElement>();
  const reduced = useHeroReducedMotion();
  const played = useRef(false);
  const { scrollYProgress } = useScroll({ target: scope, offset: ['start start', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, mass: .3 });
  const photoY = useTransform(progress, [0, 1], [0, 100]);
  const headingY = useTransform(progress, [0, 1], [0, -56]);
  const headingOpacity = useTransform(progress, [0, .3, .78, 1], [1, 1, 0, 0]);
  const copyY = useTransform(progress, [0, 1], [0, -28]);
  const copyOpacity = useTransform(progress, [0, .68, .98, 1], [1, 1, 0, 0]);

  useEffect(() => {
    if (reduced || played.current) return;
    let playback: { complete: () => void } | undefined;
    let frame = 0;
    // Wait for the existing opening curtain. The HTML remains visible without JS.
    const reveal = () => {
      if (document.querySelector('.opening-screen')) return;
      observer.disconnect();
      frame = requestAnimationFrame(() => {
        played.current = true;
        if (!scope.current || scope.current.matches(':focus-within') || scope.current.getBoundingClientRect().bottom < 0) return;
        playback = animate([
        ['.home-cinematic-frame', { opacity: [0, 1] }, { duration: 1.1, at: 0 }],
        ['.home-gallery-masthead > p', { opacity: [.2, 1], y: [10, 0] }, { duration: .5, at: .08 }],
        ['.home-gallery h1 > span', { opacity: [.1, 1], y: [38, 0] }, { duration: .9, at: .12 }],
        ['.home-gallery h1 > em', { opacity: [.1, 1], y: [38, 0] }, { duration: .9, at: .24 }],
        ['.home-gallery-copy > p', { opacity: [.2, 1], y: [18, 0] }, { duration: .7, at: .34 }],
        ['.home-gallery-cta', { opacity: [.3, 1], y: [14, 0] }, { duration: .6, at: .46 }],
        ], { defaultTransition: { ease: editorialEase } });
      });
    };
    const observer = new MutationObserver(reveal);
    observer.observe(document.body, { childList: true, subtree: true });
    reveal();
    // Keyboard visitors should never chase a moving control.
    const settle = () => playback?.complete();
    const element = scope.current;
    element?.addEventListener('focusin', settle);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); playback?.complete(); element?.removeEventListener('focusin', settle); };
  }, [animate, reduced, scope]);

  return <section ref={scope} className="home-hero home-gallery" aria-labelledby="home-heading">
    <motion.div className="home-hero-video-parallax" style={{ y: reduced ? 0 : photoY }}>
      <HeroBackgroundVideo />
    </motion.div>
    <div className="home-cinematic-shade" aria-hidden="true" />
    <div className="home-cinematic-frame" aria-hidden="true" />
    <div className="container home-cinematic-content">
      <motion.div className="home-gallery-masthead" style={reduced ? { y: 0, opacity: 1 } : { y: headingY, opacity: headingOpacity }}>
        <p>Katrina Jota</p>
      </motion.div>
      <motion.div className="home-cinematic-main" style={reduced ? { y: 0, opacity: 1 } : { y: copyY, opacity: copyOpacity }}>
        <h1 id="home-heading"><span>Refined</span>{' '}<em>Real Estate</em></h1>
        <div className="home-gallery-layout">
          <div className="home-gallery-copy">
            <p>Expert guidance for the GTA's most discerning buyers and sellers. I provide a personal, warm approach to real estate, ensuring your journey is as seamless as your home.</p>
            <PrimaryButton className="home-gallery-cta" to="/contact">Book a Free Consultation</PrimaryButton>
          </div>
        </div>
      </motion.div>
      <div className="home-cinematic-foot" aria-hidden="true">
        <span className="home-cinematic-scroll" />
      </div>
    </div>
  </section>;
}

export default function Home() {
  return <div className="home-redesign">
    <HomeHero />
    <section data-introduction-motion className="home-story" aria-labelledby="introduction-heading">
      <div className="container home-story-layout">
        <HomeScrollReveal className="home-story-portrait" distance={56}>
          <figure>
            <div className="home-photo-window home-story-portrait-window">
              <img src="/images/katrina-portrait-800.webp" srcSet="/images/katrina-portrait-480.webp 480w, /images/katrina-portrait-800.webp 800w, /images/katrina-portrait-1365.webp 1365w" sizes="(max-width: 700px) 80vw, 38vw" alt="Katrina Jota, wearing glasses and a black blazer" width={800} height={1200} loading="lazy" decoding="async" />
            </div>
            <figcaption>Katrina Jota</figcaption>
          </figure>
        </HomeScrollReveal>
        <div className="home-story-copy">
          <HomeScrollReveal distance={24}>
            <h2 id="introduction-heading">Your next move in the GTA starts with <em>Katrina J.</em></h2>
          </HomeScrollReveal>
          <HomeScrollReveal distance={20}>
            <p className="home-story-description">With over 15 years of expertise in corporate and commercial real estate, I bring a refined and personal approach to every transaction. My journey has been defined by a commitment to excellence and a deep understanding of the Toronto market. I combine authoritative market knowledge with a warm, trustworthy atmosphere to ensure your property journey is as seamless as it is successful.</p>
          </HomeScrollReveal>
          <HomeScrollReveal className="home-story-detail" distance={36}>
            <div className="home-photo-window" aria-hidden="true">
              <img src="/images/hero.jpg" alt="" width={1600} height={1066} loading="lazy" decoding="async" />
            </div>
          </HomeScrollReveal>
        </div>
      </div>
    </section>
  </div>;
}
