import { test, expect } from '@playwright/test';

test('auth → onboarding → map', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    test.skip(true, 'E2E_USER_EMAIL/E2E_USER_PASSWORD not set');
  }

  // Try login first (account may already exist)
  await page.goto('/login');
  await page.getByLabel('Email').fill(email!);
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForLoadState('domcontentloaded');

  // If we landed on signup due to project settings, try creating the account
  if (page.url().includes('/login')) {
    await page.goto('/signup');
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: /sign up/i }).click();
    // If email confirmation is required, we can't proceed; skip
    if (!page.url().includes('/onboarding')) {
      test.skip(true, 'Signup requires email confirmation in this project');
    }
  }

  // Either we’re on /map already or /onboarding; if /map, assert canvas and finish
  if (page.url().includes('/map')) {
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
    return;
  }

  // Onboarding step 1
  await expect(page).toHaveURL(/onboarding/);
  await page.getByLabel('Display name').fill('E2E Tester');
  await page.getByRole('button', { name: /save & continue/i }).click();

  // Step 2
  await page.getByLabel('City').fill('London');
  const tzInput = page.getByLabel('Timezone');
  await tzInput.fill('Europe/London');
  await page.getByRole('button', { name: /save & continue/i }).click();

  // Step 3 (no required fields)
  await page.getByRole('button', { name: /finish/i }).click();

  // Expect map
  await page.waitForURL(/\/map/);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
});


