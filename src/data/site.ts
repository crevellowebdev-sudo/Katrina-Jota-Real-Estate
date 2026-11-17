export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'For Sellers', to: '/for-sellers' },
  { label: 'For Buyers', to: '/for-buyers' },
  { label: 'Contact', to: '/contact' },
] as const;

const contactEmail = 'keysbykatrinaj@gmail.com';

export const business = {
  name: 'Katrina Jota Real Estate',
  email: contactEmail,
  emailHref: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`,
  phone: '(416) 887-5670',
  phoneHref: 'tel:+14168875670',
  location: 'Toronto, Greater Toronto Area, Ontario, Canada',
  // Add only client-approved brokerage and regulatory disclosures here.
  regulatoryDisclosure: '',
};

export const pageMetadata: Record<string, { title: string; description: string }> = {
  '/privacy-policy': {
    title: 'Privacy Policy | Katrina Jota Real Estate',
    description: 'Privacy Policy draft for client review, describing the website inquiry and consent process.',
  },
  '/terms-and-conditions': {
    title: 'Terms & Conditions | Katrina Jota Real Estate',
    description: 'Terms & Conditions draft for client review for the Katrina Jota Real Estate website.',
  },
  '/thank-you': {
    title: 'Thank You | Katrina Jota Real Estate',
    description: 'Thank you for starting a conversation with Katrina Jota Real Estate.',
  },
  '/': {
    title: 'Toronto & GTA Real Estate | Katrina Jota',
    description: 'Personal real estate guidance for buyers and sellers in Toronto and the Greater Toronto Area. Book a free consultation with Katrina Jota.',
  },
  '/about': {
    title: 'About Katrina Jota | Toronto & GTA Real Estate',
    description: 'Meet Katrina Jota and explore her personal approach to buying and selling real estate in Toronto and the Greater Toronto Area.',
  },
  '/for-sellers': {
    title: 'Sell Your Home in Toronto & GTA | Katrina Jota',
    description: 'Explore Katrina Jota’s selling process, from market analysis and staging to negotiation and closing. Request a free evaluation for your GTA home.',
  },
  '/for-buyers': {
    title: 'Buy a Home in Toronto & GTA | Katrina Jota',
    description: 'Navigate your Toronto or GTA home search with Katrina Jota, from the initial consultation and market analysis to offers, negotiation, and closing.',
  },
  '/contact': {
    title: 'Contact Katrina Jota | Toronto & GTA Real Estate',
    description: 'Contact Katrina Jota to discuss buying or selling a home in Toronto and the GTA. Call (416) 887-5670 or book a free consultation.',
  },
};

export type ProcessStep = { title: string; description: string };

export const sellingSteps: ProcessStep[] = [
  { title: 'Market Analysis', description: 'We conduct a comprehensive evaluation of the local market to identify the optimal listing price and timing for maximum exposure.' },
  { title: 'Staging & Marketing', description: 'Our team utilizes high-end staging and digital marketing strategies to ensure your property stands out in the GTA real estate landscape.' },
  { title: 'Expert Negotiation', description: 'Utilizing my 15+ years of corporate experience, I navigate complex negotiations to secure the best possible return for your investment.' },
  { title: 'Strategic Closing', description: 'From coordinating inspections to finalizing the paperwork, I provide a seamless and authoritative closing experience for you and your family.' },
];

export const buyingSteps: ProcessStep[] = [
  { title: 'Initial Consultation', description: 'We begin with a warm, one-on-one discussion to understand your lifestyle, budget, and timeline for your new home.' },
  { title: 'Market Analysis', description: 'Using my 15+ years of corporate experience, I provide a detailed analysis of the GTA market to identify your best opportunities.' },
  { title: 'Property Search', description: 'We curate a list of properties that match your specific criteria, ensuring every listing is vetted for quality and value.' },
  { title: 'Offer & Negotiation', description: 'Working with you to craft a competitive offer and navigating the negotiation process to secure the best possible deal.' },
  { title: 'Finalization', description: 'Completing the paperwork, inspections, and closing to ensure a seamless transition into your new home.' },
];

export const expertise = [
  { title: 'Professional Licensing', description: 'As a licensed real estate agent, I am committed to providing the highest level of professional service and market knowledge to every client in the GTA.' },
  { title: 'Corporate Real Estate', description: 'My background in corporate real estate provides a unique perspective on commercial properties, ensuring that both buyers and sellers receive expert guidance.' },
  { title: 'Market Insights', description: 'With deep knowledge of the Toronto and GTA market, I provide data-driven insights and personalized strategies to help you navigate the property landscape.' },
  { title: 'Personal Approach', description: 'I believe in a warm, personal atmosphere that builds trust and ensures every transaction is handled with the same care and attention to detail as a personal relationship.' },
];
