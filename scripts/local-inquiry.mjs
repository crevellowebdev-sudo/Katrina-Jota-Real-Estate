import handler from '../api/inquiry.js';

/** Run the same API handler used by Vercel on the loopback development server. */
export function localInquiryMiddleware(api = handler) {
  return async (request, response, next) => {
    if (request.url?.split('?')[0] !== '/api/inquiry') return next();
    const json = (status, data) => {
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify(data));
    };
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return json(403, { ok: false });
      if (!['GET', 'POST'].includes(request.method)) return json(405, { ok: false });
      const chunks = [];
      let size = 0;
      if (request.method === 'POST') {
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 14000) return json(413, { ok: false });
          chunks.push(chunk);
        }
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
      const result = await api.fetch(new Request(url, {
        method: request.method,
        headers,
        ...(request.method === 'POST' ? { body: Buffer.concat(chunks) } : {}),
      }));
      response.writeHead(result.status, Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch {
      if (!response.headersSent) json(502, { ok: false });
      else response.end();
    }
  };
}
