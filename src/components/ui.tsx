import { useRef, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import * as motion from 'motion/react-m';
import { useReducedMotion, useScroll, useTransform } from 'motion/react';

export const editorialEase = [0.22, 1, 0.36, 1] as const;

export function PrimaryButton({ children, className = '', light = false, ...props }: LinkProps & { light?: boolean }) {
  return <Link className={`primary-button ${light ? 'primary-button--light' : ''} ${className}`} {...props}>
    <span>{children}</span><ArrowUpRight size={17} strokeWidth={1.5} aria-hidden="true" />
  </Link>;
}

export function TextLink({ children, className = '', ...props }: LinkProps) {
  return <Link className={`text-link ${className}`} {...props}>
    <span>{children}</span><ArrowRight size={19} strokeWidth={1.4} aria-hidden="true" />
  </Link>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}><span className="eyebrow-rule" aria-hidden="true" />{children}</p>;
}

export function SectionHeading({ children, eyebrow, className = '' }: { children: ReactNode; eyebrow?: string; className?: string }) {
  return <div className={`section-heading ${className}`}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2>{children}</h2>
  </div>;
}

export function ScrollReveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={className} data-scroll-reveal data-reveal-delay={delay}>{children}</div>;
}

export function TextReveal({ children, className = '', delay = 0 }: {
  children: ReactNode; className?: string; delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return <motion.div
    className={className}
    initial={reduceMotion ? false : { opacity: 0, y: 26 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.72, delay, ease: editorialEase }}
  >
    {children}
  </motion.div>;
}

export function ImageReveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={`image-reveal ${className}`}>{children}</div>;
  return <motion.div
    className={`image-reveal ${className}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
  >
    <motion.div
      className="image-reveal-clip"
      variants={{ hidden: { clipPath: 'inset(0 0 100% 0)' }, visible: { clipPath: 'inset(0 0 0% 0)' } }}
      transition={{ duration: 1, delay, ease: editorialEase }}
    >
      <motion.div
        className="image-reveal-media"
        variants={{ hidden: { scale: 1.07 }, visible: { scale: 1 } }}
        transition={{ duration: 1.35, delay, ease: editorialEase }}
      >
        {children}
      </motion.div>
    </motion.div>
  </motion.div>;
}

export function EditorialImage({ src, alt, className = '', priority = false, parallax = false, width = 1200, height = 800, sizes = '(max-width: 700px) calc(100vw - 46px), 44vw' }: {
  src: string; alt: string; className?: string; priority?: boolean; parallax?: boolean; width?: number; height?: number; sizes?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  return <div ref={ref} className={`editorial-image ${parallax && !reduceMotion ? 'editorial-image--parallax' : ''} ${className}`}>
    <motion.img
      src={src}
      srcSet={src.endsWith('.webp') ? `${src.replace('.webp', '-640.webp')} 640w, ${src.replace('.webp', '-960.webp')} 960w, ${src} 1200w` : undefined}
      sizes={src.endsWith('.webp') ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      style={parallax && !reduceMotion ? { y, scale: 1.045 } : undefined}
    />
  </div>;
}

export function PageHero({ eyebrow, title, description, image, alt, cta, to = '/contact', variant = 'buying', reveal = false }: {
  eyebrow?: string; title: ReactNode; description?: string; image: string; alt: string; cta?: string; to?: string; variant?: 'selling' | 'buying'; reveal?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const clipReveal = reveal && !reduceMotion;
  return <section ref={heroRef} className={`page-hero page-hero--${variant}`}>
    <motion.div className="page-hero-media" style={{ y: reduceMotion ? 0 : imageY }}
      initial={clipReveal ? { clipPath: 'inset(0 0 100% 0)' } : false}
      animate={clipReveal ? { clipPath: 'inset(0 0 0% 0)' } : undefined}
      transition={{ duration: 1.15, ease: editorialEase }}>
    <motion.img className="page-hero-image" src={image} srcSet={/\.(webp|jpe?g)$/i.test(image) ? `${image.replace(/(\.[^.]+)$/, '-640$1')} 640w, ${image.replace(/(\.[^.]+)$/, '-960$1')} 960w, ${image} 1600w` : undefined} sizes="100vw" alt={alt}
      width={1200} height={800} fetchPriority="high" initial={reduceMotion ? false : { scale: clipReveal ? 1.08 : 1.035 }} animate={{ scale: 1 }} transition={{ duration: clipReveal ? 1.4 : 1.2, ease: editorialEase }} />
    </motion.div>
    <div className="page-hero-shade" />
    <motion.div className="container page-hero-content" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: editorialEase }}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1>{title}</h1>
      {description && <p className="page-hero-description">{description}</p>}
      {cta && <PrimaryButton to={to}>{cta}</PrimaryButton>}
    </motion.div>
  </section>;
}

export function ConsultationCTA({ title, description, button, to = '/contact' }: {
  title: ReactNode; description?: string; button: string; to?: string;
}) {
  return <section className="consultation-section">
    <ScrollReveal className={`container consultation-content ${description ? 'consultation-content--with-copy' : ''}`}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <PrimaryButton to={to}>{button}</PrimaryButton>
    </ScrollReveal>
    <span className="consultation-arch" aria-hidden="true" />
  </section>;
}
