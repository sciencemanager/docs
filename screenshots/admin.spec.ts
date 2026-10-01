import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Screenshots for 04-administration (Gestión del Grupo).
 * Separate spec to keep docs-screenshots.spec.ts under the 500-line limit.
 * Run:  npm run screenshots -- admin   (frontend :5173, API :8080, demo fixtures loaded)
 *
 * Role shown: Manager (every /admin route used here is managerOnly).
 */
const BASE = process.env.APP_URL ?? 'http://localhost:5173';
const GROUP = process.env.GROUP_SLUG ?? 'nanotech-lab';
const EMAIL = process.env.DOCS_USER ?? 'manager@sciencemanager.demo';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'Demo1234!';
const OUT = 'static/img/docs/04-administration';
const ADMIN = `${BASE}/${GROUP}/admin`;

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

/** Playbook §5: no real @uclm.es account and no national IDs in published captures. Visual-only; nothing is saved. */
async function maskSensitive(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('table tbody tr').forEach((tr) => {
      if (/uclm\.es/i.test(tr.textContent ?? '')) tr.remove();
    });
    const id = /\b\d{8}[A-Z]\b/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (id.test(n.nodeValue ?? '')) n.nodeValue = (n.nodeValue ?? '').replace(id, '12345678Z');
      id.lastIndex = 0;
    }
    document.querySelectorAll('input').forEach((i) => {
      if (/^\d{8}[A-Z]$/.test(i.value)) {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
        set.call(i, '12345678Z');
      }
    });
  });
}

/** Grows the viewport to the page height so fixed sidebar/header render once, instead of fullPage stitching. */
async function shot(page: Page, path: string) {
  await maskSensitive(page);
  await page.mouse.move(700, 700);
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
  await page.locator('#email').fill(EMAIL);
  await page.locator('#userpwd').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL(new RegExp(`/${GROUP}`), { timeout: 20_000 });
});

test('01 admin hub', async ({ page }) => {
  await page.goto(ADMIN);
  await settle(page);
  await shot(page, `${OUT}/01-admin-hub.png`);
});

test('02 + 03 users list and filters', async ({ page }) => {
  await page.goto(`${ADMIN}/users`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await shot(page, `${OUT}/02-users-list.png`);

  await page.getByRole('button', { name: /Filtros/ }).click();
  await page.waitForTimeout(300);
  await shot(page, `${OUT}/03-users-filters.png`);
});

test('04 user detail', async ({ page }) => {
  await page.goto(`${ADMIN}/users`);
  await settle(page);
  await page.getByRole('link', { name: /Ariadna Soliz/ }).first().click();
  await page.waitForURL(/\/admin\/users\/[^/]+$/);
  await expect(page.getByText('Acciones de administrador')).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await shot(page, `${OUT}/04-user-detail.png`);
});

test('05 user create', async ({ page }) => {
  await page.goto(`${ADMIN}/users/create`);
  await settle(page);
  await page.locator('#create-email').fill('nuevo.investigador@ejemplo.org');
  await page.locator('#create-firstName').fill('Elena');
  await page.locator('#create-lastName').fill('Martín');
  await page.locator('#create-secondLastName').fill('Ruiz');
  await shot(page, `${OUT}/05-user-create.png`);
});

test('06 user edit', async ({ page }) => {
  await page.goto(`${ADMIN}/users`);
  await settle(page);
  await page.getByRole('link', { name: /Ariadna Soliz/ }).first().click();
  await page.waitForURL(/\/admin\/users\/[^/]+$/);
  const id = page.url().split('/users/')[1];
  await page.goto(`${ADMIN}/users/${id}/edit`);
  await expect(page.locator('#edit-email')).toBeVisible({ timeout: 15_000 });
  await settle(page);
  await shot(page, `${OUT}/06-user-edit.png`);
});

test('07 pending approvals', async ({ page }) => {
  await page.goto(`${ADMIN}/pending-approvals`);
  await settle(page);
  await shot(page, `${OUT}/07-pending-approvals.png`);
});

// 08 group details: skipped — GroupDetailsView stays on "Cargando…" in the demo session (groupConfig missing from the auth store).

test('09 trash', async ({ page }) => {
  await page.goto(`${ADMIN}/trash`);
  await settle(page);
  await shot(page, `${OUT}/09-trash.png`);
});

test('10 audit log', async ({ page }) => {
  await page.goto(`${ADMIN}/audit-log`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  // 50 rows per page: capture only the top of the table instead of the full-height page.
  await page.mouse.move(700, 700);
  await page.screenshot({ path: `${OUT}/10-audit-log.png` });
});

test('11 third-party connections', async ({ page }) => {
  await page.goto(`${ADMIN}/third-party`);
  await settle(page);
  await shot(page, `${OUT}/11-third-party.png`);
});

// ── Master data (Catálogos y Entidades) ──────────────────────────────────────

test('13 + 14 authors list and add row', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/consultation/authors`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await shot(page, `${OUT}/13-authors-list.png`);

  await page.getByRole('button', { name: 'Añadir autor' }).click();
  await page.getByPlaceholder('Nombre del autor…').fill('Martínez Ruiz, Elena');
  await highlight(page.getByPlaceholder('Nombre del autor…'));
  await shot(page, `${OUT}/14-authors-add.png`);
});

test('15 funding entities list', async ({ page }) => {
  await page.goto(`${BASE}/${GROUP}/consultation/funding-entities`);
  await settle(page);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await shot(page, `${OUT}/15-funding-entities-list.png`);
});

test('16 funding entity new sub-organism', async ({ page }) => {
  await page.goto(`${ADMIN}/funding-entities/new`);
  await settle(page);
  await page.locator('#fe-kind').click();
  await page.getByRole('option', { name: /Sub-organism/ }).click();
  await expect(page.locator('#fe-parent')).toBeVisible();
  await page.locator('#fe-name').fill('Programa Estatal de Generación de Conocimiento');
  await page.locator('#fe-acronym').fill('PEGC');
  await highlight(page.locator('#fe-parent'));
  await shot(page, `${OUT}/16-funding-entity-new.png`);
});

test('17 import JCR', async ({ page }) => {
  await page.goto(`${ADMIN}/journals/import-jcr`);
  await settle(page);
  await shot(page, `${OUT}/17-import-jcr.png`);
});
