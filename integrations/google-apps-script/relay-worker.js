/** Optional Cloudflare Worker: mount /api/inquiry on the website's own domain. */
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
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ ok: false }, 415);
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
      const input = JSON.parse(new TextDecoder().decode(bytes));
      if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ ok: false }, 400);
      // Explicitly pick fields; never accept a recipient or credentials from a visitor.
      const payload = { secret: env.INQUIRY_SECRET };
      for (const key of ['fullName', 'email', 'phone', 'status', 'area', 'timeline', 'message', 'website']) {
        if (input[key] !== undefined && typeof input[key] !== 'string') return json({ ok: false }, 400);
        payload[key] = input[key] || '';
      }
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
      if (check.ok !== true || check.recipient !== 'rozelramos17@gmail.com') {
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
