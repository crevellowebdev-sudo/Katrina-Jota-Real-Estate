import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useInquiryDraft } from '../context/InquiryContext';
import { business } from '../data/site';
import { privacyPolicyUrl } from '../lib/privacy';
import { emptyInquiry, inquiryFieldLimits, submitInquiry, validateInquiry, type InquiryAdapter, type InquiryErrors, type InquiryTextField, type InquiryValues } from '../lib/inquiry';

type FieldName = keyof InquiryValues;

export default function ContactForm({ adapter }: { adapter?: InquiryAdapter }) {
  const { draft, setDraft, setInquiryAccepted } = useInquiryDraft();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const changeField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const name = event.target.name as InquiryTextField;
    const next = { ...draft, [name]: event.target.value };
    setDraft(next);
    setStatus('');
    if (errors[name]) setErrors(previous => ({ ...previous, [name]: validateInquiry(next)[name] }));
  };

  const checkField = (name: FieldName) => setErrors(previous => ({ ...previous, [name]: validateInquiry(draft)[name] }));
  const changeConsent = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as 'inquiryConsent' | 'marketingConsent';
    const next = { ...draft, [name]: event.target.checked };
    setDraft(next);
    setStatus('');
    if (errors[name]) setErrors(previous => ({ ...previous, [name]: validateInquiry(next)[name] }));
  };

  const focusFirstError = (nextErrors: InquiryErrors) => {
    const first = Object.keys(nextErrors)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (!privacyPolicyUrl) {
      setStatus('The Privacy Policy is currently unavailable. Please contact Katrina directly.');
      return;
    }
    const nextErrors = validateInquiry(draft);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      setStatus('Please check the highlighted details.');
      return;
    }
    setSending(true);
    const result = await submitInquiry(draft, adapter);
    if (result.status === 'invalid') {
      setErrors(result.errors);
      focusFirstError(result.errors);
      setStatus('Please check the highlighted details.');
    } else if (result.status === 'sent') {
      setInquiryAccepted(true);
      // Preserve any edits made while the accepted inquiry was being sent.
      setDraft(current => current === draft ? emptyInquiry : current);
      navigate('/thank-you', { replace: true });
    } else setStatus(result.message);
    setSending(false);
  };

  const common = (name: InquiryTextField) => ({
    id: `inquiry-${name}`, name, value: draft[name], onChange: changeField,
    onBlur: () => checkField(name),
    'aria-invalid': errors[name] ? true as const : undefined,
    'aria-describedby': errors[name] ? `inquiry-${name}-error` : undefined,
  });

  const error = (name: FieldName) => errors[name] ? <p className="field-error" id={`inquiry-${name}-error`} role="alert">{errors[name]}</p> : null;

  return <form className="contact-form" id="inquiry-form" ref={formRef} noValidate onSubmit={handleSubmit} aria-labelledby="inquiry-heading">
    <header className="contact-form-heading"><h2 id="inquiry-heading">Contact form</h2><span aria-hidden="true" className="contact-form-ornament" /></header>
    <p className="required-note"><span className="required-marker">*</span> Required fields</p>
    <div className="form-grid">
      <div className="form-field"><label htmlFor="inquiry-fullName">Full name <span className="required-marker">*</span></label><input {...common('fullName')} type="text" autoComplete="name" placeholder="Your full name" required maxLength={inquiryFieldLimits.fullName} />{error('fullName')}</div>
      <div className="form-field"><label htmlFor="inquiry-email">Email <span className="required-marker">*</span></label><input {...common('email')} type="email" autoComplete="email" placeholder="you@example.com" required maxLength={inquiryFieldLimits.email} />{error('email')}</div>
      <div className="form-field"><label htmlFor="inquiry-phone">Phone <span className="required-marker">*</span></label><input {...common('phone')} type="tel" autoComplete="tel" inputMode="tel" placeholder="(416) 887-5670" required maxLength={inquiryFieldLimits.phone} />{error('phone')}</div>
      <div className="form-field">
        <label htmlFor="inquiry-status">Buying/selling status</label>
        <select {...common('status')}>
          <option value="">Select an option</option>
          <option>Looking to buy</option>
          <option>Looking to sell</option>
          <option>Both buying and selling</option>
        </select>
      </div>
      <div className="form-field"><label htmlFor="inquiry-area">Preferred area</label><input {...common('area')} type="text" autoComplete="address-level2" maxLength={inquiryFieldLimits.area} /></div>
      <div className="form-field">
        <label htmlFor="inquiry-timeline">Timeline</label>
        <select {...common('timeline')}>
          <option value="">Select your timeline</option>
          <option>As soon as possible</option>
          <option>Within 3 months</option>
          <option>Within 6 months</option>
          <option>More than 6 months</option>
        </select>
      </div>
      <div className="form-field form-field--full"><label htmlFor="inquiry-message">Message</label><textarea {...common('message')} rows={4} maxLength={inquiryFieldLimits.message} /></div>
    </div>
    <fieldset className="form-consent">
      <legend>Privacy and consent</legend>
      <div className="consent-option">
        <label htmlFor="inquiry-inquiryConsent"><input id="inquiry-inquiryConsent" name="inquiryConsent" type="checkbox" checked={draft.inquiryConsent} onChange={changeConsent} onBlur={() => checkField('inquiryConsent')} required disabled={!privacyPolicyUrl} aria-invalid={errors.inquiryConsent ? true : undefined} aria-describedby={errors.inquiryConsent ? 'inquiry-consent-policy inquiry-inquiryConsent-error' : 'inquiry-consent-policy'} /><span>I consent to Katrina Jota Real Estate using my information to respond to this inquiry. <span className="required-marker">*</span></span></label>
        <p id="inquiry-consent-policy">{privacyPolicyUrl ? <>Read the <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">Privacy Policy</a> for information about how your personal information is handled.</> : <>A <Link to="/privacy-policy">Privacy Policy</Link> draft is available for review. Approval is pending; please contact Katrina directly until the final policy is available.</>}</p>
        {error('inquiryConsent')}
      </div>
      <div className="consent-option">
        <label htmlFor="inquiry-marketingConsent"><input id="inquiry-marketingConsent" name="marketingConsent" type="checkbox" checked={draft.marketingConsent} onChange={changeConsent} aria-invalid={errors.marketingConsent ? true : undefined} aria-describedby="inquiry-marketing-note" /><span>I would also like to receive real estate news and marketing emails from Katrina Jota Real Estate. (Optional)</span></label>
        <p id="inquiry-marketing-note">You can submit an inquiry without agreeing to marketing emails.</p>
        {error('marketingConsent')}
      </div>
    </fieldset>
    <p className="form-legal">Read the <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> and <Link to="/privacy-policy">Privacy Policy</Link>. The on-site legal pages are drafts awaiting client approval.</p>
    {!adapter && <p className="submission-notice" id="submission-notice">Online submission is not yet available. You're welcome to prepare and check your details here. To connect, please <a href={business.emailHref} target="_blank" rel="noopener noreferrer">email Katrina</a> or <a href={business.phoneHref}>call {business.phone}</a>.</p>}
    <div className="form-actions">
      <button type="submit" className="primary-button" disabled={sending || !privacyPolicyUrl} aria-busy={sending} aria-describedby={!adapter ? 'submission-notice' : undefined}><span>{sending ? 'Sending...' : 'Send Inquiry'}</span><ArrowUpRight size={17} aria-hidden="true" /></button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">{status && <p className="form-status">{status}</p>}</div>
    {!adapter && <p className="form-privacy">Your draft stays in this tab while you browse. No information is transmitted or saved to a server.</p>}
  </form>;
}
