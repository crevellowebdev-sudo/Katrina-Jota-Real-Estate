import { Check } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { PrimaryButton } from '../components/ui';
import { useInquiryDraft } from '../context/InquiryContext';

export default function ThankYou() {
  const { inquiryAccepted } = useInquiryDraft();
  // A direct visit or refresh must not imply that an inquiry was submitted.
  if (!inquiryAccepted) return <Navigate to="/contact" replace />;

  return <section className="container thank-you-page" aria-labelledby="thank-you-heading">
    <div className="thank-you-content">
      <span className="thank-you-mark" aria-hidden="true"><Check size={30} strokeWidth={1.25} /></span>
      <h1 id="thank-you-heading">Thank you.</h1>
      <p>Your inquiry has been accepted for sending to Katrina.</p>
      <PrimaryButton to="/">Return Home</PrimaryButton>
    </div>
  </section>;
}
