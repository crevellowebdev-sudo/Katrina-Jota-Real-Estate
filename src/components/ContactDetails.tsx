import { ArrowUpRight } from 'lucide-react';
import { business } from '../data/site';

export default function ContactDetails() {
  return <address className="contact-details">
    <div><span className="detail-label">Email</span><a href={business.emailHref} target="_blank" rel="noopener noreferrer"><span>{business.email}</span><ArrowUpRight size={18} aria-hidden="true" /></a></div>
    <div><span className="detail-label">Phone</span><a href={business.phoneHref}><span>{business.phone}</span><ArrowUpRight size={18} aria-hidden="true" /></a></div>
    <div><p>Based in Toronto, GTA</p></div>
  </address>;
}
