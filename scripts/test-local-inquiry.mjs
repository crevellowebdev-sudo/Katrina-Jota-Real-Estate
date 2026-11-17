import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { localInquiryMiddleware } from './local-inquiry.mjs';

const originalFetch = globalThis.fetch;
const previousSecret = process.env.INQUIRY_SECRET;
const previousScript = process.env.APPS_SCRIPT_URL;
const secret = 'local-only-mocked-secret-'.repeat(2);
let upstreamCalls = 0;
let upstreamAccepted = true;
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith('https://script.google.com/')) {
    upstreamCalls++;
    assert.equal(JSON.parse(options.body).secret, secret);
    return Response.json({ ok: upstreamAccepted, recipient: 'rozelramos17@gmail.com' });
  }
  return originalFetch(url, options);
};
const middleware = localInquiryMiddleware();
const server = createServer((req, res) => middleware(req, res, () => {
  res.writeHead(404); res.end('Other route');
}));

try {
  delete process.env.INQUIRY_SECRET;
  delete process.env.APPS_SCRIPT_URL;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const url = `${origin}/api/inquiry`;
  assert.equal((await (await fetch(url)).json()).available, false);
  process.env.INQUIRY_SECRET = secret;
  const readiness = await fetch(url);
  const readinessBody = await readiness.text();
  assert.equal(JSON.parse(readinessBody).available, true);
  assert.ok(!readinessBody.includes(secret));
  const body = JSON.stringify({ fullName: 'Local test', email: 'sample@example.com', message: 'Mocked local test' });
  const submit = (overrides = {}) => fetch(url, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body, ...overrides,
  });
  assert.equal((await (await submit()).json()).ok, true);
  assert.equal(upstreamCalls, 2);
  assert.equal((await submit({ headers: { Origin: 'https://other.example', 'Content-Type': 'application/json' } })).status, 403);
  assert.equal(upstreamCalls, 2);
  assert.equal((await submit({ body: JSON.stringify({ message: 'x'.repeat(15000) }) })).status, 413);
  assert.equal(upstreamCalls, 2);
  upstreamAccepted = false;
  assert.equal((await submit()).status, 503);
  assert.equal((await fetch(url, { method: 'DELETE' })).status, 405);
  assert.equal((await fetch(`${origin}/unrelated`)).status, 404);
  console.log('Local HTTP API passed: readiness, real request parsing, secret forwarding, cross-origin rejection, body limit, failure handling, method restriction, route isolation. Google mocked; no email sent.');
} finally {
  globalThis.fetch = originalFetch;
  if (previousSecret === undefined) delete process.env.INQUIRY_SECRET;
  else process.env.INQUIRY_SECRET = previousSecret;
  if (previousScript === undefined) delete process.env.APPS_SCRIPT_URL;
  else process.env.APPS_SCRIPT_URL = previousScript;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
