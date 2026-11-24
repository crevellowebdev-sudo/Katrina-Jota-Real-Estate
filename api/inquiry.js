import relay from '../integrations/google-apps-script/relay-worker.js';

const deployedScriptUrl = 'https://script.google.com/macros/s/AKfycbyNYW7RZ1_eDUVDzsD5KGKi10SsBeoIq4jB2K0tAaLn8B-QKQA3D4tQCODMvNQqxE0jKQ/exec';

/** Vercel Node.js function. Credentials stay on the server. */
export default {
  async fetch(request) {
    // Vercel can expose a deployment/internal URL here instead of the public alias.
    // Compare browser origins against the configured public website when supplied.
    let siteOrigin = new URL(request.url).origin;
    if (process.env.VITE_SITE_URL) {
      try {
        const site = new URL(process.env.VITE_SITE_URL);
        siteOrigin = site.protocol === 'https:' && !site.username && !site.password ? site.origin : '';
      } catch { siteOrigin = ''; }
    }
    const env = {
      APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || deployedScriptUrl,
      INQUIRY_SECRET: process.env.INQUIRY_SECRET || '',
      PRIVACY_POLICY_URL: process.env.VITE_PRIVACY_POLICY_URL || '',
      SITE_ORIGIN: siteOrigin,
    };
    if (request.method === 'GET') {
      // Configuration readiness only; does not send a test email or expose credentials.
      const available = !!env.SITE_ORIGIN && env.INQUIRY_SECRET.length >= 32 &&
        /^https:\/\/[^\s<>"']+$/.test(env.PRIVACY_POLICY_URL) &&
        /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(env.APPS_SCRIPT_URL);
      return Response.json({ available }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return relay.fetch(request, env);
  },
};
