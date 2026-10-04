// agenda.e2e.ts: the scheduling plane end to end — a caregiver books through the real API, the
// dashboard shows it with the phone masked, and a missing API degrades without breaking the page.
import { expect, test } from '@playwright/test';
import { API, createVault, TOKEN } from './fixtures.ts';

test('a booking made over the API appears in Hoy, phone masked', async ({ page, request }) => {
  const phone = `5730${Math.floor(Math.random() * 1e7)
    .toString()
    .padStart(7, '0')}`;
  const sim = (body: object) =>
    request.post(`${API}/dev/simulate`, { data: { from: phone, ...body } });
  await sim({ text: 'Hola' });
  const offer = await (await sim({ buttonId: 'consent:yes' })).json();
  const slotId = offer.replies[0].rows[1].id as string;
  await sim({ buttonId: slotId });

  await createVault(page);
  await page.getByRole('button', { name: 'Respaldo' }).click();
  await page.getByLabel('Dirección de la API de agenda').fill(API);
  await page.getByLabel('Token del dashboard').fill(TOKEN);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Hoy' }).click();

  await expect(page.getByText(`Familia ••••${phone.slice(-4)}`).first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText(phone);
});

test('without API configuration Hoy degrades and the rest keeps working', async ({ page }) => {
  await createVault(page);
  await expect(
    page.getByRole('status').filter({ hasText: 'Agenda no disponible: API no configurada' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Progreso' }).click();
  await expect(page.getByRole('button', { name: 'Cargar datos sintéticos' })).toBeVisible();
});

test('a wrong token is reported, not crashed on', async ({ page }) => {
  await createVault(page);
  await page.getByRole('button', { name: 'Respaldo' }).click();
  await page.getByLabel('Dirección de la API de agenda').fill(API);
  await page.getByLabel('Token del dashboard').fill('wrong');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Hoy' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'token rechazado' })).toBeVisible();
});
