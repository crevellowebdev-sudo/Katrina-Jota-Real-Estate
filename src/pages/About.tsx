import { ImageReveal, ScrollReveal, SectionHeading } from '../components/ui';
import { expertise } from '../data/site';

export default function About() {
  return <>
    <section className="container about-introduction" aria-labelledby="about-heading">
      <header className="about-title">
        <h1 id="about-heading">About Katrina Jota</h1>
      </header>
      <figure className="about-portrait">
        <ImageReveal>
          <img src="/images/katrina-portrait-1365.webp" srcSet="/images/katrina-portrait-480.webp 480w, /images/katrina-portrait-800.webp 800w, /images/katrina-portrait-1365.webp 1365w" sizes="(max-width: 700px) 80vw, 380px" alt="Katrina Jota wearing glasses and a dark blazer, standing with her arms folded" width={1365} height={2048} fetchPriority="high" decoding="async" />
        </ImageReveal>
      </figure>
      <ScrollReveal className="biography-copy">
        <p>Katrina’s journey in real estate began with a deep-rooted passion for the Toronto landscape. Her career spans over 15 years in the corporate world, where she honed her analytical skills and strategic vision. This foundation provided the perfect backdrop for her transition into a licensed real estate agent, where she now brings a unique blend of professional authority and a personal, warm approach to every client interaction.</p>
      </ScrollReveal>
      <ScrollReveal className="about-story-continuation">
        <p>With more than four years of dedicated practice in the GTA, Katrina has cultivated a reputation for her unwavering commitment to her clients. She understands that real estate is more than just a transaction; it is a personal journey. Her expertise lies in navigating the complexities of the market with precision, ensuring that every buyer and seller receives the guidance they deserve. Whether you are looking to buy, sell, or simply explore your options, Katrina is dedicated to providing a refined and trustworthy experience tailored to your specific needs.</p>
      </ScrollReveal>
    </section>

    <section className="expertise-story expertise-editorial" aria-labelledby="expertise-heading">
      <div className="container">
        <SectionHeading className="expertise-editorial-heading"><span id="expertise-heading">Expertise &amp; Credentials</span></SectionHeading>
        <div className="expertise-layout">
          <figure className="expertise-editorial-photo">
            <ImageReveal>
              <img src="/images/h.jpg" alt="An illustrative aerial view of a residential neighbourhood with detached homes and tree-lined surroundings" width={1600} height={1997} loading="lazy" decoding="async" />
            </ImageReveal>
          </figure>
          <div className="expertise-grid">{expertise.map((item, index) => <ScrollReveal key={item.title} className="expertise-item">
              <span className="expertise-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3><p>{item.description}</p>
          </ScrollReveal>)}</div>
        </div>
      </div>
    </section>

  </>;
}
