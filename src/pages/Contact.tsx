import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ContactDetails from '../components/ContactDetails';
import ContactForm from '../components/ContactForm';
import { useInquiryDraft } from '../context/InquiryContext';
import { sendInquiry } from '../lib/inquiryDelivery';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const { setDraft } = useInquiryDraft();
  const interest = searchParams.get('interest');
  useEffect(() => {
    if (interest !== 'buy' && interest !== 'sell') return;
    setDraft(previous => previous.status ? previous : { ...previous, status: interest === 'buy' ? 'Looking to buy' : 'Looking to sell' });
  }, [interest, setDraft]);

  return <section className="container contact-page contact-page--editorial" aria-labelledby="contact-heading">
    <header className="contact-page-heading"><h1 id="contact-heading">Contact</h1><span className="contact-heading-rule" aria-hidden="true" /></header>
    <div className="contact-workspace">
    <div className="contact-introduction">
      <h2 className="contact-subheading">Connect With Us</h2>
      <p>Whether you are looking to buy, sell, or simply explore the GTA market, I am here to guide you every step of the way. Let's start a conversation.</p>
      <section className="contact-details-section" aria-labelledby="contact-details-heading">
        <h2 id="contact-details-heading">Contact details</h2>
        <ContactDetails />
      </section>
    </div>
    <ContactForm adapter={sendInquiry} />
    </div>
  </section>;
}
