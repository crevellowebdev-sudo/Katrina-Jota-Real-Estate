# Premium real estate inquiry email

**Recipient update:** Form emails now go to `rozelramos17@gmail.com`. Replace the code in your existing Google Apps Script project with this folder's current `Code.gs`, then use **Deploy > Manage deployments > Edit > New version > Deploy**. Keep the same deployment URL and existing secret. Local edits cannot update Google's deployed copy. The relay now checks the deployed recipient before sending, so it will reject an outdated script rather than send to the previous inbox. The website's displayed business email remains unchanged.

This integration was requested after the website's original frontend-only scope. The owner supplied a deployed Apps Script URL and selected Vercel. The website is wired to `/api/inquiry`, which forwards to that deployment. Send Inquiry is clickable without a readiness check and disables only during submission. Missing configuration or a service failure produces an error after clicking; it never produces a false success.

Full name, email, and phone are required. Phone validation accepts Canadian/US 10-digit numbers, an optional `1`/`+1` prefix, and common spaces, hyphens, dots, or parentheses around the area code (for example, `(416) 887-5670` or `+1 416 887 5670`). Empty, malformed, or incomplete numbers are rejected by the browser, the API relay (HTTP 400 before contacting Google), and Apps Script before sending mail. Replace and redeploy `Code.gs` using **Deploy > Manage deployments > Edit > New version > Deploy** to activate the updated validation in Google's deployed copy. Redeploy the website to activate the frontend and API changes in production.

## Input validation and output escaping

### Consent and Privacy Policy setup

Set **`VITE_PRIVACY_POLICY_URL`** to the client's approved, published HTTPS policy URL in `.env.local` and Vercel's environment settings, then restart/rebuild. This public value is read by both the form and Vercel API; a standalone Worker uses `PRIVACY_POLICY_URL` instead. No policy URL or policy text is invented. Without a valid policy URL, the form shows a clearly labeled pending-policy notice and blocks sending; the API also rejects attempts to bypass this state.

The required inquiry-processing checkbox and optional marketing checkbox both start unchecked. Only explicit inquiry consent (`true`) allows submission. Marketing consent is independent: opting out never blocks an inquiry. Both APIs reject string/number substitutes for booleans; omitted marketing consent defaults to `false`. Consent choices persist only in the in-memory draft while browsing and reset to unchecked after an accepted inquiry. Recording marketing consent does not subscribe the visitor to a mailing list or send marketing messages.

The trusted relay supplies the configured policy URL and `inquiry-consent-v1` wording identifier. Apps Script creates the UTC ISO submission timestamp itself; browser-supplied timestamps and policy URLs are ignored by the relay. The owner notification leads with client details, the message, and the reply action. Its HTML footer summarizes contact permission and marketing preferences in plain language, with a labeled Privacy Policy link; the header shows the received date in Toronto time. The email's plain-text alternative retains both consent statuses, the exact UTC timestamp, policy URL, and wording identifier at the end for reference. No database or new long-term audit service is added.

The existing rolling 24-hour deduplication ledger also stores the two boolean consent choices and the original UTC timestamp next to the inquiry hash and delivery flags. It contains no names, email addresses, message text, or full policy URLs. Minimal records keep the bounded 30-entry ledger within Apps Script's per-property limit. Partial-delivery retries reuse the original timestamp; changed consent choices produce distinct hashes and are not suppressed as identical inquiries. Keep the owner's notification emails if a retained consent history is needed beyond the ledger's 24-hour window.

Current wording for `inquiry-consent-v1`:

- Required: "I consent to Katrina Jota Real Estate using my information to respond to this inquiry."
- Optional: "I would also like to receive real estate news and marketing emails from Katrina Jota Real Estate."

Bump the wording identifier in both server layers when materially changing those statements. Replace and redeploy `Code.gs` before deploying the website update. The relay checks the script's consent capability before sending; older scripts are rejected rather than silently omitting consent records. Human verification is currently removed; CAPTCHA configuration is not required.

