import { ScrollReveal, SectionHeading } from '../components/ui';
import { expertise } from '../data/site';
import FlowArt, { FlowSection } from '../components/story-scroll';

export default function About() {
  return <>
    <section className="container about-introduction" aria-labelledby="about-heading">
      <header className="about-title">
        <h1 id="about-heading">The Katrina Jota <em>Story</em></h1>
      </header>
      <figure className="about-portrait"><img src="/images/katrina-portrait.jpg" alt="Katrina Jota" width={377} height={504} fetchPriority="high" decoding="async" /></figure>
      <ScrollReveal className="biography-copy">
        <p>Katrina’s journey in real estate began with a deep-rooted passion for the Toronto landscape. Her career spans over 15 years in the corporate world, where she honed her analytical skills and strategic vision. This foundation provided the perfect backdrop for her transition into a licensed real estate agent, where she now brings a unique blend of professional authority and a personal, warm approach to every client interaction.</p>
      </ScrollReveal>
      <ScrollReveal className="about-story-continuation">
        <p>With more than four years of dedicated practice in the GTA, Katrina has cultivated a reputation for her unwavering commitment to her clients. She understands that real estate is more than just a transaction; it is a personal journey. Her expertise lies in navigating the complexities of the market with precision, ensuring that every buyer and seller receives the guidance they deserve. Whether you are looking to buy, sell, or simply explore your options, Katrina is dedicated to providing a refined and trustworthy experience tailored to your specific needs.</p>
      </ScrollReveal>
    </section>

    <section className="expertise-story expertise-story--unified" aria-labelledby="expertise-heading">
      <FlowArt aria-label="Expertise and credentials">
        <FlowSection index={1} className="expertise-green-panel" aria-label="Expertise and credentials">
          <div className="container expertise-layout">
            <SectionHeading><span id="expertise-heading">Expertise &amp; Credentials</span></SectionHeading>
            <div className="expertise-grid">{expertise.map((item, index) => <div key={item.title} className="expertise-item">
              <span className="expertise-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3><p>{item.description}</p>
            </div>)}</div>
          </div>
        </FlowSection>
      </FlowArt>
    </section>

  </>;
}
