export type LegalDocument = {
  title: string;
  introduction: string;
  sections: { title: string; paragraphs: string[] }[];
};

// Review drafts only. Client approval is required before these become published policies.
export const legalDocuments: Record<'privacy' | 'terms', LegalDocument> = {
  privacy: {
    title: 'Privacy Policy',
    introduction: 'This draft describes how the current Katrina Jota Real Estate website handles information submitted through its contact form.',
    sections: [
      { title: 'Information you provide', paragraphs: [
        'The contact form asks for your full name, email address, phone number, buying or selling status, preferred area, timeline, and message. Your name, email address, phone number, and consent to inquiry processing are required. The remaining inquiry fields and marketing consent are optional.',
        'Please provide only information relevant to your inquiry. Do not include payment details, identification documents, or other sensitive records in your message.',
      ] },
      { title: 'Inquiry processing and marketing choices', paragraphs: [
        'Inquiry-processing consent allows Katrina Jota Real Estate to use your submitted information to respond to your request. Marketing consent is requested separately and starts unchecked. You can submit an inquiry without choosing to receive marketing emails.',
        'The submission records your consent choices and a server-generated submission timestamp. Selecting marketing consent records your preference; the current website does not automatically enrol you in a mailing service.',
      ] },
      { title: 'How the website handles your submission', paragraphs: [
        'Your draft is held in the current browser tab while you navigate the website. The website does not save the draft to browser local storage. When you submit the form, the configured website server and Google email services process the information to send an inquiry notification and an acknowledgment.',
        'Inquiry notifications include your submitted information, consent choices, submission timestamp, and the policy reference used for that submission. The form displays an error if it cannot confirm acceptance for sending. Acceptance does not guarantee inbox delivery.',
      ] },
      { title: 'Retention and service-provider details', paragraphs: [
        'Inquiry information and consent records appear in the notification emails. A separate duplicate-prevention record covers a rolling 24-hour window and is refreshed during later submissions; it contains an inquiry hash, consent choices, a timestamp, and delivery status rather than the message or contact details.',
        'Before this draft is approved, the client must confirm email-retention and deletion practices, hosting and email-provider arrangements, any international processing, and any additional cookies or analytics used on the deployed website.',
      ] },
      { title: 'Privacy questions', paragraphs: [
        'Contact Katrina Jota Real Estate using the email or phone details below with questions about information you have submitted, or to request an update to your marketing preference. The final policy must confirm the business process for handling privacy requests.',
      ] },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    introduction: 'These draft terms describe the intended use of the Katrina Jota Real Estate website and its inquiry form.',
    sections: [
      { title: 'About this website', paragraphs: [
        'This website introduces Katrina Jota Real Estate and provides information for buyers and sellers in Toronto and the Greater Toronto Area. It offers a way to request a conversation about your real estate needs.',
        'The website does not provide an automated property valuation, a live property-listing service, or a completed real estate transaction.',
      ] },
      { title: 'Website information and imagery', paragraphs: [
        'General website information should be discussed directly with Katrina in relation to your circumstances. Request current, property-specific information before making a buying or selling decision.',
        'Architectural and residential photographs used to illustrate the website are not offers of properties for sale. Images alone do not establish property availability or transaction details.',
      ] },
      { title: 'Inquiries and appointments', paragraphs: [
        'Submit accurate contact details and information relevant to your inquiry. Do not use the form for spam, impersonation, harmful content, or attempts to interfere with the website.',
        'Submitting an inquiry does not confirm an appointment, valuation, offer, or transaction. Any consultation date and time must be arranged directly with Katrina. An acknowledgment confirms acceptance for sending and does not guarantee email delivery.',
      ] },
      { title: 'Privacy and optional marketing', paragraphs: [
        'The form asks for consent to use your information to respond to your inquiry. Optional marketing consent is separate and is not required to submit an inquiry. Read the Privacy Policy alongside these terms for information about the current submission process.',
      ] },
      { title: 'External services and final review', paragraphs: [
        'Some links open external services, such as Gmail. Those services are provided separately and have their own terms and privacy information.',
        'Before publication as binding terms, the client must approve the business identity, content permissions, applicable legal provisions, and any service-specific conditions. No effective date has been assigned to this draft.',
      ] },
    ],
  },
};
