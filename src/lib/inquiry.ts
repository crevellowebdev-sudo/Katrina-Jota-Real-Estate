export type InquiryValues = {
  fullName: string;
  email: string;
  phone: string;
  status: string;
  area: string;
  timeline: string;
  message: string;
};

export type InquiryErrors = Partial<Record<keyof InquiryValues, string>>;
export type InquiryAdapter = (values: InquiryValues) => Promise<void>;

export const emptyInquiry: InquiryValues = { fullName: '', email: '', phone: '', status: '', area: '', timeline: '', message: '' };

export function validateInquiry(values: InquiryValues): InquiryErrors {
  const errors: InquiryErrors = {};
  if (!values.fullName.trim()) errors.fullName = 'Please enter your full name.';
  if (!values.email.trim()) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Please enter a valid email address, such as name@example.com.';
  return errors;
}

// The adapter must resolve only after the sending service explicitly accepts the inquiry.
export async function submitInquiry(values: InquiryValues, adapter?: InquiryAdapter) {
  const errors = validateInquiry(values);
  if (Object.keys(errors).length) return { status: 'invalid' as const, errors };
  if (!adapter) return { status: 'unavailable' as const, message: 'Online submission is not yet available. Nothing has been sent. Please contact Katrina by email or phone.' };
  try {
    await adapter({ ...values, fullName: values.fullName.trim(), email: values.email.trim() });
    return { status: 'sent' as const, message: 'Your inquiry has been accepted for sending to Katrina.' };
  } catch (error) {
    if (error instanceof Error && error.name === 'InquirySetupError') {
      return { status: 'error' as const, message: error.message };
    }
    return { status: 'error' as const, message: 'We could not confirm your inquiry was accepted. Your details have been kept. Please try again or contact Katrina directly.' };
  }
}
