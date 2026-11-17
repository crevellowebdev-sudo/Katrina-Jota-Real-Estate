import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useInquiryDraft } from '../context/InquiryContext';
import { business } from '../data/site';
import { submitInquiry, validateInquiry, type InquiryAdapter, type InquiryErrors, type InquiryValues } from '../lib/inquiry';

type FieldName = keyof InquiryValues;

export default function ContactForm({ adapter }: { adapter?: InquiryAdapter }) {
  const { draft, setDraft } = useInquiryDraft();
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const changeField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const name = event.target.name as FieldName;
    const next = { ...draft, [name]: event.target.value };
    setDraft(next);
    setStatus('');
    if (errors[name]) setErrors(previous => ({ ...previous, [name]: validateInquiry(next)[name] }));
  };

  const checkField = (name: FieldName) => setErrors(previous => ({ ...previous, [name]: validateInquiry(draft)[name] }));

  const focusFirstError = (nextErrors: InquiryErrors) => {
    const first = Object.keys(nextErrors)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    const result = await submitInquiry(draft, adapter);
    if (result.status === 'invalid') {
      setErrors(result.errors);
      focusFirstError(result.errors);
      setStatus('Please check the highlighted details.');
    } else setStatus(result.message);
    setSending(false);
  };

  const common = (name: FieldName) => ({
    id: `inquiry-${name}`, name, value: draft[name], onChange: changeField,
    onBlur: () => checkField(name),
    'aria-invalid': errors[name] ? true as const : undefined,
    'aria-describedby': errors[name] ? `inquiry-${name}-error` : undefined,
  });

  const error = (name: FieldName) => errors[name] ? <p className="field-error" id={`inquiry-${name}-error`} role="alert">{errors[name]}</p> : null;

  return <form className="contact-form" id="inquiry-form" ref={formRef} noValidate onSubmit={handleSubmit} aria-labelledby="inquiry-heading">
    <header className="contact-form-heading"><h2 id="inquiry-heading">Contact form</h2><span aria-hidden="true" className="contact-form-ornament" /></header>
    <p className="required-note">* Required fields</p>
    <div className="form-grid">
      <div className="form-field"><label htmlFor="inquiry-fullName">Full name *</label><input {...common('fullName')} type="text" autoComplete="name" placeholder="Your full name" required maxLength={120} />{error('fullName')}</div>
      <div className="form-field"><label htmlFor="inquiry-email">Email *</label><input {...common('email')} type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} />{error('email')}</div>
      <div className="form-field"><label htmlFor="inquiry-phone">Phone <span>(optional)</span></label><input {...common('phone')} type="tel" autoComplete="tel" placeholder="(416) 000-0000" maxLength={40} /></div>
      <div className="form-field">
        <label htmlFor="inquiry-status">Buying/selling status</label>
        <select {...common('status')}>
          <option value="">Select an option</option>
          <option>Looking to buy</option>
          <option>Looking to sell</option>
          <option>Both buying and selling</option>
        </select>
      </div>
      <div className="form-field"><label htmlFor="inquiry-area">Preferred area</label><input {...common('area')} type="text" autoComplete="address-level2" maxLength={200} /></div>
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
      <div className="form-field form-field--full"><label htmlFor="inquiry-message">Message</label><textarea {...common('message')} rows={4} maxLength={5000} /></div>
    </div>
    {!adapter && <p className="submission-notice" id="submission-notice">Online submission is not yet available. You're welcome to prepare and check your details here. To connect, please <a href={business.emailHref} target="_blank" rel="noopener noreferrer">email Katrina</a> or <a href={business.phoneHref}>call {business.phone}</a>.</p>}
    <div className="form-actions">
      <button type="submit" className="primary-button" disabled={sending} aria-busy={sending} aria-describedby={!adapter ? 'submission-notice' : undefined}><span>{sending ? 'Sending...' : 'Send Inquiry'}</span><ArrowUpRight size={17} aria-hidden="true" /></button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">{status && <p className="form-status">{status}</p>}</div>
    {!adapter && <p className="form-privacy">Your draft stays in this tab while you browse. No information is transmitted or saved to a server.</p>}
  </form>;
}
