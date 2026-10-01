import { test, expect, type Page } from '@playwright/test';

/**
 * Screenshots for docs/02-core-features/10-member-profile.md.
 * Run:  npm run screenshots -- member-profile   (frontend :5173, API :8080, demo fixtures loaded)
 * The profile shown is MEMBER (default carlos-garcia). Most captures are taken as a Reviewer;
 * the details tab uses a plain User (no personal data) and the contracts tab a Manager.
 */
const BASE = process.env.APP_URL ?? 'http://localhost:5173';
const GROUP = process.env.GROUP_SLUG ?? 'nanotech-lab';
const MEMBER = process.env.DOCS_MEMBER ?? 'carlos-garcia';
const PASSWORD = process.env.DOCS_PASSWORD ?? 'Demo1234!';
const OUT = 'static/img/docs/02-core-features';
const PROFILE = `${BASE}/${GROUP}/teams/${MEMBER}`;

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

async function open(page: Page, section: string, email = 'reviewer@sciencemanager.demo') {
  await loginAs(page, email);
  await page.goto(`${PROFILE}${section}`);
  await settle(page);
  await page.waitForTimeout(500);
  await settle(page);
  await page.mouse.move(700, 700);
}

test('56 profile details (colleague view)', async ({ page }) => {
  await open(page, '', 'user@sciencemanager.demo');
  await shot(page, `${OUT}/56-member-profile-details.png`);
});

test('57 profile publications', async ({ page }) => {
  await open(page, '/publications');
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  await shot(page, `${OUT}/57-member-profile-publications.png`);
});

test('58 profile projects', async ({ page }) => {
  await open(page, '/projects');
  await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  await shot(page, `${OUT}/58-member-profile-projects.png`);
});

test('59 profile events', async ({ page }) => {
  await open(page, '/events');
  await shot(page, `${OUT}/59-member-profile-events.png`);
});

test('62 profile employment records (Manager)', async ({ page }) => {
  await open(page, '/employment-records', 'manager@sciencemanager.demo');
  await shot(page, `${OUT}/62-member-profile-employment.png`);
});
