export type InquiryValues = {
  fullName: string;
  email: string;
  phone: string;
  status: string;
  area: string;
  timeline: string;
  message: string;
  inquiryConsent: boolean;
  marketingConsent: boolean;
};

export type InquiryErrors = Partial<Record<keyof InquiryValues, string>>;
export type InquiryAdapter = (values: InquiryValues) => Promise<void>;

export const emptyInquiry: InquiryValues = { fullName: '', email: '', phone: '', status: '', area: '', timeline: '', message: '', inquiryConsent: false, marketingConsent: false };
export const inquiryFieldLimits = { fullName: 120, email: 254, phone: 40, status: 80, area: 200, timeline: 80, message: 5000 } as const;
export type InquiryTextField = keyof typeof inquiryFieldLimits;

export function validateInquiry(values: InquiryValues): InquiryErrors {
  const errors: InquiryErrors = {};
  if (!values.fullName.trim()) errors.fullName = 'Please enter your full name.';
  if (!values.email.trim()) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(values.email.trim())) errors.email = 'Please enter a valid email address, such as name@example.com.';
  if (!values.phone.trim()) errors.phone = 'Please enter your phone number.';
  // Canadian/US number: area code and subscriber number, optionally prefixed by 1.
  else if (!/^(?:\+?1[ .-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[ .-]?[2-9]\d{2}[ .-]?\d{4}$/.test(values.phone.trim())) {
    errors.phone = 'Please enter a valid 10-digit phone number, such as (416) 887-5670. An optional +1 country code is accepted.';
  }
  if (values.status.trim() && !['Looking to buy', 'Looking to sell', 'Both buying and selling'].includes(values.status.trim())) errors.status = 'Please select a buying/selling status from the list.';
  if (values.timeline.trim() && !['As soon as possible', 'Within 3 months', 'Within 6 months', 'More than 6 months'].includes(values.timeline.trim())) errors.timeline = 'Please select a timeline from the list.';
  for (const key of Object.keys(inquiryFieldLimits) as InquiryTextField[]) {
    if (values[key].length > inquiryFieldLimits[key]) errors[key] = `Please use ${inquiryFieldLimits[key]} characters or fewer.`;
    const controls = key === 'message' ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/ : /[\x00-\x1f\x7f-\x9f\u2028\u2029]/;
    if (controls.test(values[key]) || /[\uD800-\uDFFF]/u.test(values[key])) errors[key] = 'Please remove unsupported control characters.';
  }
  if (values.inquiryConsent !== true) errors.inquiryConsent = 'Please consent to the use of your information to respond to this inquiry.';
  if (typeof values.marketingConsent !== 'boolean') errors.marketingConsent = 'Please choose whether to receive marketing emails.';
  return errors;
}

// The adapter must resolve only after the sending service explicitly accepts the inquiry.
export async function submitInquiry(values: InquiryValues, adapter?: InquiryAdapter) {
  const errors = validateInquiry(values);
  if (Object.keys(errors).length) return { status: 'invalid' as const, errors };
  if (!adapter) return { status: 'unavailable' as const, message: 'Online submission is not yet available. Nothing has been sent. Please contact Katrina by email or phone.' };
  try {
    const normalized = { ...values };
    for (const key of Object.keys(inquiryFieldLimits) as InquiryTextField[]) normalized[key] = values[key].replace(/\r\n?/g, '\n').trim();
    await adapter(normalized);
    return { status: 'sent' as const, message: 'Your inquiry has been accepted for sending to Katrina.' };
  } catch (error) {
    if (error instanceof Error && error.name === 'InquirySetupError') {
      return { status: 'error' as const, message: error.message };
    }
    return { status: 'error' as const, message: 'We could not confirm your inquiry was accepted. Your details have been kept. Please try again or contact Katrina directly.' };
  }
}
