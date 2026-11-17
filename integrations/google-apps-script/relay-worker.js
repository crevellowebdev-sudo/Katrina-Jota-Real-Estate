/** Validate independently of the browser and only forward explicitly allowed fields. */
export function validateInquiryInput(input) {
  const limits = { fullName: 120, email: 254, phone: 40, status: 80, area: 200, timeline: 80, message: 5000 };
  const values = {};
  const errors = {};
  for (const [key, limit] of Object.entries(limits)) {
    const raw = input[key] === undefined ? '' : input[key];
    if (typeof raw !== 'string') { errors[key] = 'Please enter a text value.'; continue; }
    // Check raw length/characters before trimming so normalization cannot bypass limits.
    if (raw.length > limit) { errors[key] = `Please use ${limit} characters or fewer.`; continue; }
    const controls = key === 'message' ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/ : /[\x00-\x1f\x7f-\x9f\u2028\u2029]/;
    if (controls.test(raw) || /[\uD800-\uDFFF]/u.test(raw)) {
      errors[key] = 'Please remove unsupported control characters.'; continue;
    }
    values[key] = raw.replace(/\r\n?/g, '\n').trim();
  }
  if (!errors.fullName && !values.fullName) errors.fullName = 'Please enter your full name.';
  if (!errors.email && !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(values.email)) errors.email = 'Please enter a valid email address.';
  if (!errors.phone && !values.phone) errors.phone = 'Please enter your phone number.';
  else if (!errors.phone && !/^(?:\+?1[ .-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[ .-]?[2-9]\d{2}[ .-]?\d{4}$/.test(values.phone)) {
    errors.phone = 'Please enter a valid 10-digit phone number, such as (416) 887-5670. An optional +1 country code is accepted.';
  }
  if (!errors.status && values.status && !['Looking to buy', 'Looking to sell', 'Both buying and selling'].includes(values.status)) errors.status = 'Please select a buying/selling status from the list.';
  if (!errors.timeline && values.timeline && !['As soon as possible', 'Within 3 months', 'Within 6 months', 'More than 6 months'].includes(values.timeline)) errors.timeline = 'Please select a timeline from the list.';
  if (input.inquiryConsent !== true) errors.inquiryConsent = 'Please consent to the use of your information to respond to this inquiry.';
  if (input.marketingConsent !== undefined && typeof input.marketingConsent !== 'boolean') errors.marketingConsent = 'Please choose whether to receive marketing emails.';
  values.inquiryConsent = input.inquiryConsent === true;
  values.marketingConsent = input.marketingConsent === true;
  return { values, errors };
}

/** Optional Cloudflare Worker; also used by the Vercel and local API handlers. */
export default {
  async fetch(request, env) {
    const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if (new URL(request.url).pathname !== '/api/inquiry') return json({ ok: false }, 404);
    if (request.method !== 'POST') return json({ ok: false }, 405);
    if (!env.SITE_ORIGIN || request.headers.get('Origin') !== env.SITE_ORIGIN) return json({ ok: false }, 403);
    if (!env.INQUIRY_SECRET || env.INQUIRY_SECRET.length < 32 ||
        !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(env.APPS_SCRIPT_URL || '')) {
      return json({ ok: false }, 503);
    }
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({ ok: false, code: 'INVALID_REQUEST' }, 415);
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({ ok: false }, 400);
      const chunks = [];
      let length = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 14000) { await reader.cancel(); return json({ ok: false }, 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      let input;
      try {
        input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      } catch {
        return json({ ok: false, code: 'INVALID_REQUEST' }, 400);
      }
      if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ ok: false, code: 'INVALID_REQUEST' }, 400);
      if (input.website !== undefined && (typeof input.website !== 'string' || input.website !== '')) return json({ ok: false, code: 'INVALID_REQUEST' }, 400);
      const { values, errors } = validateInquiryInput(input);
      if (Object.keys(errors).length) return json({ ok: false, code: 'VALIDATION_ERROR', errors }, 400);
      let privacyPolicyUrl;
      try {
        const policy = new URL(env.PRIVACY_POLICY_URL);
        if (policy.protocol !== 'https:' || policy.username || policy.password || policy.href.length > 2048) throw new Error('Invalid policy');
        privacyPolicyUrl = policy.href;
      } catch { return json({ ok: false, code: 'CONSENT_UNAVAILABLE' }, 503); }
      // Visitor-supplied recipients, credentials, actions and extra fields are never forwarded.
      const payload = { ...values, privacyPolicyUrl, consentVersion: 'inquiry-consent-v1', secret: env.INQUIRY_SECRET };
      const sendToScript = body => fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
      });
      // Verify the deployed script's fixed recipient before sending visitor data.
      const checkResponse = await sendToScript({ secret: env.INQUIRY_SECRET, action: 'check' });
      if (!checkResponse.ok) return json({ ok: false, code: 'CONNECTION_FAILED' }, 502);
      const check = await checkResponse.json();
      if (check.code === 'UNAUTHORIZED') return json({ ok: false, code: 'UNAUTHORIZED' }, 503);
      if (check.ok !== true || check.recipient !== 'rozelramos17@gmail.com' || check.consentVersion !== 'inquiry-consent-v1') {
        return json({ ok: false, code: 'SCRIPT_UPDATE_REQUIRED' }, 503);
      }
      const response = await sendToScript(payload);
      if (!response.ok) return json({ ok: false, code: 'CONNECTION_FAILED' }, 502);
      const result = await response.json();
      if (result.ok !== true) {
        const code = ['VALIDATION_ERROR', 'UNAUTHORIZED', 'LIMIT_REACHED', 'BUSY', 'SEND_FAILED'].includes(result.code) ? result.code : 'SEND_FAILED';
        return json({ ok: false, code }, code === 'VALIDATION_ERROR' ? 400 : 503);
      }
      return json({ ok: true });
    } catch {
      return json({ ok: false, code: 'CONNECTION_FAILED' }, 502);
    }
  },
};