Both the API relay and Apps Script independently enforce these limits before any email is sent. Browser limits provide feedback and are not trusted as a security boundary.

| Field | Maximum length | Validation |
| --- | ---: | --- |
| Full name | 120 | Required, single-line text |
| Email | 254 | Required, email format, no header separators or whitespace |
| Phone | 40 | Required, Canadian/US number format above |
| Buying/selling status | 80 | Empty or one of the three approved options |
| Preferred area | 200 | Optional, single-line text |
| Timeline | 80 | Empty or one of the four approved options |
| Message | 5,000 | Optional multiline plain text |

Lengths use JavaScript UTF-16 units, matching HTML `maxlength`, and are checked before trimming. Non-string text field values, unsupported control characters, and malformed Unicode are rejected. Leading/trailing whitespace is trimmed and message line endings are normalized to LF. Valid names, apostrophes, Unicode, and literal punctuation are preserved. Only the seven approved text fields, validated consent booleans, server-configured policy metadata, and the server's own secret reach Apps Script; visitor-provided recipients, credentials, actions, timestamps, and extra fields are ignored. A populated or non-string honeypot is rejected.

The relay caps request bodies at 14,000 bytes while streaming, accepts JSON only, and returns HTTP 400 for invalid UTF-8, malformed JSON, invalid root types, or invalid fields. Size violations return HTTP 413. Error responses contain fixed validation messages and never echo submitted values. Apps Script independently limits request length and rejects invalid input before locking, recording a receipt, or sending mail.

Email templates HTML-escape `&`, `<`, `>`, double quotes, and apostrophes at the output boundary. Dynamic URL values are URL-encoded and then HTML-escaped in attributes. Plain-text emails preserve literal text; HTML is never executed from form values. React renders form errors as text, without raw HTML insertion. No SQL/database is used, so there are no SQL queries to parameterize. Any future SQL integration must bind submitted values using parameterized queries or prepared statements.

