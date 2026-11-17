# SKILLS.md — Katrina Jota Real Estate Creative & Frontend Playbook

> A project-specific skill reference for AI coding agents. Read together with `AGENTS.md`. This file documents how to achieve the desired craft, not permission to invent assets, facts, or integrations.

## Official brand handoff — mandatory source of truth
Read `docs/Katrina_Jota_Website_Brand_Handoff.pdf` (Crevello, five pages) before making changes. If absent, ask for it; do not infer missing approved copy. The PDF governs branding, content, navigation and contact details. Explicit owner scope remains frontend-only. Resolve conflicts in favor of the handoff; request approval for any departure. AGENTS.md governs implementation, SKILLS.md governs craft, and older prompts are advisory only. The PDF is a specification, not a website layout to copy literally.

- Use the full original logo (monogram and lettering), preferably a clean SVG or transparent PNG, on white or warm ivory. Preserve colors, proportions and clear space. On mobile check that “REAL ESTATE” remains legible. Home link accessible name: `Katrina Jota Real Estate home`. Do not redraw the mark; request original asset if absent.
- Typography baseline: hero 48px desktop / 36px mobile; section headings 32px; body and controls 16px. Cormorant Garamond 600 headings; DM Sans 400 body/forms and 600 navigation/buttons.
- Text links underlined; visible keyboard focus outline; white primary button labels remain white on dark green hover. Gold is decoration only on light surfaces. Handoff reports contrast 10.0:1 white on deep green and 9.6:1 deep green on ivory; verify actual rendered contrast.
- Preserve all supplied copy verbatim, page headings, process order, CTA labels and form fields/options. Additional sections or copy require owner approval. No invented credentials, testimonials, listings or contact details.
- Preserve the five pages exactly. Creative freedom is limited to layout, imagery presentation, spacing, responsive behavior, motion and implementation.

## Skill 01 — Editorial luxury art direction
**Goal:** A bespoke Toronto realtor website with architectural sophistication and personal warmth.

**Procedure**
1. Identify the page's single visual message and primary CTA.
2. Choose a distinctive composition: offset portrait, asymmetric two-column story, image-led spread, fine-rule timeline, or full-width typographic statement.
3. Establish hierarchy using Cormorant Garamond, DM Sans, and intentional negative space.
4. Use warm ivory as the primary canvas; deep green for authority; muted gold as a small accent.
5. Remove any decorative component that does not clarify content or strengthen the composition.

**Reject:** repeated three-column icon cards, generic gradients, glassmorphism, arbitrary counters, fake reviews, oversized shadows, and stock-person-as-agent imagery.

**Quality test:** Can a viewer recognize a distinct personal real estate brand without relying on the logo alone?

## Skill 02 — Brand and typography fidelity
**Exact palette**
```css
:root {
  --color-primary: #024D2C;
  --color-gold: #BF9C61;
  --color-ivory: #FAFBF7;
  --color-white: #FFFFFF;
  --color-charcoal: #242824;
  --color-primary-hover: #013820;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'DM Sans', Arial, sans-serif;
}
```
- Display headings: Cormorant Garamond 600; use balanced line breaks, never overly compressed line-height.
- Paragraphs/forms: DM Sans 400; navigation/buttons: DM Sans 600.
- Use `clamp()` only within the approved baseline: hero 36px mobile to 48px desktop; section headings 32px, body and controls 16px.
- Keep paragraphs approximately 55–75 characters per line when practical.
- Use gold for hairlines, and decorative accents—not meaningful gold text on ivory.
- White text on deep green primary buttons; hover to dark green while retaining white text.

## Skill 03 — Premium page composition
**Home:** offset portrait and editorial “Refined Real Estate” hero; approved introductory story; Book a Free Consultation CTA. Additional sections need approval.

**About:** portrait-led story with the supplied biography; four expertise/credentials in a refined two-column editorial grid; additional closing CTA needs approval.

**For Sellers:** architectural interior hero; four-step vertical selling process (Market Analysis → Staging & Marketing → Expert Negotiation → Strategic Closing); Free Evaluation CTA.

**For Buyers:** welcoming residential hero; five-step buying timeline (Initial Consultation → Market Analysis → Property Search → Offer & Negotiation → Finalization); Contact Katrina J. CTA.

**Contact:** two-column introduction and accessible inquiry form; preserve supplied contact details and dropdown choices; no fabricated successful submission.

**Layout guidance:** Favor a maximum content width around 1200–1440 px with fluid side gutters. Alternate visual rhythm intentionally; do not force identical section templates.

## Skill 04 — Motion choreography
**Goal:** cinematic restraint and smooth perceived quality, not constant movement.

| Interaction | Preferred effect | Approximate duration |
|---|---|---|
| Hero eyebrow | fade/translate 8–12px | 0.45–0.65s |
| Hero headline | line/clip reveal or fade-up | 0.65–0.95s |
| Supporting copy/CTA | gentle stagger | 0.4–0.7s |
| Portrait | opacity + modest mask reveal | 0.75–1.1s |
| Section entrance | opacity + translate 12–24px | 0.5–0.8s |
| Buttons/links | color/underline/arrow | 0.18–0.3s |
| Route transition | minimal fade | 0.15–0.35s |

