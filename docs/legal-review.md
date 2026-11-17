# Legal pages awaiting client approval

The requested pages are implemented at `/terms-and-conditions` and `/privacy-policy`. Their editable draft wording is in `src/data/legal.ts`. Both pages display a draft notice and have `noindex, follow` metadata. Neither is presented as approved legal advice or a final policy. The five main navigation items are unchanged; legal links appear in the footer and contact form.

Before treating the drafts as final, confirm:

- The legal business identity, any required brokerage disclosures, and who handles privacy requests.
- The actual hosting/email providers, processing locations and access arrangements.
- Email/consent-record retention and deletion practices, including the existing duplicate-prevention ledger's cleanup-on-submission behavior.
- Any tracking, cookies or other services on the deployed website beyond the checked-in source.
- Marketing procedures, withdrawal/unsubscribe handling, and any additional required business information.
- Appropriate website-use conditions and the effective date for each approved document.

After approval, replace any review-specific text in `src/data/legal.ts`, remove the draft notices in `src/pages/Legal.tsx` and `src/components/ContactForm.tsx`, and update the draft-specific metadata/noindex rules in `src/App.tsx` and `src/data/site.ts`. Set `VITE_PRIVACY_POLICY_URL` to the approved absolute HTTPS policy URL in the frontend build and API environment. Deploy the website and current Apps Script integration as documented. Draft pages do not automatically enable consent processing or sending.

Reference guidance consulted while preparing the review drafts:

- [Office of the Privacy Commissioner of Canada: meaningful consent](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/collecting-personal-information-and-consent/consent/gl_omc_201805/)
- [CRTC: Canada's Anti-Spam Legislation FAQ](https://crtc.gc.ca/eng/com500/faq500.htm)

These references do not establish legal compliance or replace review of the client's actual practices.
