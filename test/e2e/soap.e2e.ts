// soap.e2e.ts: A8 + A9 in a real browser — the SOAP draft works with local Ollama down (template,
// "IA no disponible") and up (figures redacted, approval blocked until [completar] is filled).
import { expect, test } from '@playwright/test';
import { createVault, loadSynthetic } from './fixtures.ts';

const modelReply = {
  message: {
    role: 'assistant',
    content: JSON.stringify({
      subjective: 'La familia reporta práctica en casa.',
      assessment: 'Mejora sostenida. Logró 100 % hoy.',
      plan: 'Pasar a frases.',
    }),
  },
};

test('A9: with Ollama down the note falls back to the template and O is computed', async ({
  page,
}) => {
  await page.route('**/api/chat', (route) => route.abort('connectionrefused'));
  await createVault(page);
  await loadSynthetic(page);
  await page.getByRole('button', { name: 'Sesión' }).click();
  await page.getByRole('button', { name: 'Borrador con IA local' }).click();
  await expect(page.getByRole('status')).toContainText('IA no disponible');
  await expect(page.getByLabel('S · Subjetivo')).toHaveValue('[completar]');
  await expect(page.getByText(/\/s\/ inicial en palabras: \d+\/10 \(\d+ %\)/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aprobar y guardar cifrada' })).toBeDisabled();
});

test('A8: the model draft loses sentences with figures, and the note is saved only on approval', async ({
  page,
}) => {
  let modelInput = '';
  await page.route('**/api/chat', async (route) => {
    modelInput = route.request().postData() ?? '';
    await route.fulfill({ json: modelReply, headers: { 'access-control-allow-origin': '*' } });
  });
  await createVault(page);
  await loadSynthetic(page);
  await page.getByRole('button', { name: 'Sesión' }).click();
  await page.getByRole('button', { name: 'Borrador con IA local' }).click();
  await expect(page.getByRole('status')).toContainText('Se quitó 1 frase con cifras');
  await expect(page.getByLabel('A · Análisis')).toHaveValue('Mejora sostenida. [completar]');
  expect(modelInput).not.toContain('Paciente sintético');
  expect(JSON.parse(modelInput).model).toBe('gemma4:e4b');

  const approveButton = page.getByRole('button', { name: 'Aprobar y guardar cifrada' });
  await expect(approveButton).toBeDisabled();
  await page.getByLabel('A · Análisis').fill('Mejora sostenida con apoyo mínimo.');
  await approveButton.click();
  await expect(page.getByText(/Aprobada .* registro inmodificable/)).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Sesión' })).toContainText('nota aprobada');
});

test('session mode records trials with cue level, supports undo and saves a new session', async ({
  page,
}) => {
  await createVault(page);
  await loadSynthetic(page);
  await page.getByRole('button', { name: 'Sesión' }).click();
  await page.getByRole('button', { name: 'Nueva sesión' }).click();
  await page.getByRole('button', { name: 'mínimo' }).click();
  await page.getByRole('button', { name: 'Acierto' }).click();
  await page.getByRole('button', { name: 'Acierto' }).click();
  await page.getByRole('button', { name: 'Error' }).click();
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.getByText('2/2 en este objetivo')).toBeVisible();
  await page.getByRole('button', { name: 'Guardar sesión cifrada' }).click();
  await expect(
    page.getByText('/s/ inicial en palabras: 2/2 (100 %), apoyo predominante: mínimo.'),
  ).toBeVisible();
});
