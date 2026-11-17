import { EditorialImage, ImageReveal, PageHero, PrimaryButton, SectionHeading, TextReveal } from '../components/ui';
import Timeline from '../components/timeline';
import { buyingSteps } from '../data/site';

export default function ForBuyers() {
  return <div className="buyers-page" data-page-motion>
    <PageHero
      title="For Buyers"
      image="/images/buyers-hero.webp"
      alt="A character-filled red-brick home surrounded by the greenery of a Toronto neighbourhood"
      reveal
    />
    <section className="container buying-process">
      <TextReveal>
        <SectionHeading>The Buying Process</SectionHeading>
      </TextReveal>
      <TextReveal delay={0.08}>
        <p className="buying-process-description">A clear, professional, and personalized roadmap designed to guide you through every step of your home search and purchase journey.</p>
      </TextReveal>
      <div className="buying-journey">
        <div className="buying-process-aside">
          <ImageReveal>
            <EditorialImage src="/images/n.jpg" alt="An illustrative contemporary home with floor-to-ceiling glass, illuminated rooflines, and a landscaped pool at dusk" width={1600} height={2106} />
          </ImageReveal>
        </div>
        <Timeline steps={buyingSteps} />
      </div>
    </section>
    <section className="buyer-closing" aria-labelledby="buyer-closing-heading">
      <div className="container buyer-closing-inner">
        <TextReveal className="buyer-closing-header">
          <span className="buyer-closing-ornament" aria-hidden="true" />
          <h2 id="buyer-closing-heading">Ready to find your next home?</h2>
          <PrimaryButton to="/contact?interest=buy">Contact Katrina J.</PrimaryButton>
        </TextReveal>
        <div className="buyer-closing-image">
          <ImageReveal delay={0.1}>
            <img src="/images/buying.webp" srcSet="/images/buying-640.webp 640w, /images/buying-960.webp 960w, /images/buying.webp 1200w" sizes="(max-width: 700px) calc(100vw - 52px), 78vw" alt="" width={1200} height={800} loading="lazy" decoding="async" />
          </ImageReveal>
        </div>
      </div>
    </section>
  </div>;
}
