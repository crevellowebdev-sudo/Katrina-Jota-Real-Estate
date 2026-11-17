import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source = await fs.readFile('src/lib/inquiry.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { emptyInquiry, validateInquiry, submitInquiry } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

assert.deepEqual(Object.keys(validateInquiry(emptyInquiry)), ['fullName', 'email', 'phone', 'inquiryConsent']);
assert.equal(emptyInquiry.inquiryConsent, false);
assert.equal(emptyInquiry.marketingConsent, false);
assert.equal(Object.keys(validateInquiry({ ...emptyInquiry, inquiryConsent: true, fullName: 'Alex Morgan', email: 'alex@example.com', phone: '(416) 887-5670' })).length, 0);
for (const email of ['not-email', 'alex@', '@example.com', 'alex@example', 'alex @example.com']) {
  assert.ok(validateInquiry({ ...emptyInquiry, fullName: 'Alex', email }).email);
}
const validDraft = { ...emptyInquiry, inquiryConsent: true, fullName: 'Alex Morgan', email: 'alex@example.com', phone: '4168875670' };
for (const [field, limit] of Object.entries({ fullName: 120, email: 254, phone: 40, status: 80, area: 200, timeline: 80, message: 5000 })) {
  assert.ok(validateInquiry({ ...validDraft, [field]: 'x'.repeat(limit + 1) })[field]);
  assert.ok(validateInquiry({ ...validDraft, [field]: 'x\0y' })[field]);
}
assert.ok(validateInquiry({ ...validDraft, status: 'Custom value' }).status);
assert.ok(validateInquiry({ ...validDraft, timeline: 'Tomorrow' }).timeline);
assert.deepEqual(validateInquiry({ ...validDraft, fullName: "Zoë O'Connor 王", message: 'Message\r\nwith\ttabs 😀' }), {});

const phones = JSON.parse(await fs.readFile('scripts/fixtures/phone-validation.json', 'utf8'));
for (const { value, valid } of phones) {
  assert.equal(!validateInquiry({ ...emptyInquiry, phone: value }).phone, valid, `Phone validation: ${JSON.stringify(value)}`);
  let called = false;
  const result = await submitInquiry({ ...emptyInquiry, inquiryConsent: true, fullName: 'Alex', email: 'alex@example.com', phone: value }, async () => { called = true; });
  assert.equal(called, valid);
  assert.equal(result.status, valid ? 'sent' : 'invalid');
}
const draft = { ...emptyInquiry, inquiryConsent: true, fullName: '  Alex Morgan  ', email: ' alex@example.com ', phone: '  (416) 887-5670  ', message: 'Please keep this draft.' };
const original = { ...draft };
assert.equal((await submitInquiry(draft)).status, 'unavailable');
assert.equal((await submitInquiry(emptyInquiry)).status, 'invalid');
let received;
assert.equal((await submitInquiry(draft, async values => { received = values; })).status, 'sent');
assert.equal(received.fullName, 'Alex Morgan');
assert.equal(received.email, 'alex@example.com');
assert.equal(received.phone, '(416) 887-5670');
assert.equal(received.inquiryConsent, true);
assert.equal(received.marketingConsent, false);
for (const invalid of [undefined, false, null, 'true', 1]) {
  assert.ok(validateInquiry({ ...validDraft, inquiryConsent: invalid }).inquiryConsent);
}
assert.ok(validateInquiry({ ...validDraft, marketingConsent: 'true' }).marketingConsent);
assert.deepEqual(validateInquiry({ ...validDraft, marketingConsent: true }), {});
assert.equal((await submitInquiry(draft, async () => { throw new Error('Delivery failed'); })).status, 'error');
assert.deepEqual(draft, original);
console.log('Inquiry validation, unavailable submission, adapter contract, error handling, and draft preservation pass.');
