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
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByText('Please enter your full name.', { exact: true })).toBeVisible();
    assert.equal(submissions, 0);
    await page.getByLabel('Full name').fill('Local regression test');
    await page.getByLabel('Email *', { exact: true }).fill('sample@example.com');
    await page.getByLabel('Phone', { exact: false }).fill('416 555 0100');
    await page.getByLabel('Buying/selling status').selectOption('Looking to buy');
    await page.getByLabel('Preferred area').fill('Toronto');
    await page.getByLabel('Timeline', { exact: true }).selectOption('Within 3 months');
    await page.getByLabel('Message', { exact: true }).fill('Mocked button test; no email sent.');
    await button.click();
    await expect(page.getByRole('button', { name: 'Sending...', exact: true })).toBeDisabled();
    await expect.poll(() => typeof release).toBe('function');
    release();
    await expect(page.getByRole('status')).toContainText('could not confirm');
    await expect(button).toBeEnabled();
    await expect(page.getByLabel('Full name')).toHaveValue('Local regression test');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toContainText('accepted for sending');
    await expect(button).toBeEnabled();
    assert.equal(submissions, 2);
    assert.equal(readinessChecks, 0);
    await page.close();
  }
  console.log('Send Inquiry works by mouse and keyboard on mobile and desktop; validates fields, disables only during sending, and re-enables after failure/success. Setup readiness cannot block clicks. All requests mocked; no email sent.');
} finally {
  await browser.close();
}
