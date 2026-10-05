// layout.e2e.ts: every screen at the device width — no horizontal overflow, one h1, touch targets of
// at least 44 px, the production CSP in place and no CSP violations.
import { expect, test, type Page } from '@playwright/test';
import { createVault, loadSynthetic, watchConsole } from './fixtures.ts';

async function measure(page: Page) {
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
    small: [
      ...document.querySelectorAll('a,button,select,input:not([type=checkbox]),summary,textarea'),
    ]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.height > 0 && r.height < 44;
      })
      .map((e) => e.textContent?.trim() || e.getAttribute('aria-label') || e.tagName),
  }));
}

test('every tab fits the screen with usable touch targets', async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto('/app/');
  expect(
    await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),
  ).toContain("script-src 'self'");
  expect(await measure(page)).toEqual({ overflow: false, h1: 1, small: [] });
  await createVault(page);
  await loadSynthetic(page);
  for (const tab of ['Hoy', 'Progreso', 'Sesión', 'Respaldo']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    expect(await measure(page), tab).toEqual({ overflow: false, h1: 1, small: [] });
  }
  expect(errors.filter((e) => /Content Security Policy/i.test(e))).toEqual([]);
  expect(errors).toEqual([]);
});
