import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import worker from '../integrations/google-apps-script/relay-worker.js';
import vercelHandler from '../api/inquiry.js';
import ts from 'typescript';

const secret = 'local-test-secret-'.repeat(3);
let properties;
let emails;
let quota;
let sendFails;
let visitorFails;
let locked;
const context = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({
    getProperty: key => properties.get(key) ?? null,
    setProperty: (key, value) => properties.set(key, value),
  }) },
  LockService: { getScriptLock: () => ({
    tryLock: () => { locked = true; return true; },
    hasLock: () => locked,
    releaseLock: () => { locked = false; },
  }) },
  MailApp: {
    getRemainingDailyQuota: () => quota,
    sendEmail: message => { if (sendFails || (visitorFails && message.to === sample.email)) throw new Error('Mock mail failure'); emails.push(message); },
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'sha256' },
    Charset: { UTF_8: 'utf8' },
    computeDigest: (_, value) => createHash('sha256').update(value).digest(),
    base64EncodeWebSafe: value => Buffer.from(value).toString('base64url'),
    base64Decode: value => Buffer.from(value, 'base64'),
    newBlob: (bytes, contentType, name) => ({ bytes, contentType, name }),
    formatDate: () => 'November 16, 2026, 9:00 AM EST (sample)',
  },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }),
  },
});
vm.runInContext(await fs.readFile('integrations/google-apps-script/Code.gs', 'utf8'), context);

