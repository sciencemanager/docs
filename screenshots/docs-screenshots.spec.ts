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
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 15_000 });
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

/** Patents and book chapters share the same list / detail / form layout. */
const OUTPUTS = [
  { slug: 'patents', n: 23, name: 'patent', detailRe: /\/patents\/[^/]+$/, field: 'Número de patente', newId: '#patentNumber' },
  { slug: 'book-chapters', n: 27, name: 'book-chapter', detailRe: /\/book-chapters\/[^/]+$/, field: 'Título del libro', newId: '#bookTitle' },
];

for (const o of OUTPUTS) {
  test(`${o.n} + ${o.n + 1} ${o.slug} list and filters`, async ({ page }) => {
    await page.goto(`${BASE}/${GROUP}/${o.slug}`);
    await settle(page);
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    await page.mouse.move(700, 700);
    await shot(page, `${OUT}/02-core-features/${o.n}-${o.name}s-list.png`);

    await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
    await page.waitForTimeout(300);
    await shot(page, `${OUT}/02-core-features/${o.n + 1}-${o.name}s-filters.png`);
  });

  test(`${o.n + 2} ${o.slug} detail`, async ({ page }) => {
    await page.goto(`${BASE}/${GROUP}/${o.slug}`);
    await settle(page);
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(o.detailRe);
    await expect(page.getByText(o.field).first()).toBeVisible({ timeout: 15_000 });
    await settle(page);
    await expect(page.getByText('Cargando historial')).toHaveCount(0, { timeout: 15_000 });
    // The API does not expose createdAt for these entities yet (UI shows "Invalid Date"); keep it out of the docs image.
    await page.getByText('Creado', { exact: true }).first().locator('xpath=..').evaluate((n) => ((n as HTMLElement).style.visibility = 'hidden'));
    await page.mouse.move(700, 700);
    await shot(page, `${OUT}/02-core-features/${o.n + 2}-${o.name}-detail.png`);
  });

  test(`${o.n + 3} new ${o.name} form`, async ({ page }) => {
    await page.goto(`${BASE}/${GROUP}/${o.slug}/new`);
    await settle(page);
    await page.locator('#title').waitFor({ state: 'visible' });
    await highlight(page.locator('#title'));
    await highlight(page.getByText('Proyectos asociados').first());
    await shot(page, `${OUT}/02-core-features/${o.n + 3}-${o.name}-new.png`);
  });
}

/**
 * Demo fixtures create the sticker Document rows but no stored file, so the
 * authenticated download 404s. Serve a generated sticker instead of touching data.
 */
async function mockStickerPhotos(page: Page) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#e8eef3"/><rect x="90" y="70" width="300" height="180" rx="10" fill="#fff" stroke="#1e8a86" stroke-width="4"/><text x="240" y="130" font-family="Arial" font-size="20" text-anchor="middle" fill="#1e8a86">SCIENCE MANAGER</text><text x="240" y="175" font-family="Arial" font-size="30" font-weight="bold" text-anchor="middle" fill="#222">INV-0042</text><text x="240" y="215" font-family="Arial" font-size="16" text-anchor="middle" fill="#666">Inventario del grupo</text></svg>`;
  await page.route('**/api/documents/*/download', (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg }));
}

/** Infrastructure & inventory: card grid, filters, detail, create and edit forms. */
test('47 + 48 infrastructure list and filters', async ({ page }) => {
  await mockStickerPhotos(page);
  await page.goto(`${BASE}/${GROUP}/infrastructure`);
  await settle(page);
  await expect(page.locator('a[href*="/infrastructure/"]:not([href$="/new"])').first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/47-infrastructure-list.png`);

  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/48-infrastructure-filters.png`);
});

