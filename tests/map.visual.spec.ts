import { test, expect } from '@playwright/test';

async function gotoMap(page, style: 'default'|'satellite') {
  // Seed localStorage for instant style and fixed camera
  await page.addInitScript(({ s, last }) => {
    try { localStorage.setItem('map:style_key', s); } catch {}
    try { localStorage.setItem('map:last_view', JSON.stringify(last)); } catch {}
  }, {
    s: style,
    last: { center: [-0.1276, 51.5074], zoom: 12, pitch: 0, bearing: 0 },
  });
  await page.goto('/map?__e2e=1', { waitUntil: 'domcontentloaded' });
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15000 });
  // Small settle to finish first paint
  await page.waitForTimeout(800);
  return canvas;
}

test.describe('Map visual snapshots (styles)', () => {
  for (const style of ['default','satellite'] as const) {
    test(`style ${style}`, async ({ page }) => {
      const canvas = await gotoMap(page, style);
      const screenshot = await canvas.screenshot({ type: 'png' });
      expect(screenshot).toMatchSnapshot(`map-${style}.png`, { maxDiffPixelRatio: 0.03 });
    });
  }
});