const sample = {
  inquiryConsent: true, marketingConsent: false,
  privacyPolicyUrl: 'https://example.com/privacy', consentVersion: 'inquiry-consent-v1',
  submittedAt: '2026-11-16T14:00:00.000Z', // Preview fixture only; servers ignore browser-supplied timestamps.
  fullName: 'Sample Client (design preview)', email: 'sample@example.com', phone: '(416) 555-0100',
  status: 'Looking to buy', area: 'Toronto', timeline: 'Within 3 months',
  message: 'This is sample content for the email design preview.\nI would like to discuss my next move in the GTA.',
};
const reset = () => {
  properties = new Map([['INQUIRY_SECRET', secret]]);
  emails = []; quota = 100; sendFails = false; visitorFails = false; locked = false;
};
const post = overrides => context.doPost({ postData: { contents: JSON.stringify({ secret, ...sample, ...overrides }) } });
const phones = JSON.parse(await fs.readFile('scripts/fixtures/phone-validation.json', 'utf8'));
for (const inquiryConsent of [undefined, null, false, 'true', 1, {}]) {
  reset();
  assert.equal(post({ inquiryConsent }).code, 'VALIDATION_ERROR');
  assert.equal(emails.length, 0);
  assert.equal(properties.has('INQUIRY_SENDS'), false);
}
for (const marketingConsent of ['true', 'false', 1, 0, null, {}]) {
  reset();
  assert.equal(post({ marketingConsent }).code, 'VALIDATION_ERROR');
  assert.equal(emails.length, 0);
}
for (const privacyPolicyUrl of ['', undefined, 'javascript:alert(1)', 'https://example.com/"bad']) {
  reset();
  assert.equal(post({ privacyPolicyUrl }).code, 'VALIDATION_ERROR');
  assert.equal(emails.length, 0);
}
reset();
assert.equal(post({ consentVersion: 'unknown-version' }).code, 'VALIDATION_ERROR');
for (const marketingConsent of [undefined, false, true]) {
  reset();
  const before = Date.now();
  assert.equal(post({ marketingConsent, submittedAt: '2000-01-01T00:00:00.000Z' }).ok, true);
  const record = JSON.parse(properties.get('INQUIRY_SENDS'))[0].consent;
  assert.equal(record.inquiryConsent, true);
  assert.equal(record.marketingConsent, marketingConsent === true);
  assert.ok(emails[0].body.includes(sample.privacyPolicyUrl));
  assert.ok(emails[0].body.includes('inquiry-consent-v1'));
  assert.ok(Date.parse(record.submittedAt) >= before && Date.parse(record.submittedAt) <= Date.now());
  assert.ok(emails[0].body.includes(record.submittedAt));
  assert.ok(emails[0].htmlBody.includes(record.submittedAt));
  assert.ok(emails[0].body.includes(marketingConsent ? 'Opted in' : 'Not opted in'));
  assert.equal(post({ marketingConsent, submittedAt: '2099-01-01T00:00:00.000Z' }).duplicate, true);
  assert.equal(JSON.parse(properties.get('INQUIRY_SENDS'))[0].consent.submittedAt, record.submittedAt);
}
reset();
assert.equal(post({ marketingConsent: false }).ok, true);
assert.equal(post({ marketingConsent: true }).ok, true);
assert.equal(emails.length, 4, 'Changed consent choices must not be suppressed as duplicate inquiries');
const fieldLimits = { fullName: 120, email: 254, phone: 40, status: 80, area: 200, timeline: 80, message: 5000 };
const invalidFields = [];
for (const [key, limit] of Object.entries(fieldLimits)) {
  for (const value of [null, 123, false, [], {}, 'x'.repeat(limit + 1), ' '.repeat(limit + 1)]) invalidFields.push({ [key]: value });
  for (const control of ['\0', '\x7f', '\x85', '\ud800']) invalidFields.push({ [key]: `x${control}y` });
  if (key !== 'message') for (const control of ['\r', '\n', '\t', '\u2028', '\u2029']) invalidFields.push({ [key]: `${control}${sample[key]}` });
}
invalidFields.push({ status: 'Other' }, { timeline: 'Tomorrow' });
for (const invalid of invalidFields) {
  reset();
  assert.equal(post(invalid).code, 'VALIDATION_ERROR', `Apps Script rejects ${JSON.stringify(invalid).slice(0, 100)}`);
  assert.equal(emails.length, 0);
  assert.equal(properties.has('INQUIRY_SENDS'), false);
}
const boundaries = [
  { fullName: 'x'.repeat(120) }, { email: `${'a'.repeat(248)}@x.com` },
  { phone: `${' '.repeat(30)}4168875670` }, { area: 'x'.repeat(200) }, { message: 'x'.repeat(5000) },
  { fullName: "Zoë O'Connor 王", area: "King's Road", message: "First line\r\nSecond line\rThird line\t & < > \" ' 😀" },
];
for (const valid of boundaries) {
  reset();
  assert.equal(post(valid).ok, true, `Apps Script accepts boundary/Unicode ${Object.keys(valid)}`);
}
const normalized = context.validateInquiry_({ ...sample, fullName: '  Alex Morgan  ', area: '  Toronto  ', message: '  First\r\nSecond\rThird  ' });
assert.equal(normalized.fullName, 'Alex Morgan');
assert.equal(normalized.area, 'Toronto');
assert.equal(normalized.message, 'First\nSecond\nThird');
assert.equal(context.escapeHtml_('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
assert.equal(context.doPost({ postData: { contents: '{broken' } }).code, 'INVALID_REQUEST');
for (const { value, valid } of phones) {
  reset();
  assert.equal(post({ phone: value }).ok, valid, `Apps Script phone: ${JSON.stringify(value)}`);
  assert.equal(emails.length, valid ? 2 : 0);
}
for (const phone of [undefined, null, 4168875670, {}]) {
  reset();
  assert.equal(post({ phone }).code, 'VALIDATION_ERROR');
  assert.equal(emails.length, 0);
}
reset();
assert.equal(context.authorizeMail(), 100);
assert.equal(emails.length, 0);
assert.equal(context.doGet().code, 'POST_REQUIRED');
assert.equal(context.doPost().ok, false);
assert.equal(context.doPost({ postData: { contents: '{broken' } }).ok, false);
const connectionCheck = context.doPost({ postData: { contents: JSON.stringify({ secret, action: 'check' }) } });
assert.equal(connectionCheck.ok, true);
assert.equal(connectionCheck.recipient, 'rozelramos17@gmail.com');
assert.equal(emails.length, 0);
assert.equal(post({ secret: 'wrong' }).code, 'UNAUTHORIZED');
assert.equal(post({ website: 'bot-filled-value' }).ok, false);
for (const invalid of [
  { fullName: '' }, { fullName: 'x'.repeat(121) }, { email: 'bad-address' },
  { email: 'a@example.com\r\nBcc: other@example.com' }, { fullName: 'Name\nInjected' },
  { message: 'x'.repeat(5001) }, { status: 'Unapproved option' },
  { timeline: 'Tomorrow' }, { phone: {} }, { message: '\u0000' },
]) assert.equal(post(invalid).code, 'VALIDATION_ERROR');
assert.equal(emails.length, 0);

assert.equal(post({ to: 'attacker@example.com' }).ok, true);
assert.equal(emails.length, 2);
assert.equal(emails[0].to, 'rozelramos17@gmail.com');
assert.equal(emails[0].replyTo, sample.email);
assert.ok(emails[0].body.includes(sample.message));
assert.ok(emails[0].htmlBody.includes('mail.google.com/mail/?view=cm'));
assert.ok(emails[0].htmlBody.includes('#024D2C'));
assert.equal(emails[1].to, sample.email);
assert.equal(emails[1].replyTo, 'keysbykatrinaj@gmail.com');
assert.ok(emails[1].body.includes(sample.timeline));
assert.ok(emails[1].body.includes('not an appointment'));
for (const mail of emails) {
  assert.ok(mail.htmlBody.includes('cid:katrinaLogo'));
  assert.equal(mail.inlineImages.katrinaLogo.name, 'logo.png');
  assert.equal(mail.inlineImages.katrinaLogo.contentType, 'image/png');
  assert.equal(mail.inlineImages.katrinaLogo.bytes.subarray(1, 4).toString(), 'PNG');
}
assert.equal(locked, false);
assert.equal(post().duplicate, true);
assert.equal(emails.length, 2);
assert.ok(!properties.get('INQUIRY_SENDS').includes(sample.email));

reset();
const unsafe = '<script>alert("x")</script> & <img src=x onerror=alert(1)>';
assert.equal(post({ message: unsafe, fullName: 'Name <img src=x>' }).ok, true);
assert.ok(!emails[0].htmlBody.includes('<script>'));
assert.ok(!emails[0].htmlBody.includes('<img src=x'));
assert.ok(emails[0].htmlBody.includes('&lt;script&gt;'));
assert.ok(emails[0].body.includes(unsafe));
assert.ok(!emails[1].htmlBody.includes('<img src=x'));
assert.ok(emails[1].htmlBody.includes('&lt;img'));
reset();
const literal = '&lt;script&gt; & <img src=x onerror="alert(1)"> \'quoted\'';
assert.equal(post({ fullName: literal, area: literal, message: `${literal}\r\nNext line` }).ok, true);
for (const mail of emails) {
  assert.ok(mail.htmlBody.includes('&amp;lt;script&amp;gt; &amp; &lt;img'));
  assert.ok(!mail.htmlBody.includes('<img src=x'));
  assert.ok(mail.htmlBody.includes('&quot;alert(1)&quot;'));
  assert.ok(mail.htmlBody.includes('&#39;quoted&#39;'));
}
assert.ok(emails[0].htmlBody.includes('<br>Next line'));
assert.ok(emails[0].body.includes(literal), 'Plain text keeps literal text; HTML encoding belongs at the HTML output boundary');
reset();
assert.equal(post({ email: "o'connor&family@example.com" }).ok, true);
assert.ok(emails[0].htmlBody.includes('mailto:o&#39;connor%26family%40example.com'));
assert.ok(emails[0].htmlBody.includes('to=o&#39;connor%26family%40example.com'));
reset(); quota = 1;
assert.equal(post().code, 'LIMIT_REACHED');
assert.equal(emails.length, 0);
reset(); visitorFails = true;
assert.equal(post().code, 'SEND_FAILED');
assert.equal(emails.length, 1);
assert.equal(emails[0].to, 'rozelramos17@gmail.com');
visitorFails = false; quota = 1;
const originalConsentReceipt = JSON.parse(properties.get('INQUIRY_SENDS'))[0].consent;
assert.equal(post().ok, true);
assert.deepEqual(JSON.parse(properties.get('INQUIRY_SENDS'))[0].consent, originalConsentReceipt);
assert.equal(emails.length, 2);
assert.equal(emails[1].to, sample.email);
assert.equal(post().duplicate, true);
assert.equal(emails.length, 2);
reset(); quota = 0;
assert.equal(post().code, 'LIMIT_REACHED');
assert.equal(emails.length, 0);
reset(); sendFails = true;
assert.equal(post().code, 'SEND_FAILED');
assert.equal(locked, false);
assert.equal(properties.has('INQUIRY_SENDS'), false);
reset();
for (let index = 0; index < 30; index++) assert.equal(post({ message: `Different message ${index}` }).ok, true);
assert.equal(post({ message: 'Over the rolling limit' }).code, 'LIMIT_REACHED');
assert.equal(emails.length, 60);
assert.ok(Buffer.byteLength(properties.get('INQUIRY_SENDS'), 'utf8') < 9000, 'Thirty consent receipts must fit Apps Script per-property storage limits');

const env = { SITE_ORIGIN: 'https://example.com', PRIVACY_POLICY_URL: 'https://example.com/privacy', INQUIRY_SECRET: secret, APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test-deployment/exec' };
const request = (data = sample, origin = env.SITE_ORIGIN) => new Request('https://example.com/api/inquiry', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
});
const originalFetch = globalThis.fetch;
let upstream;
const mockGoogle = handler => async (url, options) => {
  assert.ok(String(url).startsWith('https://script.google.com/'), 'Only the configured email service should be contacted');
  return handler(url, options);
};
globalThis.fetch = mockGoogle(async (url, options) => {
  upstream = { url, payload: JSON.parse(options.body) };
  return Response.json({ ok: true, recipient: 'rozelramos17@gmail.com', consentVersion: 'inquiry-consent-v1' });
});
try {
  for (const invalid of [
    {inquiryConsent:undefined}, {inquiryConsent:false}, {inquiryConsent:'true'}, {inquiryConsent:1},
    {marketingConsent:'true'}, {marketingConsent:'false'}, {marketingConsent:null},
  ]) {
    upstream=undefined;
    const response=await worker.fetch(request({...sample,...invalid}),env);
    assert.equal(response.status,400);
    assert.equal((await response.json()).code,'VALIDATION_ERROR');
    assert.equal(upstream,undefined);
  }
  upstream=undefined;
  const missingPolicy=await worker.fetch(request(),{...env,PRIVACY_POLICY_URL:''});
  assert.equal(missingPolicy.status,503);
  assert.equal((await missingPolicy.json()).code,'CONSENT_UNAVAILABLE');
  assert.equal(upstream,undefined);
  for (const marketingConsent of [undefined,false,true]) {
    assert.equal((await worker.fetch(request({...sample,marketingConsent,privacyPolicyUrl:'https://attacker.example/policy',submittedAt:'2000-01-01T00:00:00Z'}),env)).status,200);
    assert.equal(upstream.payload.inquiryConsent,true);
    assert.equal(upstream.payload.marketingConsent,marketingConsent===true);
    assert.equal(upstream.payload.privacyPolicyUrl,env.PRIVACY_POLICY_URL);
    assert.equal(upstream.payload.consentVersion,'inquiry-consent-v1');
    assert.equal(upstream.payload.submittedAt,undefined);
  }
  for (const invalid of invalidFields) {
    upstream = undefined;
    const response = await worker.fetch(request({ ...sample, ...invalid }), env);
    assert.equal(response.status, 400, `Relay rejects ${JSON.stringify(invalid).slice(0,100)}`);
    assert.equal((await response.json()).code, 'VALIDATION_ERROR');
    assert.equal(upstream, undefined, 'Invalid data must be stopped before any upstream request');
  }
  for (const valid of boundaries) {
    assert.equal((await worker.fetch(request({ ...sample, ...valid }), env)).status, 200);
  }
  assert.equal((await worker.fetch(request({ ...sample, fullName: '  Alex Morgan  ', area: '  Toronto  ', message: '  First\r\nSecond\rThird  ', action: 'check' }), env)).status, 200);
  assert.equal(upstream.payload.fullName, 'Alex Morgan');
  assert.equal(upstream.payload.area, 'Toronto');
  assert.equal(upstream.payload.message, 'First\nSecond\nThird');
  assert.equal(upstream.payload.action, undefined);
  for (const body of ['{broken', 'null', '[]', 'true', '"text"', new Uint8Array([0xff])]) {
    upstream = undefined;
    const bad = new Request('https://example.com/api/inquiry', {method:'POST',headers:{Origin:env.SITE_ORIGIN,'Content-Type':'application/json'},body});
    const response = await worker.fetch(bad, env);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'INVALID_REQUEST');
    assert.equal(upstream, undefined);
  }
  for (const website of ['filled', ' ', 0, null, {}]) {
    upstream = undefined;
    assert.equal((await worker.fetch(request({ ...sample, website }), env)).status, 400);
    assert.equal(upstream, undefined);
  }
  assert.equal((await worker.fetch(new Request('https://example.com/api/inquiry', {method:'POST',headers:{Origin:env.SITE_ORIGIN,'Content-Type':'application/json-untrusted'},body:JSON.stringify(sample)}), env)).status, 415);
  for (const { value, valid } of phones) {
    upstream = undefined;
    const response = await worker.fetch(request({ ...sample, phone: value }), env);
    assert.equal(response.status, valid ? 200 : 400, `Relay phone: ${JSON.stringify(value)}`);
    if (!valid) {
      assert.equal(upstream, undefined, 'Invalid phone must not contact Google');
      const result = await response.json();
      assert.equal(result.code, 'VALIDATION_ERROR');
      assert.ok(result.errors.phone);
    }
  }
  for (const invalid of [{ phone: undefined }, { phone: null }, { phone: 4168875670 }, { fullName: '' }, { email: '' }]) {
    upstream = undefined;
    assert.equal((await worker.fetch(request({ ...sample, ...invalid }), env)).status, 400);
    assert.equal(upstream, undefined);
  }
  assert.equal((await worker.fetch(request(), env)).status, 200);
  assert.equal(upstream.payload.secret, secret);
  assert.equal(upstream.payload.email, sample.email);
  assert.equal((await worker.fetch(request({ ...sample, secret: 'attacker', to: 'attacker@example.com' }), env)).status, 200);
  assert.equal(upstream.payload.secret, secret);
  assert.equal(upstream.payload.to, undefined);
  let checksOnly = 0;
  globalThis.fetch = mockGoogle(async () => { checksOnly++; return Response.json({ ok: true, recipient: 'old-inbox@example.com' }); });
  const wrongRecipient = await worker.fetch(request(), env);
  assert.equal(wrongRecipient.status, 503);
  assert.equal((await wrongRecipient.json()).code, 'SCRIPT_UPDATE_REQUIRED');
  assert.equal(checksOnly, 1);
  globalThis.fetch = mockGoogle(async () => Response.json({ok:true,recipient:'rozelramos17@gmail.com'}));
  const outdated=await worker.fetch(request(),env);
  assert.equal(outdated.status,503);
  assert.equal((await outdated.json()).code,'SCRIPT_UPDATE_REQUIRED');
  assert.equal((await worker.fetch(request(sample, 'https://other.example'), env)).status, 403);
  assert.equal((await worker.fetch(request(), { ...env, INQUIRY_SECRET: '' })).status, 503);
  assert.equal((await worker.fetch(request({ message: 'x'.repeat(15000) }), env)).status, 413);
  globalThis.fetch = mockGoogle(async () => Response.json({ ok: false, code: 'SEND_FAILED' }));
  assert.equal((await worker.fetch(request(), env)).status, 503);
  globalThis.fetch = mockGoogle(async () => new Response('<html>Google sign-in</html>'));
  assert.equal((await worker.fetch(request(), env)).status, 502);
  globalThis.fetch = mockGoogle(async () => { throw new Error('Timeout'); });
  assert.equal((await worker.fetch(request(), env)).status, 502);
} finally {
  globalThis.fetch = originalFetch;
}

// Exercise the actual Vercel wrapper without contacting Google.
const previousSecret = process.env.INQUIRY_SECRET;
const previousScript = process.env.APPS_SCRIPT_URL;
const previousPolicy = process.env.VITE_PRIVACY_POLICY_URL;
const previousSiteUrl = process.env.VITE_SITE_URL;
try {
  delete process.env.VITE_SITE_URL;
  delete process.env.INQUIRY_SECRET;
  delete process.env.APPS_SCRIPT_URL;
  const readinessRequest = () => new Request('https://example.com/api/inquiry');
  assert.equal((await (await vercelHandler.fetch(readinessRequest())).json()).available, false);
  assert.equal((await vercelHandler.fetch(request())).status, 503);
  process.env.INQUIRY_SECRET = secret;
  process.env.VITE_PRIVACY_POLICY_URL = env.PRIVACY_POLICY_URL;
  assert.equal((await (await vercelHandler.fetch(readinessRequest())).json()).available, true);
  globalThis.fetch = mockGoogle(async (url, options) => {
    assert.equal(url, 'https://script.google.com/macros/s/AKfycbyNYW7RZ1_eDUVDzsD5KGKi10SsBeoIq4jB2K0tAaLn8B-QKQA3D4tQCODMvNQqxE0jKQ/exec');
    assert.equal(JSON.parse(options.body).secret, secret);
    return Response.json({ ok: true, recipient: 'rozelramos17@gmail.com', consentVersion: 'inquiry-consent-v1' });
  });
  assert.equal((await vercelHandler.fetch(request())).status, 200);
  assert.equal((await vercelHandler.fetch(request(sample, 'https://other.example'))).status, 403);
  // A public Vercel alias can differ from the URL seen by the function.
  process.env.VITE_SITE_URL = 'https://example.com/';
  const proxiedRequest = origin => new Request('https://internal-deployment.vercel.app/api/inquiry', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(sample),
  });
  assert.equal((await vercelHandler.fetch(proxiedRequest('https://example.com'))).status, 200);
  assert.equal((await vercelHandler.fetch(proxiedRequest('https://other.example'))).status, 403);
  process.env.VITE_SITE_URL = 'invalid-url';
  assert.equal((await vercelHandler.fetch(proxiedRequest('https://example.com'))).status, 403);
  assert.equal((await (await vercelHandler.fetch(readinessRequest())).json()).available, false);
  delete process.env.VITE_SITE_URL;
  globalThis.fetch = mockGoogle(async () => Response.json({ ok: false, code: 'UNAUTHORIZED' }));
  assert.equal((await vercelHandler.fetch(request())).status, 503);
} finally {
  if (previousSecret === undefined) delete process.env.INQUIRY_SECRET;
  else process.env.INQUIRY_SECRET = previousSecret;
  if (previousScript === undefined) delete process.env.APPS_SCRIPT_URL;
  else process.env.APPS_SCRIPT_URL = previousScript;
  if (previousPolicy === undefined) delete process.env.VITE_PRIVACY_POLICY_URL;
  else process.env.VITE_PRIVACY_POLICY_URL = previousPolicy;
  if (previousSiteUrl === undefined) delete process.env.VITE_SITE_URL;
  else process.env.VITE_SITE_URL = previousSiteUrl;
  globalThis.fetch = originalFetch;
}

