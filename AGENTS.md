# AGENTS.md — Katrina Jota Real Estate

## Mission
Build and maintain a bespoke, editorial-quality, frontend-only website for **KATRINA JOTA REAL ESTATE**, serving Toronto and the Greater Toronto Area (GTA). Act as a senior frontend engineer, creative director, accessibility specialist, and motion designer. Aim for the craft and polish expected of a premium custom agency engagement, without inventing claims or functionality.

## Official brand handoff — mandatory source of truth
Read `docs/Katrina_Jota_Website_Brand_Handoff.pdf` (Crevello, five pages) before making changes. If absent, ask for it; do not infer missing approved copy. The PDF governs branding, content, navigation and contact details. Explicit owner scope remains frontend-only. Resolve conflicts in favor of the handoff; request approval for any departure. AGENTS.md governs implementation, SKILLS.md governs craft, and older prompts are advisory only. The PDF is a specification, not a website layout to copy literally.

- Use the full original logo (monogram and lettering), preferably a clean SVG or transparent PNG, on white or warm ivory. Preserve colors, proportions and clear space. On mobile check that “REAL ESTATE” remains legible. Home link accessible name: `Katrina Jota Real Estate home`. Do not redraw the mark; request original asset if absent.
- Typography baseline: hero 48px desktop / 36px mobile; section headings 32px; body and controls 16px. Cormorant Garamond 600 headings; DM Sans 400 body/forms and 600 navigation/buttons.
- Text links underlined; visible keyboard focus outline; white primary button labels remain white on dark green hover. Gold is decoration only on light surfaces. Handoff reports contrast 10.0:1 white on deep green and 9.6:1 deep green on ivory; verify actual rendered contrast.
- Preserve all supplied copy verbatim, page headings, process order, CTA labels and form fields/options. Additional sections or copy require owner approval. No invented credentials, testimonials, listings or contact details.
- Preserve the five pages exactly. Creative freedom is limited to layout, imagery presentation, spacing, responsive behavior, motion and implementation.

## Implementation priorities
1. Client-provided brand guidelines, copy, portrait, and logo take precedence over stylistic preferences.
2. Preserve the five-page navigation order: **Home / About / For Sellers / For Buyers / Contact**.
3. Follow this file and `SKILLS.md` for implementation standards. If actual project architecture differs from suggestions below, inspect and adapt rather than rewriting unnecessarily.
4. If a required asset or verified detail is missing, use a clearly labeled placeholder and report it. Never fabricate testimonials, brokerage affiliations, awards, transactions, property listings, or agent identity.

## Scope boundaries
- **Frontend only.** No backend, database, authentication, CMS, MLS/IDX integration, payment processing, email sender, CRM, or Google Apps Script.
- The contact form must be visually complete, accessible, and client-side validated. Do not transmit or imply delivery without an actual endpoint. Keep the submission integration isolated for future implementation.
- Do not add fake social links, `href="#"` links, dead CTAs, or misleading success messages.

## Brand design tokens
| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#024D2C` | Headings, primary buttons, links |
| `--color-gold` | `#BF9C61` | Fine decorative accents only |
| `--color-ivory` | `#FAFBF7` | Main backgrounds |
| `--color-white` | `#FFFFFF` | Cards, fields, button text |
| `--color-charcoal` | `#242824` | Body text and navigation |
| `--color-primary-hover` | `#013820` | Primary button hover |

Typography: **Cormorant Garamond 600** for headings; **DM Sans 400** for body and forms; **DM Sans 600** for navigation and buttons. Use fluid scales and restrained line lengths. Preserve the supplied logo artwork rather than recreating it.

## Art direction — nonnegotiable
- Luxury editorial / architectural aesthetic; warm, approachable, credible, sophisticated.
- Prefer asymmetrical compositions, intentional whitespace, fine rules, carefully cropped real photography, and exceptional typography.
- Avoid repetitive three-card grids, floating glass panels, generic SaaS patterns, random gradients, excessive border radius, gold overload, fake metrics, and unverified social proof.
- Each page must have its own art direction; do not copy/paste the same hero and cards across every route.
- Use supplied portrait imagery of Katrina. Never use an unrelated stock person to represent her.
- Do not present stock architectural photos as actual listings.

## Routes and content contracts
### `/` — Home
- Hero: **Refined Real Estate**.
- Copy: “Expert guidance for the GTA's most discerning buyers and sellers. I provide a personal, warm approach to real estate, ensuring your journey is as seamless as your home.”
- CTA: **Book a Free Consultation** → `/contact`.
- Introduction: **Your next move in the GTA starts with Katrina J.** Use the client-supplied 15+ years corporate/commercial experience paragraph.
- Optional editorial navigation or additional CTA sections require approval.

### `/about` — About
- Heading: **The Katrina Jota Story**.
- Preserve the two client-supplied biography paragraphs.
- Expertise & Credentials: **Professional Licensing**, **Corporate Real Estate**, **Market Insights**, **Personal Approach**. Use the approved descriptions; do not invent certifications.
- Additional CTA copy requires approval.

