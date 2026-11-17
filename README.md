# Katrina Jota Real Estate

An editorial real estate website built with React, TypeScript, Vite, Tailwind CSS v4, Motion, and React Router. The owner-requested email integration adds a Vercel function forwarding inquiries to Google Apps Script.

## Development

Run `npm install`, then `npm run dev`. Use `npm run build` for a production build and `npm run preview` to inspect it. Run `npx tsc --noEmit` for strict type checking.

The development command runs Vite plus the local inquiry API on a loopback address and uses the runner config loader. If the production build's default config bundler encounters a sandbox access error, use `npm run build -- --configLoader runner`.

To test real email locally without Vercel, put `INQUIRY_SECRET=your_existing_apps_script_secret` in `.env.local`, using the exact Apps Script property value (at least 32 characters). Run `npm run test:email`, open the printed URL followed by `/contact`, and submit your own test details. This command builds the website and runs a local preview with the inquiry API. The supplied Apps Script URL is already configured. The secret is read only by the local server. Ordinary `npm run preview` serves static files and does not run this API. Actual email still requires the deployed Google script, its MailApp authorization, and internet access.

The approved brand and copy source is `public/Katrina_Jota_Website_Brand_Handoff.pdf`, supplied by the owner. This is the handoff referenced under `docs/` in the project instruction files.

## Pages

- `/`: Home
- `/about`: Katrina's story and expertise
- `/for-sellers`: Four-stage selling process
- `/for-buyers`: Five-stage buying process
- `/contact`: Client-side validated inquiry draft and direct contact links

## Before Launch

- The full, original-color logo is served from `public/images/logo-original.png` in the header and on an ivory panel in the footer. It is a lossless PNG conversion of the existing transparent full-logo derivative; no lettering was redrawn or recolored.
- `public/images/katrina-portrait.jpg` and `approved-sellers.jpg` were extracted directly from pages 2 and 3 of the supplied handoff. Obtain higher-resolution originals for sharper large-screen presentation; the embedded images are 377 × 504 and 407 × 507 pixels.
- Confirm required contact fields and the submit label before production. The handoff leaves those unspecified; the current form requires name and email and enables `Send Inquiry` when server configuration is present.
- Add approved brokerage or regulatory disclosure text to `business.regulatoryDisclosure` in `src/data/site.ts`.
- Set `VITE_SITE_URL` to the confirmed production origin for canonical and absolute Open Graph URLs.
- Configure the host to fall back to `index.html` for client-side routes. `public/_redirects` provides a Netlify-compatible rule.
- Server-render or prerender route-specific metadata if social crawlers and non-JavaScript search engines must see each page's metadata before JavaScript runs.

## Inquiry Form

`Send Inquiry` is clickable without a readiness check. It validates the required fields, submits to `/api/inquiry`, and disables only while a request is in progress. Failures preserve the draft and re-enable the button. For local testing, set `INQUIRY_SECRET` in `.env.local` and run `npm run dev`. For deployment, configure the same value in Vercel, then redeploy. The supplied Apps Script URL is already configured in `api/inquiry.js`; an optional `APPS_SCRIPT_URL` server variable overrides it. See [email integration setup](integrations/google-apps-script/README.md).

Draft data remains in React context while navigating within the tab and is never written to browser storage. Selecting Send Inquiry transmits the submitted details through the local server (development) or Vercel relay (deployment) and Google Apps Script to Katrina's email. Refreshing or closing the tab discards the draft.

The reusable `submitInquiry` handler validates and awaits the adapter. The adapter resolves only after an explicit positive Apps Script response. Acceptance does not guarantee inbox delivery. Configuration readiness does not verify Google authorization or that the secrets match; test receipt after deployment.

## Assets

Fonts are self-hosted Cormorant Garamond (600 normal and italic) and DM Sans (400, 500, 600), sourced from Google Fonts under the SIL Open Font License. Home uses `public/images/herovid.mp4` above 700px, muted and looping with a pause control. Mobile, reduced-motion visitors, and video errors use `public/images/hero.jpg`; mobile does not load the video. The handoff portrait appears in Home's introductory story. About pairs an unframed portrait with the approved biography and a green expertise section. Sellers uses the handoff's supplied interior image. Buyers retains illustrative architectural imagery from the existing site. The original licensing/source record for retained architectural assets must be confirmed before production.

Architectural images are editorial illustrations of atmosphere, not verified listings. No testimonial, award, sales count, or brokerage affiliation has been fabricated.

## Verification

Run `node scripts/test-inquiry.mjs` for form-validation and submission-adapter contract tests.

With a development server running, run `node scripts/verify.mjs`. It checks all five pages at nine widths (320 through 1920 pixels), image loading, headings, WCAG A/AA rules, draft preservation, contextual CTAs, browser history, menu focus trapping, Escape behavior, and reduced motion. Screenshots and a JSON report are saved to the ignored `.verification` directory. Set `BASE_URL=http://localhost:4173` to test the production preview instead.

Browser tests require `npx playwright install --with-deps chromium` once in a new environment. Automated accessibility scans supplement, but do not replace, a complete manual accessibility audit.

Alternatively, set `BROWSER_CHANNEL=chrome` to run verification with installed Google Chrome.
