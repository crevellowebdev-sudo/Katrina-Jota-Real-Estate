import { build, createServer, loadEnv, preview } from 'vite';
import { parseArgs } from 'node:util';
import { localInquiryMiddleware } from './local-inquiry.mjs';

const { values } = parseArgs({ options: {
  port: { type: 'string', default: '5173' },
  host: { type: 'string', default: '127.0.0.1' },
  configLoader: { type: 'string', default: 'runner' },
  preview: { type: 'boolean', default: false },
} });
if (!['127.0.0.1', 'localhost', '::1'].includes(values.host)) {
  throw new Error('Local email testing must use a loopback host.');
}

const localEnv = loadEnv('development', process.cwd(), '');
for (const key of ['INQUIRY_SECRET', 'APPS_SCRIPT_URL']) {
  if (process.env[key] === undefined && localEnv[key]) process.env[key] = localEnv[key];
}

const config = {
  configLoader: values.configLoader,
  server: { host: values.host, port: Number(values.port), strictPort: true },
  preview: { host: values.host, port: Number(values.port), strictPort: true },
  plugins: [{
    name: 'local-inquiry-api',
    configureServer(vite) { vite.middlewares.use(localInquiryMiddleware()); },
    configurePreviewServer(vite) { vite.middlewares.use(localInquiryMiddleware()); },
  }],
};
if (values.preview) await build({ configLoader: values.configLoader });
const server = values.preview ? await preview(config) : await createServer(config);
if (!values.preview) await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: true });
console.log(process.env.INQUIRY_SECRET?.length >= 32
  ? 'Local email API ready. Submitting the form will contact the deployed Google Apps Script.'
  : 'Email sending disabled: set INQUIRY_SECRET in .env.local to match Apps Script, then restart this command.');