**Implementation rules**
- Prefer CSS transitions for simple interactions and Motion for coordinated reveals.
- Use GSAP only for a demonstrable need; register/cleanup ScrollTrigger instances.
- Animate opacity and transform where possible; avoid repeated forced layout.
- Trigger reveals once unless repeat behavior adds value.
- Do not delay readability or keyboard interaction for animation.
- Respect `prefers-reduced-motion: reduce` with no parallax or large travel.
- Do not use scroll-jacking, dramatic pinning, infinite background motion, or cursor gimmicks.

## Skill 05 — Architectural imagery and asset handling
- Prioritize supplied original Katrina portrait and logo; never replace the agent's identity with a generic stock model.
- Use premium architectural imagery with consistent warmth, light, and restrained editing.
- Avoid implying stock homes are actual listings.
- Maintain aspect ratios; use intentional `object-position` crops and responsive `picture`/`srcset` when useful.
- Provide descriptive alt text for informative imagery; use empty alt for purely decorative imagery.
- Preload/prioritize the primary hero image; lazy-load below-fold images.
- If assets are missing, use clearly marked placeholders and list required replacements in the handoff.

## Skill 06 — Responsive art direction
**Widths to verify:** 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px.

- **Small mobile:** one column, deliberate portrait crop, 16px minimum body copy, comfortable side padding, touch-friendly CTAs.
- **Tablet:** rebalance image/text ratio; avoid awkward narrow columns.
- **Desktop:** generous whitespace, purposeful asymmetry, readable text measure.
- **Large desktop:** constrain content and scale type/spacing elegantly instead of stretching lines indefinitely.
- Test mobile menu, timelines, form fields, and image clipping at each width.
- Avoid horizontal overflow and absolute positioning that breaks at narrow widths.

## Skill 07 — Accessible navigation and forms
- Semantic `header`, `nav`, `main`, `section`, `footer` and a single logical page-level H1.
- Sticky navigation with accessible active state; mobile menu has proper expanded state, keyboard access, Escape close, and focus restoration.
- Use visible `:focus-visible` styling on all interactive controls.
- Every field has a persistent label, suitable autocomplete, inline validation, and error association.
- Contact fields: Full name, Email, Phone, Buying/selling status, Preferred area, Timeline, Message.
- Status choices: Looking to buy; Looking to sell; Both buying and selling.
- Timeline choices: As soon as possible; Within 3 months; Within 6 months; More than 6 months.
- Do not silently submit, send, store, or discard user data. Until connected, communicate clearly that online inquiry delivery is unavailable.

## Skill 08 — Frontend architecture and maintainability
- Preferred stack: React, Vite, TypeScript, Tailwind CSS; Motion for React; GSAP only when justified.
- Respect the existing project stack if already established.
- Keep design tokens centralized and route-specific copy in maintainable data/components.
- Reuse buttons, nav, footer, section heading, contact form, and motion primitives.
- Do not turn every editorial section into the same generic card component.
- Avoid unnecessary dependencies, duplicated animation logic, and tightly coupled form integration.
- Add an explicit integration boundary for future contact-form delivery, but no backend now.

## Skill 09 — SEO, speed, and quality assurance
- Distinct title/meta description per route; logical headings; descriptive alt text; sensible internal linking.
- Use only verified structured data. Do not invent brokerage, address, awards, sales history, or social handles.
- Aim for Lighthouse Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+ as targets, not guarantees.
- Avoid CLS through reserved image dimensions and font-loading strategy.
- Check navigation, back/forward behavior, email/phone links, form validation, responsive breakpoints, reduced motion, and production build.
- Report untested items honestly.

## Skill 10 — Self-review and redesign loop
Before finishing each page, answer:
1. Does the page have a recognizable real estate identity and clear purpose?
2. Is the typography hierarchy genuinely editorial and legible?
3. Are gold accents restrained and brand colors exact?
4. Does the composition differ meaningfully from the preceding page?
5. Is all published copy exactly client-approved, with proposed additions withheld until approved?
6. Does every CTA lead somewhere real?
7. Are motion and image treatments tasteful and performant?
8. Does mobile feel intentionally designed?
9. Is the page keyboard-accessible and usable with reduced motion?
10. Did the actual build and route checks pass?

If the page looks like a generic generated template, revise the composition—not merely the colors.

## Agent handoff format
At the end of an implementation task, provide:
- **Implemented:** pages/components and key visual decisions.
- **Validated:** commands run and breakpoints/interactions actually tested.
- **Needs client assets:** original logo, approved Katrina portrait, approved architecture images, brokerage disclosure if required.
- **Not implemented by design:** backend, form delivery, CRM, MLS/IDX, database, authentication.
- **Next step:** highest-impact remaining frontend refinement.
