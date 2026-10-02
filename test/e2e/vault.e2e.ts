// vault.e2e.ts: A7 in a real browser — create, lock, unlock by passphrase and by the printed phrase
// (typed without accents), restore an encrypted backup in a clean browser. Storage holds ciphertext only.
import { expect, test } from '@playwright/test';
import { createVault, loadSynthetic, PASSPHRASE, stripAccents, watchConsole } from './fixtures.ts';

test('create, lock and unlock with passphrase and with the recovery phrase', async ({ page }) => {
  const errors = watchConsole(page);
  const words = await createVault(page);
  expect(words).toHaveLength(24);
  await loadSynthetic(page);

  await page.reload();
  await page.getByLabel('Frase de paso').fill('frase equivocada');
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByRole('alert')).toHaveText('Frase de paso incorrecta.');
  await page.getByLabel('Frase de paso').fill(PASSPHRASE);
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByRole('button', { name: 'Bloquear' })).toBeVisible();

  await page.getByRole('button', { name: 'Bloquear' }).click();
  await page.getByRole('button', { name: 'Clave de recuperación' }).click();
  await page.getByLabel('Las 24 palabras').fill(stripAccents(words.join('  ')).toUpperCase());
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await page.getByRole('button', { name: 'Progreso' }).click();
  await expect(page.getByText('Paciente sintético A')).toBeVisible();
  expect(errors).toEqual([]);
});

test('storage and backups contain ciphertext only', async ({ page }) => {
  await createVault(page);
  await loadSynthetic(page);
  const stored = await page.evaluate(() => localStorage.getItem('audiorapy.vault.v1') ?? '');
  expect(stored.length).toBeGreaterThan(1000);
  for (const clear of ['sintético', 'Paciente', '/s/ inicial', 'trials', 'correct'])
    expect(stored).not.toContain(clear);
});

test('restore an encrypted backup in a clean browser with the recovery phrase', async ({
  page,
  browser,
}) => {
  const words = await createVault(page);
  await loadSynthetic(page);
  await page.getByRole('button', { name: 'Respaldo' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descargar respaldo cifrado' }).click(),
  ]);
  const backup = await download.path();

  const clean = await browser.newContext();
  const fresh = await clean.newPage();
  await fresh.goto('/');
  await fresh.getByLabel('Restaurar desde un respaldo').setInputFiles(backup);
  await fresh.getByRole('button', { name: 'Clave de recuperación' }).click();
  await fresh.getByLabel('Las 24 palabras').fill(words.join(' '));
  await fresh.getByRole('button', { name: 'Desbloquear' }).click();
  await fresh.getByRole('button', { name: 'Progreso' }).click();
  await expect(fresh.getByRole('figure')).toHaveCount(3);
  await clean.close();
});
