import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
const output = '.verification';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const runtimeErrors = [];
const failedResources = [];
page.on('pageerror', error => runtimeErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`); });

const routes = ['/', '/about', '/for-sellers', '/for-buyers', '/contact'];
const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const report = { responsive: [], accessibility: [], functional: [] };

async function settleImages() {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => {
      image.loading = 'eager';
      try { await image.decode(); } catch { /* Broken images are reported below. */ }
    }));
  });
}

for (const width of widths) {
  await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    await settleImages();
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      headings: document.querySelectorAll('h1').length,
      brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src),
      outside: [...document.querySelectorAll('main h1, main h2, main h3, main p, main a, input, select, textarea')]
        .filter(element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1); })
        .map(element => ({ text: element.textContent?.slice(0, 65), class: element.className })),
    }));
    report.responsive.push({ width, route, ...state });
    if (width === 390 || width === 1440) {
      const name = route === '/' ? 'home' : route.slice(1);
      await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      report.accessibility.push({ width, route, violations: results.violations.map(item => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.map(node => node.target) })) });
    }
    console.log(`Checked ${width}px ${route}: ${state.overflow || state.outside.length ? 'OVERFLOW' : 'layout OK'}`);
  }
}

await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(`${baseUrl}/contact`, { waitUntil: 'networkidle' });
assert.equal(await page.getByRole('button', { name: 'Send Inquiry', exact: true }).isDisabled(), false);
await page.getByRole('button', { name: 'Check my details' }).click();
assert.equal(await page.locator('#inquiry-fullName').getAttribute('aria-invalid'), 'true');
assert.equal(await page.locator('#inquiry-email').getAttribute('aria-invalid'), 'true');
assert.equal(await page.locator('#inquiry-fullName').evaluate(element => element === document.activeElement), true);
await page.getByLabel('Full name', { exact: false }).fill('Alex Morgan');
await page.getByLabel('Email *', { exact: true }).fill('not-an-email');
await page.getByRole('button', { name: 'Check my details' }).click();
assert.match(await page.locator('#inquiry-email-error').textContent(), /valid email/);
await page.getByLabel('Email *', { exact: true }).fill('alex@example.com');
await page.getByLabel('Phone', { exact: false }).fill('416 555 0123');
await page.getByLabel('Buying/selling status').selectOption('Both buying and selling');
await page.getByLabel('Preferred area').fill('Toronto');
await page.getByLabel('Timeline', { exact: true }).selectOption('Within 3 months');
await page.getByLabel('Message', { exact: true }).fill('Looking for a home near a park.');
await page.getByRole('button', { name: 'Check my details' }).click();
assert.match(await page.locator('.form-status').textContent(), /ready to send/);
assert.equal(await page.getByRole('button', { name: 'Send Inquiry', exact: true }).isDisabled(), false);
await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'About', exact: true }).click();
await page.waitForURL('**/about');
await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Contact', exact: true }).click();
await page.waitForURL('**/contact');
assert.equal(await page.getByLabel('Full name', { exact: false }).inputValue(), 'Alex Morgan');
assert.equal(await page.getByLabel('Message', { exact: true }).inputValue(), 'Looking for a home near a park.');
await page.goBack();
assert.equal(new URL(page.url()).pathname, '/about');
await page.goForward();
assert.equal(new URL(page.url()).pathname, '/contact');
const emailLink = page.locator('.contact-details a[href^="https://mail.google.com/mail/"]');
assert.equal(await emailLink.textContent(), 'keysbykatrinaj@gmail.com');
assert.equal(new URL(await emailLink.getAttribute('href')).searchParams.get('to'), 'keysbykatrinaj@gmail.com');
assert.equal(await emailLink.getAttribute('target'), '_blank');
assert.equal(await page.locator('a[href^="mailto:"]').count(), 0);
assert.equal(await page.locator('.contact-details a[href="tel:+14168875670"]').count(), 1);
report.functional.push('Validation, field editing, no false delivery, draft preservation, direct contact links, back and forward navigation');

await page.goto(`${baseUrl}/for-sellers`, { waitUntil: 'networkidle' });
assert.equal(await page.locator('.process-timeline > li').count(), 4);
await page.getByRole('link', { name: 'Free Evaluation', exact: true }).click();
await page.waitForURL('**/contact?interest=sell');
await expect(page.getByLabel('Buying/selling status')).toHaveValue('Looking to sell');
await page.goto(`${baseUrl}/for-buyers`, { waitUntil: 'networkidle' });
assert.equal(await page.locator('.process-timeline > li').count(), 5);
await page.getByRole('link', { name: 'Contact Katrina J.', exact: true }).click();
await page.waitForURL('**/contact?interest=buy');
await expect(page.getByLabel('Buying/selling status')).toHaveValue('Looking to buy');
report.functional.push('All four selling stages, all five buying stages, contextual CTA destinations and form prefill');

await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
const savedScroll = await page.evaluate(() => {
  const target = Math.min(1200, document.documentElement.scrollHeight - innerHeight);
  scrollTo({ top: target, behavior: 'instant' });
  return scrollY;
});
await page.waitForTimeout(200);
await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'About', exact: true }).click();
await page.waitForURL('**/about');
await page.waitForTimeout(300);
assert.ok((await page.evaluate(() => scrollY)) < 3);
await page.goBack();
await page.waitForTimeout(300);
assert.ok(Math.abs((await page.evaluate(() => scrollY)) - savedScroll) < 3);
report.functional.push('Route changes start at the top and browser Back restores the previous scroll position');

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Open navigation' }).click();
assert.equal(await page.locator('dialog').evaluate(element => element.open), true);
assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
assert.equal(await page.getByRole('button', { name: 'Close navigation' }).evaluate(element => element === document.activeElement), true);
for (let i = 0; i < 12; i++) {
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog')), true);
}
const menuAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
report.accessibility.push({ width: 390, route: 'mobile menu', violations: menuAxe.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })) });
await page.screenshot({ path: `${output}/mobile-menu.png` });
await page.keyboard.press('Escape');
assert.equal(await page.locator('dialog').evaluate(element => element.open), false);
assert.equal(await page.evaluate(() => document.body.style.overflow), '');
assert.equal(await page.getByRole('button', { name: 'Open navigation' }).evaluate(element => element === document.activeElement), true);
await page.getByRole('button', { name: 'Open navigation' }).click();
await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'For Buyers', exact: false }).click();
await page.waitForURL('**/for-buyers');
assert.equal(await page.locator('dialog').evaluate(element => element.open), false);
assert.equal(await page.evaluate(() => document.body.style.overflow), '');
report.functional.push('Mobile menu, native focus trap, Escape, focus return, scroll locking and mobile links');

await page.goto(`${baseUrl}/page-that-does-not-exist`, { waitUntil: 'networkidle' });
assert.match(await page.locator('h1').textContent(), /find your way home/);
await page.getByRole('link', { name: 'Return Home' }).click();
await page.waitForURL(baseUrl + '/');
assert.equal(await page.locator('#home-heading').evaluate(element => getComputedStyle(element).opacity), '1');
assert.equal(await page.locator('#home-heading').evaluate(element => getComputedStyle(element).transform), 'none');
report.functional.push('Not-found route and reduced-motion immediate visibility');

report.runtimeErrors = [...new Set(runtimeErrors)];
report.failedResources = [...new Set(failedResources)];
await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
const layoutFailures = report.responsive.filter(item => item.overflow || item.headings !== 1 || item.brokenImages.length || item.outside.length);
const axeFailures = report.accessibility.filter(item => item.violations.length);
console.log(JSON.stringify({ responsiveChecks: report.responsive.length, layoutFailures, accessibilityFailures: axeFailures, runtimeErrors: report.runtimeErrors, failedResources: report.failedResources, functional: report.functional }, null, 2));
if (layoutFailures.length || axeFailures.length || runtimeErrors.length || failedResources.length) process.exitCode = 1;
