import type { InquiryAdapter } from './inquiry';

export const sendInquiry: InquiryAdapter = async (values) => {
  const response = await fetch('/api/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    if (result.code === 'CONSENT_UNAVAILABLE') {
      const error = new Error('The Privacy Policy is currently unavailable. Please contact Katrina directly.');
      error.name = 'InquirySetupError';
      throw error;
    }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(globalThis.location?.hostname);
    const setupMessages: Record<string, string> = {
      SCRIPT_UPDATE_REQUIRED: 'Update and redeploy Google Apps Script with the latest Code.gs so inquiry emails and consent records can be saved. Your inquiry has not been sent.',
      UNAUTHORIZED: 'The local INQUIRY_SECRET does not match the deployed Google Apps Script property. Your inquiry has not been sent.',
    };
    if (local && setupMessages[result.code]) {
      const error = new Error(setupMessages[result.code]);
      error.name = 'InquirySetupError';
      throw error;
    }
    throw new Error('Inquiry acceptance was not confirmed');
  }
};

export async function isInquiryDeliveryConfigured(signal: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch('/api/inquiry', { signal, cache: 'no-store' });
    if (!response.ok) return false;
    const result = await response.json();
    return result.available === true;
  } catch {
    return false;
  }
}
