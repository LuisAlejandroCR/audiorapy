// journey.e2e.ts: B16 in a real browser — the whole start route as a game (quiz, quest map, points,
// celebration), work that survives a tab switch, map links for a visit, and no silent data loss.
import { expect, test } from '@playwright/test';
import {
  answerQuiz,
  API,
  createVault,
  loadSynthetic,
  PASSPHRASE,
  TOKEN,
  watchConsole,
} from './fixtures.ts';

test('a wrong quiz word is refused; the right ones open the vault with 2 of 6 steps done', async ({
  page,
}) => {
  await page.goto('/app/');
  await page.getByLabel('Frase de paso', { exact: true }).fill(PASSPHRASE);
  await page.getByLabel('Repite la frase').fill(PASSPHRASE);
  await page.getByRole('button', { name: 'Crear bóveda' }).click();
  const items = page.getByRole('list', { name: 'Clave de recuperación' }).getByRole('listitem');
  await expect(items).toHaveCount(24);
  const words = await items.allTextContents();
  await page.getByLabel('La escribí y la guardé').check();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await answerQuiz(page, words, true);
  await page.getByRole('button', { name: 'Comprobar y entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('no coincide');
  await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeHidden();

  await answerQuiz(page, words);
  await page.getByRole('button', { name: 'Comprobar y entrar' }).click();
  const map = page.getByRole('region', { name: 'Tu primera consulta protegida' });
  await expect(map).toContainText('2 de 6 pasos');
  await expect(map).toContainText('250 puntos');
  await expect(page.getByRole('status').filter({ hasText: '2 pasos completados' })).toBeVisible();
});

test('the whole route can be completed, and an unsaved session survives a tab switch', async ({
  page,
}) => {
  const errors = watchConsole(page);
  await page.route('**/api/chat', (route) => route.abort('connectionrefused'));
  await createVault(page);
  await loadSynthetic(page);

  // Session mode: record, leave for another tab, come back — nothing lost.
  await page.getByRole('button', { name: 'Sesión', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva sesión' }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Acierto' }).click();
  await expect(page.getByText('Racha 3')).toBeVisible();
  await page.getByRole('button', { name: 'Progreso', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Sesión', exact: true }),
  ).toHaveAccessibleDescription('Sesión en curso sin guardar');
  await page.getByRole('button', { name: 'Sesión', exact: true }).click();
  await expect(page.getByText('3/3 en este objetivo')).toBeVisible();
  await page.getByRole('button', { name: 'Guardar sesión cifrada' }).click();

  // SOAP: approval is gated by the checklist; filling S, A and P unlocks it.
  const approveButton = page.getByRole('button', { name: 'Aprobar y guardar cifrada' });
  await expect(approveButton).toBeDisabled();
  await page.getByLabel('S · Subjetivo').fill('La familia reporta práctica diaria.');
  await page.getByLabel('A · Análisis').fill('Progreso estable con apoyo mínimo.');
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await page.getByRole('button', { name: 'Sesión', exact: true }).click();
  await expect(page.getByLabel('A · Análisis')).toHaveValue('Progreso estable con apoyo mínimo.');
  await page.getByLabel('P · Plan').fill('Continuar con /s/ en frases.');
  await approveButton.click();
  await expect(page.getByText(/Aprobada .* registro inmodificable/)).toBeVisible();

  // Backup is the last step: the route completes and celebrates.
  await page.getByRole('button', { name: 'Respaldo', exact: true }).click();
  await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descargar respaldo cifrado' }).click(),
  ]);
  await expect(page.getByRole('status').filter({ hasText: '¡Ruta completada!' })).toBeVisible();
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();
  await expect(page.getByRole('region', { name: '¡Ruta completada!' })).toContainText(
    '6 de 6 pasos',
  );
  await expect(page.getByRole('region', { name: '¡Ruta completada!' })).toContainText(
    'Consulta blindada',
  );
  expect(errors.filter((e) => !/11434|ERR_CONNECTION_REFUSED|ERR_FAILED/.test(e))).toEqual([]);
});

test('progress opens with KPI cards and mastery badges computed from the trials', async ({
  page,
}) => {
  await createVault(page);
  await loadSynthetic(page);
  const kpis = page.getByLabel('Indicadores del caso');
  await expect(kpis).toContainText('Sesiones');
  await expect(kpis).toContainText('8');
  await expect(kpis).toContainText('Notas pendientes');
  await expect(page.getByText(/Dominado|Racha \d\/3 sobre la meta/).first()).toBeVisible();
});

test('a visit opens in Google Maps, Apple Maps or Waze, and alerts can be resolved', async ({
  page,
  request,
}) => {
  const phone = `5731${Math.floor(Math.random() * 1e7)
    .toString()
    .padStart(7, '0')}`;
  const sim = (body: object) =>
    request.post(`${API}/dev/simulate`, { data: { from: phone, ...body } });
  await sim({ text: 'Hola' });
  const offer = await (await sim({ buttonId: 'consent:yes' })).json();
  await sim({ buttonId: offer.replies[0].rows[2].id as string });
  await sim({ text: '¿Reciben la EPS?' });

  await createVault(page);
  await page.getByRole('button', { name: 'Respaldo', exact: true }).click();
  await page.getByLabel('Dirección de la API de agenda').fill(API);
  await page.getByLabel('Token del dashboard').fill(TOKEN);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('button', { name: 'Hoy', exact: true }).click();

  const masked = `••••${phone.slice(-4)}`;
  const visit = page
    .getByRole('region', { name: 'Próximas visitas' })
    .getByRole('listitem')
    .filter({ hasText: `Familia ${masked}` });
  await visit.getByText('Agregar dirección').click();
  await visit.getByLabel(`Dirección de la familia ${masked}`).fill('Calle 45 # 12-30, Bogotá');
  await visit.getByRole('button', { name: 'Guardar dirección' }).click();
  const links = visit.getByRole('group', { name: /Cómo llegar/ });
  await expect(links.getByRole('link', { name: 'Google Maps' })).toHaveAttribute(
    'href',
    /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Calle%2045%20%23%2012-30/,
  );
  await expect(links.getByRole('link', { name: 'Apple Maps' })).toHaveAttribute(
    'href',
    /^https:\/\/maps\.apple\.com\/\?q=Calle/,
  );
  await expect(links.getByRole('link', { name: 'Waze' })).toHaveAttribute(
    'href',
    /^https:\/\/waze\.com\/ul\?q=Calle.*&navigate=yes$/,
  );
  await expect(links.getByRole('link', { name: 'Waze' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );

  const alerts = page.getByLabel('Avisos');
  const mine = alerts.getByRole('listitem').filter({ hasText: masked });
  await expect(mine).toHaveCount(1);
  await mine.getByRole('button', { name: 'Resuelto' }).click();
  await expect(alerts.getByRole('listitem').filter({ hasText: masked })).toHaveCount(0);
});

test('unlocking an existing vault does not replay the celebrations of steps already done', async ({
  page,
}) => {
  await createVault(page);
  await expect(page.getByRole('status').filter({ hasText: 'pasos completados' })).toBeVisible();
  await page.reload();
  await page.getByLabel('Frase de paso').fill(PASSPHRASE);
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByRole('region', { name: 'Tu primera consulta protegida' })).toContainText(
    '2 de 6 pasos',
  );
  // A single read, not a retrying assertion: the toast closes itself after 4 s and would pass by waiting.
  await page.waitForTimeout(500);
  expect(await page.locator('.cheer').count()).toBe(0);
  await expect(page.getByRole('button', { name: 'Ir a: Carga un caso' })).toBeVisible();
});

test('"Usar otra bóveda" asks before deleting the stored vault', async ({ page }) => {
  await createVault(page);
  await page.reload();
  page.once('dialog', (d) => void d.dismiss());
  await page.getByRole('button', { name: 'Usar otra bóveda' }).click();
  await expect(page.getByRole('heading', { name: 'Desbloquear' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('audiorapy.vault.v1'))).not.toBeNull();
});
