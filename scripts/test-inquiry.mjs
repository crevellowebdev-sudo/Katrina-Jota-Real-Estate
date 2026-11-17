import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source = await fs.readFile('src/lib/inquiry.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { emptyInquiry, validateInquiry, submitInquiry } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

assert.deepEqual(Object.keys(validateInquiry(emptyInquiry)), ['fullName', 'email']);
assert.equal(Object.keys(validateInquiry({ ...emptyInquiry, fullName: 'Alex Morgan', email: 'alex@example.com' })).length, 0);
for (const email of ['not-email', 'alex@', '@example.com', 'alex@example', 'alex @example.com']) {
  assert.ok(validateInquiry({ ...emptyInquiry, fullName: 'Alex', email }).email);
}

const draft = { ...emptyInquiry, fullName: '  Alex Morgan  ', email: ' alex@example.com ', message: 'Please keep this draft.' };
const original = { ...draft };
assert.equal((await submitInquiry(draft)).status, 'unavailable');
assert.equal((await submitInquiry(emptyInquiry)).status, 'invalid');
let received;
assert.equal((await submitInquiry(draft, async values => { received = values; })).status, 'sent');
assert.equal(received.fullName, 'Alex Morgan');
assert.equal(received.email, 'alex@example.com');
assert.equal((await submitInquiry(draft, async () => { throw new Error('Delivery failed'); })).status, 'error');
assert.deepEqual(draft, original);
console.log('Inquiry validation, unavailable submission, adapter contract, error handling, and draft preservation pass.');