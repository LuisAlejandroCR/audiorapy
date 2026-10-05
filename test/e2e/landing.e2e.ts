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

  const qr = page.getByRole('img', { name: 'Código QR: abrir el panel web' });
  await expect(qr).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Código QR: instalar la beta de Android' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Código QR: unirse a la beta en TestFlight' }),
  ).toBeVisible();
  // The arrows open the same code full screen, with the install link; "Cerrar" closes it.
  await page.getByRole('button', { name: 'Ver en grande el QR de iPhone' }).click();
  const full = page.getByRole('dialog');
  await expect(full.getByRole('img', { name: /TestFlight/ })).toBeVisible();
  await expect(full.getByRole('link', { name: 'Abrir página de instalación' })).toHaveAttribute(
    'href',
    'https://testflight.apple.com/join/BWFrPaur',
  );
  await full.getByRole('button', { name: 'Cerrar' }).click();
  await expect(full).toBeHidden();
  // On a phone the top bar is gone; the hero's own button leads to the panel.
  const phone = (page.viewportSize()?.width ?? 1000) < 640;
  await expect(page.getByRole('link', { name: 'Abrir el panel' })).toBeVisible({ visible: !phone });
  await page.getByRole('link', { name: phone ? 'Probar el panel' : 'Abrir el panel' }).click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByRole('heading', { name: 'Crea tu bóveda' })).toBeVisible();
  expect(foreign).toEqual([]);
  expect(errors).toEqual([]);
});

test('the data policy the bot links to exists, under the same CSP, and says nothing clinical goes by chat', async ({
  page,
}) => {
  const errors = watchConsole(page);
  await page.goto('/privacidad/');
  expect(
    await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),
  ).toContain("default-src 'self'");
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Política de tratamiento de datos',
  );
  await expect(page.getByText('Ley 1581 de 2012')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qué datos no pasan por el chat' })).toBeVisible();
  expect(errors).toEqual([]);
});
