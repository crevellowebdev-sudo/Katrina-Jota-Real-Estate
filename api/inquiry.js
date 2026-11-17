import relay from '../integrations/google-apps-script/relay-worker.js';

const deployedScriptUrl = 'https://script.google.com/macros/s/AKfycbxBxprg78OX094PvfCaJ6xxHejoR5ci8rNVMagkYTq2yiSX6F8_kY1-DrAK9_rYqMpR/exec';

/** Vercel Node.js function. Credentials stay on the server. */
export default {
  async fetch(request) {
    const env = {
      APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || deployedScriptUrl,
      INQUIRY_SECRET: process.env.INQUIRY_SECRET || '',
      SITE_ORIGIN: new URL(request.url).origin,
    };
    if (request.method === 'GET') {
      // Configuration readiness only; does not send a test email or expose credentials.
      const available = env.INQUIRY_SECRET.length >= 32 &&
        /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(env.APPS_SCRIPT_URL);
      return Response.json({ available }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return relay.fetch(request, env);
  },
};
