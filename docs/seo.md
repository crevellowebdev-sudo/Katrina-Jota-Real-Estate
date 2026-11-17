# SEO implementation and launch checks

## What the build produces

`npm run build` builds cacheable JavaScript/CSS assets and prerenders the five main pages plus the two draft legal pages. Each page contains its actual headings, text, image alternatives, links, and route-specific metadata in the initial HTML. This works without a browser or external prerender service during deployment. React adds normal navigation, forms and motion in the browser.

The initial HTML form is inert until React mounts, so visitors without JavaScript cannot accidentally submit personal details through an implicit GET request. A noscript message provides direct phone/email contact. The private acknowledgment route has a noindex application shell; it never prerenders an unverified success message. An unknown URL has a generated noindex 404 page rather than a homepage masquerading as a valid route.

Titles and descriptions are centralized in `src/data/site.ts`. Shared metadata rules in `src/seo/metadata.ts` keep initial HTML and client navigation synchronized. Open Graph and Twitter metadata include a 1200 × 630 share image made from the original approved logo, without redrawing or altering the brand.

## Confirm the production domain

Set `VITE_SITE_URL` to the client's confirmed HTTPS origin in the production build environment, then rebuild and deploy. Do not use an example domain, localhost, a preview deployment, a path, or a URL containing credentials/query parameters.

When configured, the build generates:

- Self-referencing canonical URLs without inquiry query parameters.
- Absolute Open Graph/Twitter image URLs and page URLs.
- Organization, WebSite and WebPage/AboutPage/ContactPage JSON-LD with verified brand/contact details only; internal pages also have breadcrumbs.
- `dist/sitemap.xml` listing only Home, About, For Sellers, For Buyers and Contact.
- `dist/robots.txt` allowing content crawling, excluding the API, and referencing the sitemap.

Until the domain is confirmed, these origin-dependent values and the sitemap are intentionally omitted. Local metadata and prerendering still work. The build prints a configuration notice instead of inventing a production domain. The test origin `https://seo.example.test` is a fixture only and must never be deployed.

The draft Terms & Conditions and Privacy Policy, private acknowledgment, and unknown routes remain `noindex, follow`. They must be crawlable for search engines to see that directive; they are not added to the sitemap. Follow `docs/legal-review.md` before approving legal content, then update the indexing rules deliberately.

## Images and video

Every active image has descriptive alt text. Architectural photography is identified as illustrative, and the Home model-house image is no longer mislabeled as a portrait. The opening-screen duplicate logo remains hidden from assistive technology; the linked header logo keeps its approved accessible home-link name.

`node scripts/prepare-seo-assets.mjs` regenerates responsive Home/Buyer hero derivatives, WebP portrait derivatives, and the branded social image from the existing supplied assets. Originals are retained. Responsive widths describe the actual derivative dimensions. Keep width/height attributes accurate when changing sources to reduce layout shifts. The About portrait at 800px is approximately 48 KB versus the 3.5 MB original PNG.

HTML video does not support an image-style alt attribute. Its equivalent is an accessible name, a linked scene description, and fallback text. The illustrative interior video is presented muted and has keyboard-operable pause/play controls; reduced-motion visitors do not receive the autoplaying video. Do not fabricate a transcript or video upload date. No VideoObject rich-result claim is made for an atmospheric background clip without a confirmed publication date or dedicated watch page.

The 4K source `herovid.mp4` is preserved. The active 1920 × 1080 H.264 derivative `home-interior.mp4` is about 4.1 MB rather than 16.3 MB, has a fast-start MP4 header, and omits the unused audio track. Its poster is an actual still from the same video. The video dimensions reserve its correct aspect ratio before loading.

## Hosting and verification

Vercel and the static redirect file map each known clean route to its own prerendered HTML. Vercel redirects direct index.html URLs to the clean form and caches fingerprinted `/assets/` files for one year. The API remains separate. Verify direct-route responses and 404 status on the actual hosting provider after deployment; local test routing is not a deployment verification.

Run:

```text
npm run build
npx tsc --noEmit
node scripts/test-seo.mjs
```

The SEO check covers initial HTML without JavaScript, unique metadata, media alternatives, no-JS form safety, robots directives, sitemap exclusions when configured, canonical/schema logic, accessibility, browser navigation, and video controls. Existing inquiry tests use mocked sending services and send no email. Submit the real sitemap in the client's Google Search Console after domain verification; neither Search Console submission nor a search ranking is implied by local changes.

Official references: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Google video guidance](https://developers.google.com/search/docs/appearance/video), [W3C image alternatives](https://www.w3.org/WAI/tutorials/images/), and [Vite prerendering/SSR](https://vite.dev/guide/ssr).
