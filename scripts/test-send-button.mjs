import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    let readinessChecks = 0;
    let submissions = 0;
    let release;
    await page.route('**/api/inquiry', async route => {
      if (route.request().method() === 'GET') {
        readinessChecks++;
        return route.fulfill({ json: { available: false } });
      }
      submissions++;
      if (submissions === 1) {
        await new Promise(resolve => { release = resolve; });
        return route.fulfill({ status: 503, json: { ok: false } });
      }
      return route.fulfill({ json: { ok: true } });
    });
    await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:5173'}/contact`);
    const button = page.getByRole('button', { name: 'Send Inquiry', exact: true });
    const clickSend = async () => {
      await button.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(800);
      await button.click();
    };
    await expect(button).toBeEnabled();
    await clickSend();
    await expect(page.getByText('Please enter your full name.', { exact: true })).toBeVisible();
    assert.equal(submissions, 0);
    await page.getByLabel('Full name').fill('Local regression test');
    await page.getByLabel('Email *', { exact: true }).fill('sample@example.com');
    await page.getByLabel('Phone', { exact: false }).fill('416 555 0100');
    await page.getByLabel('Buying/selling status').selectOption('Looking to buy');
    await page.getByLabel('Preferred area').fill('Toronto');
    await page.getByLabel('Timeline', { exact: true }).selectOption('Within 3 months');
    await page.getByLabel('Message', { exact: true }).fill('Mocked button test; no email sent.');
    await clickSend();
    await expect(page.getByRole('button', { name: 'Sending...', exact: true })).toBeDisabled();
    await expect.poll(() => typeof release).toBe('function');
    release();
    await expect(page.getByRole('status')).toContainText('could not confirm');
    await expect(button).toBeEnabled();
    await expect(page.getByLabel('Full name')).toHaveValue('Local regression test');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/thank-you$/);
    await expect(page.getByRole('heading', { name: 'Thank you.', exact: true })).toBeVisible();
    await expect(page.getByText('Your inquiry has been accepted for sending to Katrina.', { exact: true })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('.page-transition')).toHaveCSS('opacity', '1');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `.verification/thank-you-${width}.png` });
    await page.getByRole('link', { name: 'Return Home', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await page.locator('footer a[href="/contact"]').click();
    await expect(page.getByLabel('Full name')).toHaveValue('');
    // Opening a confirmation URL without this session's acceptance redirects safely.
    await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:5173'}/thank-you`);
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole('heading', { name: 'Thank you.', exact: true })).toHaveCount(0);
    assert.equal(submissions, 2);
    assert.equal(readinessChecks, 0);
    await page.close();
  }
  console.log('Mobile and desktop: validation, pending state, failure recovery, confirmed thank-you navigation, cleared draft, return link, metadata and direct-visit guard pass. All requests mocked; no email sent.');
} finally {
  await browser.close();
}
