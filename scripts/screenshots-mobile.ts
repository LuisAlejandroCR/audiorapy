// screenshots-mobile.ts: captures the Expo app's web preview (synthetic demo agenda) at phone size.
// Usage: npx expo export -p web (in apps/mobile), serve dist, then
//        URL=http://127.0.0.1:8095 OUT=docs/screenshots npx tsx scripts/screenshots-mobile.ts
import { chromium } from '@playwright/test';

const URL = process.env.URL ?? 'http://127.0.0.1:8095';
const OUT = process.env.OUT ?? 'docs/screenshots';

const errors: string[] = [];
for (const scheme of ['light', 'dark'] as const) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: scheme,
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const tag = scheme === 'dark' ? '-dark' : '';
  await page.goto(URL);
  await page.getByText('Próxima visita'.toUpperCase()).waitFor();
  await page.screenshot({ path: `${OUT}/mobile-app-today${tag}.png` });
  await page.getByRole('tab', { name: 'Sesión' }).click();
  for (const ok of [true, true, true, false, true, true])
    await page.getByRole('button', { name: ok ? 'Acierto' : 'Error' }).click();
  await page.screenshot({ path: `${OUT}/mobile-app-session${tag}.png` });
  await page.getByRole('button', { name: 'Terminar sesión' }).click();
  await page.getByText(/apoyo predominante/).waitFor();
  await page.screenshot({ path: `${OUT}/mobile-app-summary${tag}.png` });
  await browser.close();
}
if (errors.length) {
  console.error('page errors:', errors);
  process.exit(1);
}
console.log('mobile screenshots written to', OUT);