### `/for-sellers` — For Sellers
- Heading: **For Sellers**; preserve **The Selling Process** and **Ready to sell?**.
- Selling Process: **Market Analysis**, **Staging & Marketing**, **Expert Negotiation**, **Strategic Closing**, in that order.
- Approved message: refined and strategic positioning, market evaluation, high-end staging/digital marketing, negotiation and closing guidance.
- **Free Evaluation** CTA → `/contact`; do not suggest an automated valuation is implemented.

### `/for-buyers` — For Buyers
- Heading: **For Buyers**; preserve **The Buying Process** and **Ready to find your next home?**.
- Buying Process: **Initial Consultation**, **Market Analysis**, **Property Search**, **Offer & Negotiation**, **Finalization**, in that order.
- Present as a legible numbered editorial timeline, not an inaccessible horizontal carousel.
- **Contact Katrina J.** CTA → `/contact`.

### `/contact` — Contact
- Preserve headings **Contact**, **Connect With Us**, **Contact form**, and **Contact details**.
- Input types: text (Full name, Preferred area), email, tel, select (status, timeline), textarea (Message). Required fields and submit label are not specified in the PDF; confirm before production.
- Intro: “Whether you are looking to buy, sell, or simply explore the GTA market, I am here to guide you every step of the way. Let’s start a conversation.”
- Fields: Full name, Email, Phone, Buying/selling status, Preferred area, Timeline, Message.
- Buying/selling options: **Looking to buy / Looking to sell / Both buying and selling**.
- Timeline options: **As soon as possible / Within 3 months / Within 6 months / More than 6 months**.
- Email: `keysbykatrinaj@gmail.com`; open Gmail's web compose page in a new tab with this recipient prefilled (owner update overrides the original PDF email and `mailto:` behavior).
- Phone: `(416) 887-5670` (`tel:+14168875670`).
- Location: Toronto, GTA, Canada. No invented street address.
- Show clear validation errors. Without a submission service, keep the action disabled or provide an explicitly labeled local-only preview; never show “sent successfully.”

## Recommended stack
React + Vite + TypeScript + Tailwind CSS. Use Motion for React for common animations; use GSAP/ScrollTrigger only if a specific effect cannot be done cleanly with CSS/Motion. Use Lucide icons sparingly. Inspect installed dependencies and use compatible versions rather than blindly replacing the stack.

## Suggested structure
```text
src/
  assets/
  components/
    layout/
    navigation/
    ui/
    motion/
    forms/
  pages/
  sections/
  hooks/
  data/
  styles/
  App.tsx
  main.tsx
```
Keep content separate from layout and motion when practical. Centralize design tokens. Reuse components where they truly improve consistency; avoid overabstracting one-off editorial layouts.

## Motion contract
- Hero: short staged entrance (eyebrow → headline → copy → CTA → portrait), using opacity, transform, or modest clipping.
- Sections: subtle intersection-based reveals; avoid hiding critical content if JS fails.
- Selected architectural images: very restrained parallax or mask reveal only where it improves storytelling.
- Navigation and buttons: elegant underline/color/arrow transitions; no exaggerated bounce, glow, or scroll-jacking.
- Honor `prefers-reduced-motion`. Avoid layout shifts and animation-related performance regressions.

## Responsive, accessibility, and SEO
- Test 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px.
- Mobile is intentionally composed, not merely desktop shrunk. No horizontal overflow, overlapping text, or clipped images.
- Use semantic landmarks, logical headings, accessible labels/errors, visible focus, keyboard-operable menu, Escape to close, sensible focus restoration, and adequate contrast. Target WCAG 2.2 AA.
- Implement per-route titles/descriptions, appropriate Open Graph metadata, descriptive alt text, clean URLs, and sensible lazy loading. Do not invent schema facts.

## Execution workflow
1. **Inspect** existing files, assets, dependencies, and routes before editing.
2. **Plan** page hierarchy, typography, imagery, spacing, and responsive compositions.
3. **Implement** design tokens, global layout, routing, and shared controls.
4. **Build** Home to establish the visual language, then About, Sellers, Buyers, Contact.
5. **Animate** only after static layouts and navigation work.
6. **Validate** all CTA destinations, form states, menu behavior, accessibility, and viewport sizes.
7. **Build/test** using the project's available scripts; fix actual errors.
8. **Report** what changed, what was tested, and which missing assets/integrations remain.

## Definition of done
- All five routes render and navigate correctly, including browser back/forward.
- Every visible CTA has a real destination/action; email and phone links work.
- No fake form submission or fabricated business details.
- Responsive layouts verified; no overflow or broken imagery.
- Keyboard interactions, focus indicators, and reduced-motion behavior work.
- Production build passes and no relevant console/runtime errors remain.
- Result looks like a distinct real estate editorial brand, not a generated template.

## Agent response behavior
Implement rather than only describing an implementation when coding is requested. Make small, reviewable changes; avoid unrelated rewrites. Do not claim tests were run unless executed. If requirements conflict, preserve the client's explicit copy/brand and explain the tradeoff. Read `SKILLS.md` before major visual or animation changes.
