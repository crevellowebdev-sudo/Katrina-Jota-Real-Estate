import { EditorialImage, PageHero, PrimaryButton, ScrollReveal, SectionHeading } from '../components/ui';
import Timeline from '../components/timeline';
import { buyingSteps } from '../data/site';

export default function ForBuyers() {
  return <>
    <PageHero
      title="For Buyers"
      image="/images/buyers-hero.webp"
      alt="A character-filled red-brick home surrounded by the greenery of a Toronto neighbourhood"
    />
    <section className="container buying-process">
      <SectionHeading>The Buying Process</SectionHeading>
      <p className="buying-process-description">A clear, professional, and personalized roadmap designed to guide you through every step of your home search and purchase journey.</p>
      <div className="buying-journey">
        <div className="buying-process-aside">
          <EditorialImage src="/images/details.webp" alt="Thoughtful interior details with a decorative vase and mirror in a warm, minimalist home" />
        </div>
        <Timeline steps={buyingSteps} />
      </div>
    </section>
    <section className="buyer-closing" aria-labelledby="buyer-closing-heading">
      <div className="container buyer-closing-inner">
        <ScrollReveal className="buyer-closing-header">
          <span className="buyer-closing-ornament" aria-hidden="true" />
          <h2 id="buyer-closing-heading">Ready to find your next home?</h2>
          <PrimaryButton to="/contact?interest=buy">Contact Katrina J.</PrimaryButton>
        </ScrollReveal>
        <ScrollReveal className="buyer-closing-image">
          <img src="/images/buying.webp" srcSet="/images/buying-640.webp 640w, /images/buying-960.webp 960w, /images/buying.webp 1200w" sizes="(max-width: 700px) calc(100vw - 52px), 78vw" alt="" width={1200} height={800} loading="lazy" decoding="async" />
        </ScrollReveal>
      </div>
    </section>
  </>;
}
