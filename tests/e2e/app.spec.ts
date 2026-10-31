import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function openFromMarkerList(page: Page, name: RegExp): Promise<void> {
  const list = page.getByRole('list', { name: 'Temples on the map' });
  // Built once the map has loaded, which takes a while under software WebGL.
  await expect(list).toBeAttached({ timeout: 45_000 });
  // The list is visually hidden for screen-reader and keyboard users, so activate it from the keyboard.
  await list.getByRole('button', { name }).focus();
  await page.keyboard.press('Enter');
}

async function seriousViolations(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('the map renders and the marker list opens Mahakaleshwar', async ({ page }) => {
  // Waits for the full map load and a camera flight, which are slow under software WebGL.
  test.slow();
  await page.goto('./');
  await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
  await openFromMarkerList(page, /^Mahakaleshwar \(Ujjain\), Jyotirlinga$/);
  await expect(page.locator('#temple-sheet-title')).toHaveText(/Mahakaleshwar/);
  await expect(page).toHaveURL(/#\/mahakaleshwar$/);
});

test('switching to Hindi changes the title and survives a reload', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /^Language: / }).click();
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('शिव-शक्ति');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('शिव-शक्ति');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
});

test('the theme toggle switches theme and survives a reload', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  const after = before === 'dark' ? 'light' : 'dark';
  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
  await expect(html).toHaveAttribute('data-theme', after);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after);
});

test('a temple deep link opens its sheet', async ({ page }) => {
  await page.goto('./#/kedarnath');
  await expect(page.locator('#temple-sheet-title')).toHaveText(/Kedarnath/);
});

test('an unknown temple link shows the not-found notice and the map', async ({ page }) => {
  await page.goto('./#/xyz');
  await expect(page.getByRole('status')).toContainText('We could not find that temple.');
  await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
  await expect(page.locator('#temple-sheet-title')).toHaveCount(0);
});

for (const l of ['ta', 'te'] as const) {
  test(`no horizontal scroll at 320 px in ${l} with the sheet open`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.evaluate((v) => localStorage.setItem('lang', v), l);
    // A hash-only navigation keeps the running page, so reload to pick up the stored language.
    await page.goto('./#/mahakaleshwar');
    await page.reload();
    await expect(page.locator('#temple-sheet-title')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', l);
    await expect(page.getByRole('banner')).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(320);
  });
}

for (const t of ['dark', 'light'] as const) {
  test(`no serious or critical axe violations in the ${t} theme`, async ({ page }) => {
    await page.evaluate((v) => localStorage.setItem('theme', v), t);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', t);
    await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
    expect(await seriousViolations(page), 'map').toEqual([]);
    await page.goto('./#/kamakhya');
    await expect(page.locator('#temple-sheet-title')).toBeVisible();
    expect(await seriousViolations(page), 'sheet').toEqual([]);
  });
}
