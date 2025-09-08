import { test, expect } from '@playwright/test';

test('login → onboarding → map', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL || 'test+e2e@example.com';
  const password = process.env.E2E_USER_PASSWORD || 'password123';

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Either land on /map or be redirected to /onboarding
  await page.waitForLoadState('domcontentloaded');
  const url = page.url();
  if (url.includes('/onboarding')) {
    // Step 1: display name and optional avatar
    await page.getByLabel('Display name').fill('E2E Tester');
    await page.getByRole('button', { name: /save & continue/i }).click();
    // Step 2: city + timezone
    await page.getByLabel('City').fill('London');
    await page.getByLabel('Timezone').fill('Europe/London');
    await page.getByRole('button', { name: /save & continue/i }).click();
    // Step 3: finish
    await page.getByRole('button', { name: /finish/i }).click();
  }

  // Expect map visible
  await page.waitForURL(/\/map/);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
});


