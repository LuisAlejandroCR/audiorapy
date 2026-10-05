// screenshots.ts: regenerates docs/screenshots from a running dashboard + API (synthetic data only).
// Usage: WEB=http://127.0.0.1:5199 API=http://127.0.0.1:3200 TOKEN=dev-token npx tsx scripts/screenshots.ts
import { chromium, devices, type Page } from '@playwright/test';

const WEB = process.env.WEB ?? 'http://127.0.0.1:5199';
const API = process.env.API ?? 'http://127.0.0.1:3200';
const TOKEN = process.env.TOKEN ?? 'dev-token';
const OUT = process.env.OUT ?? 'docs/screenshots';
const PASS = 'frase de captura local';

async function enter(page: Page) {
  await page.goto(`${WEB}/app/`);
  await page.evaluate(
    ([api, token]) => {
      localStorage.setItem('audiorapy.api.url', api!);
      sessionStorage.setItem('audiorapy.api.token', token!);
      localStorage.setItem(
        'audiorapy.addresses.v1',
        JSON.stringify({ '••••2233': 'Calle 45 # 12-30, Bogotá (sintética)' }),
      );
    },
    [API, TOKEN],
  );
  await page.getByLabel('Frase de paso', { exact: true }).fill(PASS);
  await page.getByLabel('Repite la frase').fill(PASS);
  await page.getByRole('button', { name: 'Crear bóveda' }).click();
  const items = page.getByRole('list', { name: 'Clave de recuperación' }).getByRole('listitem');
  await items.nth(23).waitFor();
  const words = await items.allTextContents();
  await page.getByLabel('La escribí y la guardé').check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.screenshot({ path: `${OUT}/quiz-${tag}.png`, fullPage: true });
  const fields = page.getByLabel(/Palabra n\.º \d+/);
  for (let i = 0; i < 3; i++) {
    const label = await fields.nth(i).evaluate((el) => el.closest('label')?.textContent ?? '');
    await fields.nth(i).fill(words[Number(/\d+/.exec(label)![0]) - 1]!);
  }
  await page.getByRole('button', { name: 'Comprobar y entrar' }).click();
  await page.getByRole('navigation', { name: 'Secciones' }).waitFor();
}

let tag = '';
for (const [name, opts] of [
  ['mobile', { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } }],
  ['desktop', { viewport: { width: 1180, height: 900 } }],
] as const) {
  for (const scheme of ['light', 'dark'] as const) {
    tag = `${name}${scheme === 'dark' ? '-dark' : ''}`;
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ ...opts, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await enter(page);
    await page.getByRole('button', { name: 'Progreso', exact: true }).click();
    await page.getByRole('button', { name: 'Cargar datos sintéticos' }).click();
    await page.getByRole('button', { name: 'Hoy', exact: true }).click();
    await page.getByText('Próximas visitas').waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/today-${tag}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Progreso', exact: true }).click();
    await page.screenshot({ path: `${OUT}/progress-${tag}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Sesión', exact: true }).click();
    await page.getByRole('button', { name: 'Nueva sesión' }).click();
    for (const ok of [true, true, false, true, true, true]) {
      await page.getByRole('button', { name: ok ? 'Acierto' : 'Error' }).click();
    }
    await page.screenshot({ path: `${OUT}/session-${tag}.png`, fullPage: true });
    await browser.close();
  }
}
const browser = await chromium.launch();
for (const [name, viewport] of [
  ['landing-desktop', { width: 1280, height: 900 }],
  ['landing-mobile', { width: 390, height: 844 }],
] as const) {
  const page = await browser.newPage({ viewport });
  await page.goto(WEB);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log('screenshots written to', OUT);
