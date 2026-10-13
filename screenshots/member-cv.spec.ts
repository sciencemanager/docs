import { test, expect, type Page } from '@playwright/test';

/**
 * Screenshots for docs/02-core-features/11-member-cv.md.
 * Run:  npm run screenshots -- member-cv   (frontend :5173, API :8080, demo fixtures loaded)
 * Needs at least one CV on the member (create it through the builder or POST /api/team-members/{id}/cvs).
 * Everything is captured as a Reviewer, who can view, generate and download but not delete.
 */
const BASE = process.env.APP_URL ?? 'http://localhost:5173';
const GROUP = process.env.GROUP_SLUG ?? 'nanotech-lab';
const MEMBER = process.env.DOCS_MEMBER ?? 'carlos-garcia';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'Demo1234!';
const OUT = 'static/img/docs/02-core-features';
const CV = `${BASE}/${GROUP}/teams/${MEMBER}/cv`;

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', locale: 'es-ES' });

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 15_000 });
}

async function shot(page: Page, path: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1440, height: Math.max(900, h) });
  await page.waitForTimeout(300);
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await page.goto(`${BASE}/auth/login`);
  await page.locator('#email').fill('reviewer@sciencemanager.demo');
  await page.locator('#userpwd').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(new RegExp(`/${GROUP}`), { timeout: 20_000 });
  await page.goto(CV);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  await page.mouse.move(700, 700);
});

test('63 cv history', async ({ page }) => {
  await shot(page, `${OUT}/63-member-cv-history.png`);
});

test('64 + 65 cv builder top and selection tables', async ({ page }) => {
  await page.getByRole('button', { name: 'Generar nuevo CV' }).click();
  await settle(page);
  await expect(page.locator('#cv-title')).toBeVisible();
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/64-member-cv-builder.png`);

  // Open the publications table and tick the first rows.
  await page.getByRole('button', { name: /C\.1 Publicaciones/ }).click();
  await page.waitForTimeout(500);
  const boxes = page.locator('table tbody tr').getByRole('checkbox');
  const n = Math.min(3, await boxes.count());
  for (let i = 0; i < n; i++) await boxes.nth(i).click();
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/65-member-cv-builder-selection.png`);
});

test('66 cv download dialog', async ({ page }) => {
  await page.getByRole('button', { name: 'Descargar Word' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(500);
  await page.mouse.move(10, 10);
  await page.screenshot({ path: `${OUT}/66-member-cv-download.png` });
});

test('67 cv preview', async ({ page }) => {
  await page.getByRole('button', { name: 'Vista previa' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.mouse.move(10, 10);
  await page.screenshot({ path: `${OUT}/67-member-cv-preview.png` });
});
