import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Screenshots for 03-reporting/01-project-reports.md (Memorias de Proyectos).
 * Separate spec to keep docs-screenshots.spec.ts under the 500-line limit.
 * Run:  npm run screenshots -- project-reports   (frontend :5173, API :8080)
 *
 * Roles shown: Reviewer (creates), Contributor (read-only).
 */
const BASE = process.env.APP_URL ?? 'http://localhost:5173';
const GROUP = process.env.GROUP_SLUG ?? 'nanotech-lab';
const PROJECT = process.env.PROJECT_ID ?? '01a0f8bd-5f4f-7d8a-9a79-671187d325dc';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'Demo1234!';
const OUT = 'static/img/docs/03-reporting';
const LIST = `${BASE}/${GROUP}/projects/${PROJECT}/reports`;

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

async function openList(page: Page) {
  await page.goto(LIST);
  await settle(page);
  await expect(page.locator('table')).toBeVisible();
}

const reportLinks = (page: Page) => page.locator('table tbody tr a[href*="/reports/"]');

/** Creates a report through the UI when the demo project has none. */
async function ensureReport(page: Page) {
  await openList(page);
  if ((await reportLinks(page).count()) > 0) return;
  await page.getByRole('link', { name: 'Nuevo informe' }).click();
  await page.waitForURL(/\/reports\/new$/);
  await settle(page);
  await page.locator('textarea').fill('Justificación del primer periodo.');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.waitForURL(/\/reports\/(?!new)[^/]+$/);
  await settle(page);
  await openList(page);
}

test('01 reviewer list', async ({ page }) => {
  await reviewer(page);
  await ensureReport(page);
  await expect(reportLinks(page).first()).toBeVisible();
  await page.mouse.move(700, 850);
  await shot(page, `${OUT}/08-project-reports-list.png`);
});

test('02 reviewer new report form', async ({ page }) => {
  await reviewer(page);
  await openList(page);
  await page.getByRole('link', { name: 'Nuevo informe' }).click();
  await page.waitForURL(/\/reports\/new$/);
  await settle(page);
  await highlight(page.locator('input[type=date]').first());
  await highlight(page.locator('input[type=date]').nth(1));
  await page.mouse.move(700, 850);
  await shot(page, `${OUT}/09-project-report-new.png`);
});

test('03 + 04 reviewer detail and export', async ({ page }) => {
  await reviewer(page);
  await ensureReport(page);
  await reportLinks(page).first().click();
  await page.waitForURL(/\/reports\/(?!new)[^/]+$/);
  await expect(page.getByText('Datos del proyecto').first()).toBeVisible({ timeout: 20_000 });
  await settle(page);
  await page.mouse.move(700, 850);
  await shot(page, `${OUT}/10-project-report-detail.png`);

  await page.getByRole('button', { name: 'Vista previa' }).click();
  await page.waitForTimeout(600);
  const exportBox = page.getByRole('heading', { name: 'Exportación' }).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
  await exportBox.scrollIntoViewIfNeeded();
  await highlight(exportBox);
  await page.mouse.move(700, 850);
  await page.getByRole('button', { name: 'Ocultar vista previa' }).click();
  await page.waitForTimeout(300);
  await exportBox.screenshot({ path: `${OUT}/11-project-report-export.png` });
});

test('05 contributor list (read-only)', async ({ page }) => {
  await contributor(page);
  await openList(page);
  await expect(reportLinks(page).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nuevo informe' })).toHaveCount(0);
  await page.mouse.move(700, 850);
  await shot(page, `${OUT}/12-project-reports-contributor.png`);
});
