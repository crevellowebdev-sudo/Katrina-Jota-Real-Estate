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
  fullName: 'Sample Client (design preview)', email: 'sample@example.com', phone: '(416) 555-0100',
  status: 'Looking to buy', area: 'Toronto', timeline: 'Within 3 months',
  message: 'This is sample content for the email design preview.\nI would like to discuss my next move in the GTA.',
};
const reset = () => {
  properties = new Map([['INQUIRY_SECRET', secret]]);
  emails = []; quota = 100; sendFails = false; visitorFails = false; locked = false;
};
const post = overrides => context.doPost({ postData: { contents: JSON.stringify({ secret, ...sample, ...overrides }) } });
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
reset(); quota = 1;
assert.equal(post().code, 'LIMIT_REACHED');
assert.equal(emails.length, 0);
reset(); visitorFails = true;
assert.equal(post().code, 'SEND_FAILED');
assert.equal(emails.length, 1);
assert.equal(emails[0].to, 'rozelramos17@gmail.com');
visitorFails = false; quota = 1;
assert.equal(post().ok, true);
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

const env = { SITE_ORIGIN: 'https://example.com', INQUIRY_SECRET: secret, APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test-deployment/exec' };
const request = (data = sample, origin = env.SITE_ORIGIN) => new Request('https://example.com/api/inquiry', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
});
const originalFetch = globalThis.fetch;
let upstream;
globalThis.fetch = async (url, options) => {
  upstream = { url, payload: JSON.parse(options.body) };
  return Response.json({ ok: true, recipient: 'rozelramos17@gmail.com' });
};
try {
  assert.equal((await worker.fetch(request(), env)).status, 200);
  assert.equal(upstream.payload.secret, secret);
  assert.equal(upstream.payload.email, sample.email);
  assert.equal((await worker.fetch(request({ ...sample, secret: 'attacker', to: 'attacker@example.com' }), env)).status, 200);
  assert.equal(upstream.payload.secret, secret);
  assert.equal(upstream.payload.to, undefined);
  let checksOnly = 0;
  globalThis.fetch = async () => { checksOnly++; return Response.json({ ok: true, recipient: 'old-inbox@example.com' }); };
  const wrongRecipient = await worker.fetch(request(), env);
  assert.equal(wrongRecipient.status, 503);
  assert.equal((await wrongRecipient.json()).code, 'SCRIPT_UPDATE_REQUIRED');
  assert.equal(checksOnly, 1);
  assert.equal((await worker.fetch(request(sample, 'https://other.example'), env)).status, 403);
  assert.equal((await worker.fetch(request(), { ...env, INQUIRY_SECRET: '' })).status, 503);
  assert.equal((await worker.fetch(request({ message: 'x'.repeat(15000) }), env)).status, 413);
  globalThis.fetch = async () => Response.json({ ok: false, code: 'SEND_FAILED' });
  assert.equal((await worker.fetch(request(), env)).status, 503);
  globalThis.fetch = async () => new Response('<html>Google sign-in</html>');
  assert.equal((await worker.fetch(request(), env)).status, 502);
  globalThis.fetch = async () => { throw new Error('Timeout'); };
  assert.equal((await worker.fetch(request(), env)).status, 502);
} finally {
  globalThis.fetch = originalFetch;
}

// Exercise the actual Vercel wrapper without contacting Google.
const previousSecret = process.env.INQUIRY_SECRET;
const previousScript = process.env.APPS_SCRIPT_URL;
try {
  delete process.env.INQUIRY_SECRET;
  delete process.env.APPS_SCRIPT_URL;
  const readinessRequest = () => new Request('https://example.com/api/inquiry');
  assert.equal((await (await vercelHandler.fetch(readinessRequest())).json()).available, false);
  assert.equal((await vercelHandler.fetch(request())).status, 503);
  process.env.INQUIRY_SECRET = secret;
  assert.equal((await (await vercelHandler.fetch(readinessRequest())).json()).available, true);
  globalThis.fetch = async (url, options) => {
    assert.ok(url.includes('AKfycbxBxprg78OX094PvfCaJ6xxHejoR5ci8rNVMagkYTq2yiSX6F8_kY1-DrAK9_rYqMpR'));
    assert.equal(JSON.parse(options.body).secret, secret);
    return Response.json({ ok: true, recipient: 'rozelramos17@gmail.com' });
  };
  assert.equal((await vercelHandler.fetch(request())).status, 200);
  assert.equal((await vercelHandler.fetch(request(sample, 'https://other.example'))).status, 403);
  globalThis.fetch = async () => Response.json({ ok: false, code: 'UNAUTHORIZED' });
  assert.equal((await vercelHandler.fetch(request())).status, 503);
} finally {
  if (previousSecret === undefined) delete process.env.INQUIRY_SECRET;
  else process.env.INQUIRY_SECRET = previousSecret;
  if (previousScript === undefined) delete process.env.APPS_SCRIPT_URL;
  else process.env.APPS_SCRIPT_URL = previousScript;
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
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/inquiry');
    assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).email, sample.email);
    assert.equal(JSON.parse(options.body).secret, undefined);
    return Response.json({ ok: true, recipient: 'rozelramos17@gmail.com' });
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
