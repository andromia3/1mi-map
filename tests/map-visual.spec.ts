import { test, expect } from '@playwright/test';

async function gotoMapWithStyle(page, style: 'default'|'night'|'satellite') {
  // Bypass auth in middleware via __e2e flag and pre-set localStorage for instant style
  await page.addInitScript((s) => { try { localStorage.setItem('map:style_key', s); } catch {} }, style);
  await page.goto('/map?__e2e=1', { waitUntil: 'domcontentloaded' });
  // Wait for canvas to be present and map to paint
  const canvas = page.locator('canvas');
  await expect(canvas.first()).toBeVisible({ timeout: 15000 });
  // Small settle delay
  await page.waitForTimeout(800);
  return canvas.first();
}

test.describe('Map visual snapshots', () => {
  for (const style of ['default','night','satellite'] as const) {
    test(`style ${style} snapshot`, async ({ page }) => {
      const canvas = await gotoMapWithStyle(page, style);
      // Snapshot of the canvas element
      const screenshot = await canvas.screenshot({ type: 'png' });
      expect(screenshot).toMatchSnapshot(`map-${style}.png`, { maxDiffPixelRatio: 0.03 });
    });
  }
});


