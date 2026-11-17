import { useRef, useState } from 'react';
import { useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import ScrollExpansionVideo, { useHeroReducedMotion } from '../components/scroll-expansion-hero';
import * as motion from 'motion/react-m';
import { editorialEase, ImageReveal, PrimaryButton, TextReveal } from '../components/ui';

function HomeHero() {
  const reduceMotion = useHeroReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [copyHidden, setCopyHidden] = useState(false);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end end'] });
  const textOpacity = useTransform(scrollYProgress, [.05, .5], [1, 0]);
  const textY = useTransform(scrollYProgress, [.05, .5], [0, -32]);
  const imageOpacity = useTransform(scrollYProgress, [.15, .65], [1, 0]);
  const imageY = useTransform(scrollYProgress, [.15, .65], [0, 24]);
  useMotionValueEvent(scrollYProgress, 'change', progress => setCopyHidden(progress >= .5));
  const reveal = (delay: number) => ({
    initial: reduceMotion ? false as const : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay: reduceMotion ? 0 : delay, ease: editorialEase },
  });
  return <section ref={heroRef} className={`home-scroll-scene ${reduceMotion ? '' : 'home-scroll-scene--active'}`} aria-labelledby="home-heading">
    <div className="home-scroll-stage">
    <div className="home-hero">
    <div className="container home-hero-inner">
      <motion.div className="home-hero-copy" inert={!reduceMotion && copyHidden} style={reduceMotion ? { opacity: 1, y: 0 } : { opacity: textOpacity, y: textY }}>
        <motion.p className="hero-signature" {...reveal(0.08)}>Katrina Jota</motion.p>
        <motion.h1 id="home-heading" {...reveal(0.18)}>Refined <em>Real Estate</em></motion.h1>
        <motion.p className="hero-description" {...reveal(0.34)}>Expert guidance for the GTA's most discerning buyers and sellers. I provide a personal, warm approach to real estate, ensuring your journey is as seamless as your home.</motion.p>
        <motion.div className="hero-actions" {...reveal(0.43)}>
          <PrimaryButton to="/contact">Book a Free Consultation</PrimaryButton>
        </motion.div>
      </motion.div>
    </div>
    <motion.div className="home-hero-media" aria-hidden="true" style={reduceMotion ? { opacity: 1, y: 0 } : { opacity: imageOpacity, y: imageY }}><motion.img src="/images/home-hero.jpg" alt="" width={1600} height={1066} fetchPriority="high" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .9, delay: .15, ease: editorialEase }} /></motion.div>
    </div>
    <ScrollExpansionVideo target={heroRef} />
    </div>
  </section>;
}

export default function Home() {
  const introductionRef = useRef<HTMLElement>(null);
  const reduced = useHeroReducedMotion();
  const { scrollYProgress } = useScroll({ target: introductionRef, offset: ['start end', 'end start'] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [32, -32]);
  const copyY = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  return <>
    <HomeHero />
    <section ref={introductionRef} data-introduction-motion className="home-introduction-section" aria-labelledby="introduction-heading">
      <div className="container home-introduction">
        <motion.div className="introduction-portrait" style={{ y: reduced ? 0 : portraitY }}>
          <ImageReveal>
            <img src="/images/p.jpg" alt="Katrina Jota" width={1600} height={2400} loading="lazy" decoding="async" />
          </ImageReveal>
        </motion.div>
        <motion.div className="introduction-copy" style={{ y: reduced ? 0 : copyY }}>
          <TextReveal>
            <h2 id="introduction-heading">Your next move in the GTA starts with <em>Katrina J.</em></h2>
            <p>With over 15 years of expertise in corporate and commercial real estate, I bring a refined and personal approach to every transaction. My journey has been defined by a commitment to excellence and a deep understanding of the Toronto market. I combine authoritative market knowledge with a warm, trustworthy atmosphere to ensure your property journey is as seamless as it is successful.</p>
          </TextReveal>
        </motion.div>
      </div>
    </section>
  </>;
}
