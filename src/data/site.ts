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
  '/thank-you': {
    title: 'Thank You | Katrina Jota Real Estate',
    description: 'Thank you for starting a conversation with Katrina Jota Real Estate.',
  },
  '/': {
    title: 'Refined Real Estate | Katrina Jota Real Estate',
    description: "Expert guidance for the GTA's most discerning buyers and sellers. I provide a personal, warm approach to real estate, ensuring your journey is as seamless as your home.",
  },
  '/about': {
    title: 'The Katrina Jota Story | Toronto & GTA Real Estate',
    description: 'Katrina’s journey in real estate began with a deep-rooted passion for the Toronto landscape. Her career spans over 15 years in the corporate world, where she honed her analytical skills and strategic vision.',
  },
  '/for-sellers': {
    title: 'For Sellers | Katrina Jota Real Estate',
    description: 'Transforming your property into a high-value asset through a refined and strategic approach.',
  },
  '/for-buyers': {
    title: 'For Buyers | Katrina Jota Real Estate',
    description: 'A clear, professional, and personalized roadmap designed to guide you through every step of your home search and purchase journey.',
  },
  '/contact': {
    title: 'Contact | Katrina Jota Real Estate',
    description: "Whether you are looking to buy, sell, or simply explore the GTA market, I am here to guide you every step of the way. Let's start a conversation.",
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
