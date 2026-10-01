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

// ── Events and contributions (11–18) ─────────────────────────────────────────

/** Opens the first event of the given type (row badge text) that has contributions. */
async function openEvent(page: Page, typeLabel: 'Congreso' | 'Divulgación') {
  await page.goto(`${BASE}/${GROUP}/events`);
  await settle(page);
  const rows = page.locator('table tbody tr').filter({ hasText: typeLabel });
  await expect(rows.first()).toBeVisible();
  const withContributions = rows.filter({ hasNot: page.locator('td:last-child:has-text("0")') });
  await ((await withContributions.count()) > 0 ? withContributions.first() : rows.first()).click();
  await page.waitForURL(/\/events\/[^/]+$/);
  await expect(page.getByText(/Nº de contribuciones: \d/)).toBeVisible({ timeout: 15_000 });
  await settle(page);
  return page.url().split('/events/')[1];
}

test('11 + 12 events list and filters', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/events`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/11-events-list.png`);

  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await shot(page, `${OUT}/02-core-features/12-events-filters.png`);
});

test('13 + 14 new event conference / divulgation', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/events/new`);
  await settle(page);
  await page.locator('input').first().fill('Congreso Nacional de Nanotecnología 2026');
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/13-event-new.png`);

  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Divulgación' }).click();
  const channel = page.getByRole('combobox').filter({ hasText: 'Canal de divulgación' });
  await expect(channel).toBeVisible();
  await highlight(channel);
  await shot(page, `${OUT}/02-core-features/14-event-new-divulgation.png`);
});

test('15 event detail', async ({ page }) => {
  await openEvent(page, 'Congreso');
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/15-event-detail.png`);
});

test('16 + 17 new contribution conference / divulgation', async ({ page }) => {
  const confId = await openEvent(page, 'Congreso');
  await page.goto(`${BASE}/${GROUP}/events/${confId}/contributions/new`);
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/16-contribution-new-conference.png`);

  const divId = await openEvent(page, 'Divulgación');
  await page.goto(`${BASE}/${GROUP}/events/${divId}/contributions/new`);
  await settle(page);
  await page.getByPlaceholder('Buscar autores por nombre…').fill('Manzanares');
  await page.getByText('Manzanares, Laura').first().click();
  await page.keyboard.press('Escape');
  const role = page.getByRole('combobox', { name: 'Rol' }).first();
  await expect(role).toBeVisible();
  await highlight(role);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/17-contribution-new-divulgation.png`);
});

test('18 contribution detail with economic data', async ({ page }) => {
  await openEvent(page, 'Congreso');
  await page.locator('table tbody tr').first().click();
  await page.waitForURL(/\/contributions\/[^/]+$/);
  await expect(page.getByRole('heading', { name: 'Datos económicos' })).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/18-contribution-detail.png`);
});

// ── Estancias (profile/stays) ────────────────────────────────────────────────
const STAYS = `${BASE}/${GROUP}/profile/stays`;

test('11 + 12 stays list and filters', async ({ page }) => {
  await page.goto(STAYS);
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/11-stays-list.png`);

  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await shot(page, `${OUT}/02-core-features/12-stays-filters.png`);
});

test('13 new stay form', async ({ page }) => {
  await page.goto(`${STAYS}/new`);
  await settle(page);
  await page.locator('input[type=date]').nth(0).fill('2025-09-01');
  await page.locator('input[type=date]').nth(1).fill('2025-12-01');
  await page.locator('textarea').fill('Caracterización de materiales nanoestructurados en el laboratorio de acogida.');
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/13-stay-new.png`);
});

test('14 stay detail', async ({ page }) => {
  await page.goto(STAYS);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await page.locator('table tbody tr').first().click();
  await page.waitForURL(/\/profile\/stays\/[^/]+$/);
  await expect(page.getByText('Fecha de inicio')).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/14-stay-detail.png`);
});

test('19 + 20 academic direction list and filters', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/academic-direction`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/19-academic-direction-list.png`);

  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await shot(page, `${OUT}/02-core-features/20-academic-direction-filters.png`);
});

test('21 academic direction detail', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/academic-direction`);
  await settle(page);
  await page.locator('table tbody tr').first().click();
  await page.waitForURL(/\/academic-direction\/[^/]+$/);
  await settle(page);
  await expect(page.getByText('Universidad o institución').first()).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/21-academic-direction-detail.png`);
});

test('22 new academic direction study (Manager)', async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await login(page, 'manager@sciencemanager.demo');
  await page.goto(`${BASE}/${GROUP}/academic-direction/new`);
  await settle(page);
  await page.locator('#study-work-title').waitFor({ state: 'visible' });
  await highlight(page.locator('#study-work-title'));
  await shot(page, `${OUT}/02-core-features/22-academic-direction-new.png`);
});