Regression checks: `node scripts/test-inquiry.mjs`, `node scripts/test-google-apps-script.mjs`, and `node scripts/test-local-inquiry.mjs`. The tests cover boundary lengths, malformed requests, bypassed frontend validation, header/control injection, Unicode, normalization, and HTML/URL escaping. Email services are mocked; these tests send no real email. Guidance: [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) and [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

## Vercel setup for this website

Human verification is currently removed at the owner's request. No CAPTCHA keys or tokens are required. Consent, Privacy Policy configuration, server validation, the origin check, honeypot, deduplication, and existing sending limits remain active.

1. In **Vercel > Project > Settings > Environment Variables**, add **`INQUIRY_SECRET`** with the exact same value configured under **Apps Script > Project Settings > Script properties**. Use at least 32 random characters. Keep this value out of chat, source control, and any `VITE_` variables.
2. Set `VITE_SITE_URL` to the public HTTPS website origin visitors use (for this deployment, `https://katrina-jota-real-estate-v8vp.vercel.app`). The API uses this value for its origin check because Vercel's request URL can differ from the public alias. Set `VITE_PRIVACY_POLICY_URL` to the approved published policy URL. Enable the variables for the intended Vercel environments and redeploy. Set `APPS_SCRIPT_URL` only if you want to override the URL already in `api/inquiry.js`.
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

An ivory masthead, deep-green introduction, fine gold rules, readable field summaries, visitor message, Gmail reply button, and Katrina's verified phone/location. All seven existing form fields are included. The recipient is fixed to **rozelramos17@gmail.com** and Reply-To uses the validated visitor email. A separate acknowledgment is sent to the validated visitor email, with Reply-To set to `keysbykatrinaj@gmail.com`. It includes the selected timeline and explains that an inquiry does not confirm an appointment. Each new inquiry requires quota for two recipients.

The template names Cormorant Garamond and DM Sans and uses Georgia/Arial fallbacks because Gmail and other email clients may not support custom fonts. It uses inline styles, presentation tables, and a plain-text alternative. Client rendering can vary; check a real Gmail and Outlook email before launch.

`email-preview.html` and `visitor-email-preview.html` are local design previews with clearly labeled sample data. They do not send anything. Both outgoing emails embed a 480px derivative of the supplied `public/images/logo.png` using MailApp inline images; no public image URL or `LOGO_URL` property is needed. The logo data is included in `Code.gs`, so deploying that single file includes the branding.

## 1. Set up Google Apps Script

1. Open https://script.google.com/ and create a new project under the Google account that should send the inquiry notifications.
2. Replace `Code.gs` with the contents of the adjacent `Code.gs` file.
3. Open **Project Settings > Script properties**. Add `INQUIRY_SECRET`, a random string of at least 32 characters. Generate one locally using `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep it private.
4. The supplied `logo.png` is embedded in `Code.gs`. Existing `LOGO_URL` properties are no longer used for outgoing messages. The brand name remains in the plain-text alternative and image alt text.
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

For a different host, implement the same relay using that host's server functions. The origin check rejects ordinary cross-site browser submissions; it is not bot authentication. The script also validates field lengths, consent booleans and allowed choices, rejects a populated optional `website` honeypot, deduplicates identical inquiries for 24 hours, and caps accepted messages at 30 in a rolling 24-hour period. Script properties retain bounded hashes, timestamps, consent booleans and delivery flags for the deduplication window, not inquiry text.

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

Adapt the import path to the file that contains the adapter. Describe acceptance without guaranteeing inbox delivery. Current defaults require full name, email, phone and inquiry-processing consent. Marketing consent and the other inquiry fields are optional. Configure the approved Privacy Policy URL before enabling submission.

## Verification

Run `node scripts/test-google-apps-script.mjs` locally. It uses mocked Google services, sends no email, checks validation, fixed-recipient behavior, HTML escaping, two-recipient quota checks, visitor confirmation, embedded branding, partial-send retry behavior, deduplication, and relay behavior, and regenerates the local preview. Real Google authorization, deployment, email delivery, and Gmail/Outlook rendering require testing after deployment.

Owner and visitor acceptance are tracked separately using hashes and flags. If the visitor acknowledgment fails after the owner email succeeds, retrying the same inquiry sends only the missing visitor email. On a timeout, a send may already have been accepted. Repeating identical form values within 24 hours returns the previous acceptance while the ledger is intact. Sending and saving the ledger are separate operations: a rare property-write failure after sending can allow a duplicate on retry. The script does not claim exactly-once delivery.

References: [Google web app deployment](https://developers.google.com/apps-script/guides/web), [MailApp HTML email and Reply-To](https://developers.google.com/apps-script/reference/mail/mail-app), [Content Service redirects](https://developers.google.com/apps-script/guides/content).

## Visitor confirmation and requested reminders

Replace the deployed `Code.gs` with the updated file and deploy a new version to activate visitor confirmations. These changes exist locally until redeployed; automated checks send no real email. Both messages use the existing Google sender account, with the public business email as the visitor acknowledgment Reply-To.

Reminder scheduling is awaiting clarification. The website collects a buying/selling timeframe, not a confirmed booking date: ?As soon as possible,? ?Within 3 months,? ?Within 6 months,? or ?More than 6 months.? No appointment or reminder dates are inferred from those choices. The owner must choose between reminders before an actual consultation date (requiring date/time collection and confirmation) and follow-ups 1 and 7 days after submission. No reminder trigger is installed by this update.

The embedded logo uses [MailApp inlineImages](https://developers.google.com/apps-script/reference/mail/mail-app#sendEmail(Object)). Future scheduled reminders will require an [installable time-driven trigger](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers) and storage of the recipient and scheduled dates.
