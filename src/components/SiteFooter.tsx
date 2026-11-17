import { useLocation } from 'react-router-dom';
import { business, navigation } from '../data/site';
import { BrandWordmark } from './SiteHeader';
import WordmarkRevealFooter from './wordmark-reveal-footer';

export default function SiteFooter() {
  const { pathname } = useLocation();
  return <WordmarkRevealFooter
    key={pathname}
    className="editorial-footer"
    wordmark="KATRINA JOTA"
    brand={{ name: 'Katrina Jota Real Estate.', mark: <BrandWordmark footer />, blurb: 'Based in Toronto, GTA' }}
    columns={[
      { title: 'EXPLORE', links: navigation.map(item => ({ label: item.label, href: item.to })) },
      { title: 'Contact details', links: [
        { label: business.email, href: business.emailHref },
        { label: business.phone, href: business.phoneHref },
      ] },
    ]}
    reveal="inView"
    reflection
  >
    {business.regulatoryDisclosure && <p className="footer-disclosure">{business.regulatoryDisclosure}</p>}
  </WordmarkRevealFooter>;
}
