# Premium real estate inquiry email

**Recipient update:** Form emails now go to `rozelramos17@gmail.com`. Replace the code in your existing Google Apps Script project with this folder's current `Code.gs`, then use **Deploy > Manage deployments > Edit > New version > Deploy**. Keep the same deployment URL and existing secret. Local edits cannot update Google's deployed copy. The relay now checks the deployed recipient before sending, so it will reject an outdated script rather than send to the previous inbox. The website's displayed business email remains unchanged.

This integration was requested after the website's original frontend-only scope. The owner supplied a deployed Apps Script URL and selected Vercel. The website is wired to `/api/inquiry`, which forwards to that deployment. Send Inquiry is clickable without a readiness check and disables only during submission. Missing configuration or a service failure produces an error after clicking; it never produces a false success.

## Vercel setup for this website

The repository now includes `api/inquiry.js` and `vercel.json`. The script URL supplied by the owner is already the function's default. No Cloudflare Worker deployment is needed for Vercel.

1. In **Vercel > Project > Settings > Environment Variables**, add **`INQUIRY_SECRET`** with the exact same value configured under **Apps Script > Project Settings > Script properties**. Use at least 32 random characters. Keep this value out of chat, source control, and any `VITE_` variables.
2. Enable the variable for the intended Vercel environments and redeploy. Set `APPS_SCRIPT_URL` only if you want to override the URL already in `api/inquiry.js`.
3. Keep the Apps Script web app configured to execute as its owner and accept access from Anyone. Its handler still requires the secret.
4. Visit `/contact` on the Vercel deployment and click **Send Inquiry** after entering your details. For local testing without Vercel, use the instructions below.
5. Submit a real inquiry you control and verify receipt at **rozelramos17@gmail.com**, the reply address, and the email layout. Actual delivery has not been tested from this workspace.

The API requires a matching browser Origin and never accepts a recipient from the visitor. A failed or unreadable upstream response cannot produce a success message. The frontend now explains transmission through Vercel/Google when delivery is configured.

## Test real email locally without deploying to Vercel

1. Open `.env.local` in the project root. Set `INQUIRY_SECRET` to the exact value already saved in **Apps Script > Project Settings > Script properties**. It must contain at least 32 characters. Do not add quotes unless the secret needs dotenv quoting, do not prefix the variable with `VITE_`, and do not share it in chat.
2. Confirm the deployed Google script includes this repository's `Code.gs`, is authorized to send mail, executes as its owner, and is accessible to Anyone. Only Google Apps Script needs a deployment; the website stays local.
3. Run `npm run test:email` in the project folder. It builds the website and starts a local preview with the same inquiry handler used on Vercel. It reads `.env.local` on startup, so restart after editing the secret. `npm run dev` also includes the handler when using the development server.
4. Open the printed local URL, followed by `/api/inquiry`. It should return `{"available":true}`. This checks local configuration, not remote Google authorization or secret matching.
5. Open `/contact` on the same local URL and submit your own test name/email with a message such as `Local website email test`. Submitting makes a real request to Google Apps Script and sends a real email to `rozelramos17@gmail.com` if accepted.
6. Check that inbox and Spam. Verify the layout and reply address. Identical inquiries are deduplicated for 24 hours, so change the test message for each additional email.

If an old server is still running, stop it with Ctrl+C before starting `npm run test:email` again. The command now uses a strict port instead of silently moving to another port, so you cannot accidentally keep testing a stale server on port 5173 while the updated server runs on port 5174.

`npm run preview` is a static production preview and does not run the local API. No Vercel account, Vercel CLI, or Vercel deployment is needed for `npm run test:email`. Actual sending requires network access from the machine running the local server.

## Email design

An ivory masthead, deep-green introduction, fine gold rules, readable field summaries, visitor message, Gmail reply button, and Katrina's verified phone/location. All seven existing form fields are included. The recipient is fixed to **rozelramos17@gmail.com** and Reply-To uses the validated visitor email. No automatic email is sent to the visitor.

The template names Cormorant Garamond and DM Sans and uses Georgia/Arial fallbacks because Gmail and other email clients may not support custom fonts. It uses inline styles, presentation tables, and a plain-text alternative. Client rendering can vary; check a real Gmail and Outlook email before launch.

