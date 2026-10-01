import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Regenerates the dashboard + projects screenshots used by the Docusaurus docs.
 * Run:  npm run screenshots   (frontend on :5173, API on :8080, demo fixtures loaded)
 */
const BASE = process.env.APP_URL ?? 'http://localhost:5173';
const GROUP = process.env.GROUP_SLUG ?? 'nanotech-lab';
const EMAIL = process.env.DOCS_USER ?? 'reviewer@sciencemanager.demo';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'Demo1234!';
const OUT = 'static/img/docs';

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

/** Grows the viewport to the page height so fixed sidebar/header render once, instead of fullPage stitching. */
async function shot(page: Page, path: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1440, height: Math.max(900, h) });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path });
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/auth/login`);
  await page.locator('#email').fill(email);
  await page.locator('#userpwd').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(new RegExp(`/${GROUP}`), { timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await login(page, EMAIL);
});

test('01 dashboard overview', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}`);
  await settle(page);
  await shot(page, `${OUT}/01-getting-started/01-dashboard-overview.png`);
});

test('02 dashboard time selector', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}`);
  await settle(page);
  const toggle = page.getByRole('radiogroup');
  await page.getByRole('radio', { name: '6M' }).click();
  await settle(page);
  await page.mouse.move(700, 700);
  await page.waitForTimeout(800);
  await highlight(toggle);
  await page.screenshot({ path: `${OUT}/01-getting-started/02-dashboard-time-selector.png`, clip: { x: 0, y: 0, width: 1440, height: 520 } });
});

test('03 projects list and filters', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/projects`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await shot(page, `${OUT}/02-core-features/03-projects-list-and-filters.png`);
});

test('04 + 05 new project pending / approved', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/projects/create`);
  await settle(page);
  await page.locator('#title').fill('Materiales nanoestructurados para almacenamiento de energía');
  await page.locator('#projectCode').fill('PID2025-123456NB-I00');
  await page.locator('#acronym').fill('NANOSTOR');
  await shot(page, `${OUT}/02-core-features/04-project-new-pending.png`);

  await page.locator('#status').selectOption('approved');
  await expect(page.locator('#finalAmount')).toBeVisible();
  for (const id of ['startDate', 'endDate', 'finalAmount', 'economicId']) await highlight(page.locator(`#${id}`));
  await shot(page, `${OUT}/02-core-features/05-project-new-approved.png`);
});

test('06 + 07 publications list and filters', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/publications`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/06-publications-list.png`);

  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await shot(page, `${OUT}/02-core-features/07-publications-filters.png`);
});

test('08 new publication from DOI', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/publications/new`);
  await settle(page);
  await page.getByPlaceholder('10.1000/xyz123').fill('10.1038/s41586-020-2649-2');
  await highlight(page.getByPlaceholder('10.1000/xyz123'));
  await shot(page, `${OUT}/02-core-features/08-publication-new-doi.png`);
});

test('09 publication detail', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/publications`);
  await settle(page);
  await page.locator('table tbody tr').first().click();
  await page.waitForURL(/\/publications\/[^/]+$/);
  await expect(page.getByText('Cargando publicación')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText('Proyectos asociados')).toBeVisible();
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/09-publication-detail.png`);
});

test('10 new publication manual (Manager)', async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await login(page, 'manager@sciencemanager.demo');
  await page.goto(`${BASE}/${GROUP}/publications/new-manual`);
  await settle(page);
  await page.locator('#title').fill('Síntesis de nanopartículas para almacenamiento de energía');
  await page.locator('#year').fill('2025');
  await shot(page, `${OUT}/02-core-features/10-publication-new-manual.png`);
});