test('49 infrastructure detail', async ({ page }) => {
  await mockStickerPhotos(page);
  await page.goto(`${BASE}/${GROUP}/infrastructure`);
  await settle(page);
  await page.locator('a[href*="/infrastructure/"]:not([href$="/new"])').first().click();
  await page.waitForURL(/\/infrastructure\/[^/]+$/);
  await expect(page.getByText('Foto de la pegatina de inventario')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/49-infrastructure-detail.png`);
});

test('50 new asset form', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/infrastructure/new`);
  await settle(page);
  await page.getByPlaceholder('Denominación oficial del equipo').waitFor({ state: 'visible' });
  await page.getByPlaceholder('Denominación oficial del equipo').fill('Espectrómetro Raman confocal');
  await page.getByPlaceholder('Características técnicas, número de serie…').fill('Láser de 532 nm, número de serie RM-20418.');
  await page.getByPlaceholder('0.00').fill('96500,00');
  await highlight(page.getByText('Foto de la pegatina de inventario').locator('xpath=..'));
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/50-infrastructure-new.png`);
});

test('51 edit asset form', async ({ page }) => {
  await mockStickerPhotos(page);
  await page.goto(`${BASE}/${GROUP}/infrastructure`);
  await settle(page);
  await page.locator('a[href*="/infrastructure/"]:not([href$="/new"])').first().click();
  await page.waitForURL(/\/infrastructure\/[^/]+$/);
  await settle(page);
  await page.goto(`${page.url()}/edit`);
  await settle(page);
  await expect(page.getByText('Sustituir la foto de la pegatina')).toBeVisible({ timeout: 15_000 });
  await highlight(page.getByText('Sustituir la foto de la pegatina').locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]'));
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/51-infrastructure-edit.png`);
});

const TEAM = `${OUT}/02-core-features`;

/** The real @uclm.es account must never appear in a capture (DOCS_PLAYBOOK §4). */
async function hideRealAccount(page: Page) {
  await page.locator('table tbody tr', { hasText: '@uclm.es' }).evaluateAll((rows) => rows.forEach((r) => r.remove()));
}

async function openFirstMember(page: Page, section = '', email = '') {
  await page.goto(`${BASE}/${GROUP}/teams`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  const href = await page
    .locator('table tbody tr', { hasText: email })
    .locator('a[href*="/teams/"]')
    .first()
    .getAttribute('href');
  await page.goto(`${BASE}${href}${section}`);
  await settle(page);
  await page.mouse.move(700, 700);
}

test('35 + 36 team list and filters', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/teams`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await hideRealAccount(page);
  await page.mouse.move(700, 700);
  await shot(page, `${TEAM}/35-team-list.png`);
  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(300);
  await hideRealAccount(page);
  await page.mouse.move(700, 700);
  await shot(page, `${TEAM}/36-team-filters.png`);
});

test('37 team member detail', async ({ page }) => {
  await openFirstMember(page);
  await shot(page, `${TEAM}/37-team-member-detail.png`);
});

test('38 team member academic profile', async ({ page }) => {
  await openFirstMember(page, '/academic-profile');
  await shot(page, `${TEAM}/38-team-member-academic.png`);
});

test('39 employment records list', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/teams/employment-records`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await hideRealAccount(page);
  await page.mouse.move(700, 700);
  await shot(page, `${TEAM}/39-employment-records-list.png`);
});

test('40 edit team member (Manager)', async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await login(page, 'manager@sciencemanager.demo');
  await openFirstMember(page, '/edit');
  await expect(page.locator('#profile-orcid')).toBeVisible({ timeout: 15_000 });
  await shot(page, `${TEAM}/40-team-member-edit.png`);
});

// ── Consulta → Revistas (Manager sees the management buttons) ───────────────
const JOURNALS = `${BASE}/${GROUP}/consultation/journals`;

async function asManager(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.addInitScript(() => {
    localStorage.setItem('msoc-language', 'es');
    localStorage.setItem('theme', 'light');
  });
  await login(page, 'manager@sciencemanager.demo');
}

test('52 journals list', async ({ page }) => {
  await asManager(page);
  await page.goto(JOURNALS);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Cargando revistas')).toHaveCount(0);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/52-journals-list.png`);
});

test('53 journals filters + no-JCR card', async ({ page }) => {
  await asManager(page);
  await page.goto(JOURNALS);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('button:has(svg.lucide-sliders-horizontal)').click();
  await page.waitForTimeout(400);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/53-journals-filters.png`);
});

test('54 journal detail', async ({ page }) => {
  await asManager(page);
  await page.goto(JOURNALS);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('table tbody tr a[href*="/consultation/journals/"]').first().click();
  await page.waitForURL(/\/consultation\/journals\/[^/]+$/);
  await expect(page.getByText('Editorial').first()).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/54-journal-detail.png`);
});

test('55 journals add row', async ({ page }) => {
  await asManager(page);
  await page.goto(JOURNALS);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Añadir revista' }).click();
  const input = page.getByPlaceholder('Nombre de la revista…');
  await input.fill('Journal of Nanoscale Energy');
  await highlight(input);
  await page.mouse.move(700, 700);
  await shot(page, `${OUT}/02-core-features/55-journals-add.png`);
});