`email-preview.html` is a local design preview with clearly labeled sample data. It does not send anything. The actual email can use the original logo through `LOGO_URL`; no replacement mark has been drawn.

## 1. Set up Google Apps Script

1. Open https://script.google.com/ and create a new project under the Google account that should send the inquiry notifications.
2. Replace `Code.gs` with the contents of the adjacent `Code.gs` file.
3. Open **Project Settings > Script properties**. Add `INQUIRY_SECRET`, a random string of at least 32 characters. Generate one locally using `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep it private.
4. Optionally add `LOGO_URL` with the full HTTPS URL to the website's original `logo-original.png`. Leave this unset until the real site URL is known. The default header is a plain company label, not a replacement logo. Email clients can block remote images.
5. Select `authorizeMail` and click **Run**. Authorize mail sending for the account. This function sends no email.
6. Choose **Deploy > New deployment > Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Save the `/exec` URL. The handler still requires the secret. If your Workspace policy prevents this access setting, an administrator must enable an appropriate deployment.
7. After editing the script, update the deployment to a new version through **Deploy > Manage deployments**.

Mail is sent by the Google account that deploys the script; the display name is Katrina Jota Real Estate. The code cannot impersonate another sender. `ok: true` means MailApp accepted the send, not that a recipient inbox has confirmed delivery.

## 2. Connect through a trusted relay

Google Apps Script is hosted on a different origin and uses response redirects. Use a same-origin server relay so the browser can read an explicit result and the shared secret stays private. Do not use `fetch(..., { mode: 'no-cors' })`: an opaque response cannot confirm acceptance. Never put `INQUIRY_SECRET` in React code or a `VITE_` environment variable.

`relay-worker.js` is an optional Cloudflare Worker implementation. For a Cloudflare-hosted domain, mount it on the website's `/api/inquiry` route; leave the other site routes served by your existing host. In the Worker's settings, configure:

| Variable | Value |
| --- | --- |
| `SITE_ORIGIN` | Exact production origin, such as `https://your-domain.com`, without a trailing slash |
| `APPS_SCRIPT_URL` | Google's deployed `/exec` URL |
| `INQUIRY_SECRET` | Store as a Worker secret; use the same value as Script properties |

For a different host, implement the same relay using that host's server functions. The origin check rejects ordinary cross-site browser submissions; it is not bot authentication. The script also validates field lengths and allowed choices, rejects a populated optional `website` honeypot, deduplicates identical inquiries for 24 hours, and caps accepted messages at 30 in a rolling 24-hour period. Add host-level rate limiting or CAPTCHA for the public endpoint before launch if needed; this example does not include a CAPTCHA integration. Script properties retain only bounded hashes and timestamps for the deduplication window, not inquiry text.

## 3. Website adapter reference (already implemented for Vercel)

`src/lib/inquiryDelivery.ts` implements the adapter, and the Contact page supplies it after the configuration readiness check. The following shows the same contract for other deployments:

```tsx
import type { InquiryAdapter } from './lib/inquiry';

const sendInquiry: InquiryAdapter = async (values) => {
  const response = await fetch('/api/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) throw new Error('Inquiry not accepted');
};

// In the contact page:
// <ContactForm adapter={sendInquiry} />
```

Adapt the import path to the file that contains the adapter. Before enabling the form, confirm required fields and the submit label, replace the draft-only privacy statement with accurate transmission wording, and describe acceptance without guaranteeing inbox delivery. Current defaults require full name and email; the remaining fields are optional.

## Verification

Run `node scripts/test-google-apps-script.mjs` locally. It uses mocked Google services, sends no email, checks validation, fixed-recipient behavior, HTML escaping, quota/failure responses, deduplication, and relay behavior, and regenerates the local preview. Real Google authorization, deployment, email delivery, and Gmail/Outlook rendering require testing after deployment.

On a timeout, a send may already have been accepted. Repeating identical form values within 24 hours returns the previous acceptance while the ledger is intact. Sending and saving the ledger are separate operations: a rare property-write failure after sending can allow a duplicate on retry. The script does not claim exactly-once delivery.

References: [Google web app deployment](https://developers.google.com/apps-script/guides/web), [MailApp HTML email and Reply-To](https://developers.google.com/apps-script/reference/mail/mail-app), [Content Service redirects](https://developers.google.com/apps-script/guides/content).
