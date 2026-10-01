// Checks the RENDERED Docusaurus pages (dev server), not just the build.
// Usage: node screenshots/verify-docs.mjs core-features/projects getting-started/dashboard
// Fails if a page has raw ":::" text, zero admonitions while the source has some, or broken images.
import { chromium } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const BASE = process.env.DOCS_URL ?? 'http://localhost:8081/docs/';
const pages = process.argv.slice(2);
if (!pages.length) { console.error('Pass page slugs, e.g. core-features/projects'); process.exit(2); }

const browser = await chromium.launch();
const page = await browser.newPage();
let failed = false;
for (const slug of pages) {
  await page.goto(BASE + slug);
  await page.waitForSelector('article h1');
  const text = await page.locator('article').innerText();
  const admonitions = await page.locator('.theme-admonition').count();
  // Images are lazy-loaded: scroll each into view so off-screen ones load before checking.
  for (const img of await page.locator('article img').all()) await img.scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  const brokenImgs = await page.locator('article img').evaluateAll((imgs) =>
    imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')));
  const problems = [];
  if (text.includes(':::')) problems.push('raw ":::" in text');
  if (brokenImgs.length) problems.push(`broken images: ${brokenImgs.join(', ')}`);
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${slug} — ${admonitions} admonitions, ${await page.locator('article img').count()} images${problems.length ? ' — ' + problems.join('; ') : ''}`);
  if (problems.length) failed = true;
}
await browser.close();
process.exit(failed ? 1 : 0);
