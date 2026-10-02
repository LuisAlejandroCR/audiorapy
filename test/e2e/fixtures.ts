// fixtures.ts: shared steps for the dashboard end-to-end tests. Synthetic data only.
import { expect, type Page } from '@playwright/test';

export const API = 'http://127.0.0.1:3100';
export const TOKEN = 'e2e-token';
export const PASSPHRASE = 'frase de prueba e2e';

/** Collects console errors and CSP violations; the expected refused Ollama call is passed in as allowed. */
export function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

export async function createVault(page: Page): Promise<string[]> {
  await page.goto('/');
  await page.getByLabel('Frase de paso', { exact: true }).fill(PASSPHRASE);
  await page.getByLabel('Repite la frase').fill(PASSPHRASE);
  await page.getByRole('button', { name: 'Crear bóveda' }).click();
  const items = page.getByRole('list', { name: 'Clave de recuperación' }).getByRole('listitem');
  await expect(items).toHaveCount(24);
  const words = await items.allTextContents();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  await page.getByLabel('La escribí y la guardé').check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible();
  return words;
}

export async function loadSynthetic(page: Page) {
  await page.getByRole('button', { name: 'Progreso' }).click();
  await page.getByRole('button', { name: 'Cargar datos sintéticos' }).click();
  await expect(page.getByRole('heading', { name: 'Progreso por objetivo' })).toBeVisible();
}

export function stripAccents(s: string) {
  return s.normalize('NFD').replace(/\p{M}+/gu, '');
}
