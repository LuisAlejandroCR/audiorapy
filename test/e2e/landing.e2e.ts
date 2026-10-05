// landing.e2e.ts: the public landing at / — strict CSP, one h1, no horizontal overflow at phone width,
// its screenshots load from our own origin, and "Abrir el panel" reaches the dashboard at /app/.
import { expect, test } from '@playwright/test';
import { watchConsole } from './fixtures.ts';

test('the landing page fits the screen, loads only its own assets and opens the dashboard', async ({
  page,
}) => {
  const errors = watchConsole(page);
  const foreign: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:4174') && !r.url().startsWith('data:'))
      foreign.push(r.url());
  });
  await page.goto('/');
  expect(
    await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),
  ).toContain("default-src 'self'");
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Visitas confirmadas');
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
  }));
  expect(layout).toEqual({ overflow: false, h1: 1 });

  const shots = page.locator('figure.shot img');
  await expect(shots).toHaveCount(2);
  for (const img of await shots.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }

  await page.getByRole('link', { name: 'Abrir el panel' }).click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByRole('heading', { name: 'Crea tu bóveda' })).toBeVisible();
  expect(foreign).toEqual([]);
  expect(errors).toEqual([]);
});
