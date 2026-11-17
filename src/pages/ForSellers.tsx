import { ImageReveal, PageHero, PrimaryButton, ScrollReveal, SectionHeading } from '../components/ui';
import ProcessTimeline from '../components/ProcessTimeline';
import { sellingSteps } from '../data/site';

export default function ForSellers() {
  return <div className="sellers-page">
    <PageHero
      variant="selling"
      title="For Sellers"
      image="/images/sellers-hero.webp"
      alt="An illustrative sunlit living room with soaring windows, warm wood floors, and a fireplace"
      reveal
    />
    <section className="container selling-process">
      <SectionHeading>The Selling Process</SectionHeading>
      <p className="selling-process-description">Transforming your property into a high-value asset through a refined and strategic approach.</p>
      <div className="selling-journey">
        <div className="selling-process-aside">
          <div className="selling-image-frame">
            <ImageReveal>
              <img src="/images/approved-sellers.jpg" alt="An illustrative living room with warm wood paneling, neutral sofas, and soft lighting" width={407} height={507} loading="lazy" decoding="async" />
            </ImageReveal>
          </div>
        </div>
        <ProcessTimeline steps={sellingSteps} />
      </div>
    </section>
    <section className="seller-closing" aria-labelledby="seller-closing-heading">
      <div className="container seller-closing-frame">
        <div className="seller-closing-image" aria-hidden="true">
          <ImageReveal className="seller-closing-image-reveal">
            <img src="/images/c.jpg" alt="" width={1600} height={2134} loading="lazy" decoding="async" />
          </ImageReveal>
        </div>
        <ScrollReveal className="seller-closing-copy">
          <h2 id="seller-closing-heading">Ready to sell?</h2>
          <p>Let’s discuss your property and timeline. I’ll provide a personalized evaluation and guide you through the GTA market to ensure your home sells at the highest value.</p>
          <PrimaryButton to="/contact?interest=sell">Free Evaluation</PrimaryButton>
        </ScrollReveal>
      </div>
    </section>
  </div>;
}
