import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Screenshots for docs/02-core-features/06-employment-records.md.
 * Run:  npm run screenshots -- employment   (frontend :5173, API :8080, demo fixtures loaded)
 * Needs a Manager: Reviewers see the buttons but the API rejects create/edit/addendum.
 */
const BASE = process.env.APP_URL ?? 'http://localhost:5173';
const GROUP = process.env.GROUP_SLUG ?? 'nanotech-lab';
const EMAIL = process.env.DOCS_USER ?? 'manager@sciencemanager.demo';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'Demo1234!';
const OUT = 'static/img/docs/02-core-features';
const LIST = `${BASE}/${GROUP}/teams/employment-records`;

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', locale: 'es-ES' });

async function highlight(el: Locator) {
  await el.evaluate((n) => {
    (n as HTMLElement).style.outline = '3px solid #10b981';
    (n as HTMLElement).style.outlineOffset = '3px';
    (n as HTMLElement).style.borderRadius = '8px';
  });
}

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

async function pick(page: Page, trigger: Locator, option: string | RegExp) {
  await trigger.click();
  await page.getByRole('option', { name: option }).first().click();
  await page.waitForTimeout(200);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await page.goto(`${BASE}/auth/login`);
  await page.locator('#email').fill(EMAIL);
  await page.locator('#userpwd').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(new RegExp(`/${GROUP}`), { timeout: 20_000 });
});

test('41 + 42 employment records list and filters', async ({ page }) => {
  await page.goto(LIST);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/41-employment-list.png`);
  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/42-employment-filters.png`);
});

test('43 employment record detail', async ({ page }) => {
  await page.goto(LIST);
  await settle(page);
  await page.locator('table tbody tr').nth(3).click();
  await page.waitForURL(/employment-records\/[^/]+$/);
  await expect(page.getByText('Fecha de Inicio')).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/43-employment-detail.png`);
});

test('44 + 45 new employment record form', async ({ page }) => {
  await page.goto(`${LIST}/new`);
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/44-employment-new.png`);

  const combos = page.getByRole('combobox');
  await pick(page, combos.filter({ hasText: /Vinculación Temporal/ }), /Profesorado Permanente/);
  await page.mouse.move(700, 700);
  await highlight(page.locator('input[type=date][disabled]'));
  await shot(page, `${OUT}/45-employment-new-permanent.png`);
});

test('46 add addendum dialog', async ({ page }) => {
  await page.goto(LIST);
  await settle(page);
  await page.locator('table tbody tr').first().locator('button').click();
  await page.getByRole('menuitem', { name: 'Añadir Adenda' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/46-employment-addendum.png` });
});