const deliverySource = await fs.readFile('src/lib/inquiryDelivery.ts', 'utf8');
const compiledDelivery = ts.transpileModule(deliverySource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const delivery = await import(`data:text/javascript;base64,${Buffer.from(compiledDelivery).toString('base64')}`);
try {
  globalThis.fetch = async () => Response.json({ available: true });
  assert.equal(await delivery.isInquiryDeliveryConfigured(new AbortController().signal), true);
  globalThis.fetch = async () => new Response('<html>Vite fallback</html>');
  assert.equal(await delivery.isInquiryDeliveryConfigured(new AbortController().signal), false);
  for (const response of [Response.json({ ok: false }), new Response('<html>Error</html>'), Response.json({ ok: true }, { status: 500 })]) {
    globalThis.fetch = async () => response;
    await assert.rejects(delivery.sendInquiry(sample));
  }
  for (const code of ['CONSENT_UNAVAILABLE']) {
    globalThis.fetch = async () => Response.json({ok:false,code}, {status:400});
    await assert.rejects(delivery.sendInquiry(sample), {name:'InquirySetupError'});
  }
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/inquiry');
    assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).email, sample.email);
    assert.equal(JSON.parse(options.body).secret, undefined);
    assert.equal(JSON.parse(options.body).recaptchaToken, undefined);
    return Response.json({ ok: true, recipient: 'rozelramos17@gmail.com', consentVersion: 'inquiry-consent-v1' });
  };
  await delivery.sendInquiry(sample);
} finally {
  globalThis.fetch = originalFetch;
}

const preview = context.renderInquiryEmail_(sample, 'November 16, 2026, 9:00 AM EST (sample)', 'https://preview.invalid/logo.png')
  .replace('https://preview.invalid/logo.png', '../../public/images/logo.png');
await fs.writeFile('integrations/google-apps-script/email-preview.html', preview);
await fs.writeFile('integrations/google-apps-script/visitor-email-preview.html', context.renderVisitorEmail_(sample, 'https://preview.invalid/logo.png').replace('https://preview.invalid/logo.png', '../../public/images/logo.png'));
console.log('Apps Script, relay, Vercel handler, and browser adapter checks passed. No email sent. Local email preview regenerated.');
