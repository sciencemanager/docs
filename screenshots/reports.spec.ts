import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Screenshots for 03-reporting/02-group-reports.md (Informes del grupo).
 * Separate spec to keep docs-screenshots.spec.ts under the 500-line limit.
 * Run:  npm run screenshots -- reports   (frontend :5173, API :8080, messenger worker up)
 *
 * Roles shown: Reviewer (generates), Contributor (read-only), Manager (deletes).
 */
const BASE = process.env.APP_URL ?? 'http://localhost:5173';
const GROUP = process.env.GROUP_SLUG ?? 'nanotech-lab';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'Demo1234!';
const OUT = 'static/img/docs/03-reporting';
const REPORTS = `${BASE}/${GROUP}/group-reports`;

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

async function loginAs(page: Page, email: string) {
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await page.goto(`${BASE}/auth/login`);
  await page.locator('#email').fill(email);
  await page.locator('#userpwd').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(new RegExp(`/${GROUP}`), { timeout: 20_000 });
}

const reviewer = (page: Page) => loginAs(page, 'reviewer@sciencemanager.demo');
const contributor = (page: Page) => loginAs(page, 'researcher0@sciencemanager.demo');
const manager = (page: Page) => loginAs(page, 'manager@sciencemanager.demo');

/** In-app navigation (sidebar), not page.goto: a full reload loses the group UUID the reports API needs. */
async function openList(page: Page) {
  await page.getByRole('link', { name: 'Informes del grupo' }).first().click();
  await page.waitForURL(/\/group-reports$/);
  await settle(page);
}

/** Generates a report through the UI (the demo fixtures contain none) and waits for the worker to finish it. */
async function generateReport(page: Page) {
  await openList(page);
  await page.getByRole('link', { name: 'Generar informe' }).click();
  await page.waitForURL(/\/group-reports\/new$/);
  const dates = page.locator('input[type=date]');
  await dates.nth(0).fill('2024-01-01');
  await dates.nth(1).fill('2025-12-31');
  await page.getByRole('button', { name: 'Generar informe' }).last().click();
  await page.waitForURL(/\/group-reports\/(?!new)[^/]+$/);
  await expect(page.getByText('Completado')).toBeVisible({ timeout: 45_000 });
}

/** Opens the first report of the list, creating one first if the list is empty. */
async function openFirstReport(page: Page) {
  await openList(page);
  if ((await page.locator('table tbody tr a[href*="/group-reports/"]').count()) === 0) {
    await generateReport(page);
    return;
  }
  await page.locator('table tbody tr a[href*="/group-reports/"]').first().click();
  await page.waitForURL(/\/group-reports\/(?!new)[^/]+$/);
  await expect(page.getByText('Completado')).toBeVisible({ timeout: 45_000 });
}

test('01 reviewer new report form', async ({ page }) => {
  await reviewer(page);
  await openList(page);
  await page.getByRole('link', { name: 'Generar informe' }).click();
  await page.waitForURL(/\/group-reports\/new$/);
  await settle(page);
  const dates = page.locator('input[type=date]');
  await dates.nth(0).fill('2024-01-01');
  await dates.nth(1).fill('2025-12-31');
  await highlight(page.locator('input[type=date]').first());
  await highlight(page.locator('input[type=date]').nth(1));
  await page.mouse.move(700, 800);
  await shot(page, `${OUT}/01-group-report-new.png`);
});

test('02 + 03 reviewer list and filters', async ({ page }) => {
  await reviewer(page);
  await openFirstReport(page);
  await openList(page);
  await expect(page.locator('table tbody tr a[href*="/group-reports/"]').first()).toBeVisible();
  await page.mouse.move(700, 800);
  await shot(page, `${OUT}/02-group-reports-list.png`);
  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(400);
  await page.mouse.move(700, 800);
  await shot(page, `${OUT}/03-group-reports-filters.png`);
});

test('04 + 05 reviewer detail and export', async ({ page }) => {
  await reviewer(page);
  await openFirstReport(page);
  await settle(page);
  await page.mouse.move(700, 800);
  await shot(page, `${OUT}/04-group-report-detail.png`);
  await page.getByRole('button', { name: 'Vista previa' }).click();
  await page.waitForTimeout(500);
  const exportBox = page.getByRole('heading', { name: 'Exportación' }).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
  await exportBox.scrollIntoViewIfNeeded();
  await highlight(exportBox);
  await page.mouse.move(700, 800);
  await shot(page, `${OUT}/05-group-report-export.png`);
});

test('06 contributor list (read-only)', async ({ page }) => {
  await contributor(page);
  await openList(page);
  await expect(page.locator('table tbody tr a[href*="/group-reports/"]').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Generar informe' })).toHaveCount(0);
  await page.mouse.move(700, 800);
  await shot(page, `${OUT}/06-group-reports-contributor.png`);
});

test('07 manager row menu with delete', async ({ page }) => {
  await manager(page);
  await openList(page);
  const row = page.locator('table tbody tr').first();
  await expect(row).toBeVisible();
  await row.locator('button[title="Acciones"]').click();
  await expect(page.getByRole('menuitem', { name: 'Eliminar' })).toBeVisible();
  await page.mouse.move(700, 850);
  await shot(page, `${OUT}/07-group-reports-manager-menu.png`);
});
