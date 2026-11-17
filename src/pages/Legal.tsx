import { Link } from 'react-router-dom';
import { business } from '../data/site';
import { legalDocuments } from '../data/legal';

export default function Legal({ document }: { document: 'privacy' | 'terms' }) {
  const content = legalDocuments[document];
  return <article className="container legal-page" aria-labelledby="legal-heading">
    <header className="legal-page-header">
      <p className="legal-kicker">Katrina Jota Real Estate</p>
      <h1 id="legal-heading">{content.title}</h1>
      <p className="legal-draft-notice"><strong>Draft for client review.</strong> This document has not been approved as the website's final policy. Its wording and outstanding business details require review before publication.</p>
      <p className="legal-introduction">{content.introduction}</p>
    </header>
    <div className="legal-sections">{content.sections.map((section, index) => <section className="legal-section" key={section.title} aria-labelledby={`legal-section-${index}`}>
      <h2 id={`legal-section-${index}`}>{section.title}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </section>)}</div>
    <section className="legal-contact" aria-labelledby="legal-contact-heading">
      <h2 id="legal-contact-heading">Contact</h2>
      <p><a href={business.emailHref} target="_blank" rel="noopener noreferrer">{business.email}</a><br /><a href={business.phoneHref}>{business.phone}</a><br />Toronto, GTA, Canada</p>
    </section>
    <nav className="legal-page-navigation" aria-label="Related information">
      <Link to={document === 'privacy' ? '/terms-and-conditions' : '/privacy-policy'}>{document === 'privacy' ? 'Terms & Conditions' : 'Privacy Policy'}</Link>
      <Link to="/contact">Contact Katrina</Link>
    </nav>
  </article>;
}
