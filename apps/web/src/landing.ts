// landing.ts: scroll motion and the landing's QR codes — the dashboard at this site's own /app/ (so it is right on
// any domain), the Android APK and the iOS TestFlight beta — each with a full-screen view.
/// <reference types="vite/client" />
import { qrPath, QUIET } from './lib/qr.ts';

const SVG = 'http://www.w3.org/2000/svg';

function draw(slot: HTMLElement, url: string, label: string) {
  const qr = qrPath(url);
  if (!qr) return;
  const side = qr.size + QUIET * 2;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', `0 0 ${side} ${side}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Código QR: ${label}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  const bg = document.createElementNS(SVG, 'rect');
  bg.setAttribute('width', String(side));
  bg.setAttribute('height', String(side));
  bg.setAttribute('fill', '#ffffff');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', qr.d);
  path.setAttribute('fill', '#14243b');
  svg.append(bg, path);
  slot.replaceChildren(svg);
}

const CODES: Record<string, { url: string; label: string; caption: string }> = {
  web: {
    url: new URL('/app/', window.location.origin).href,
    label: 'abrir el panel web',
    caption: 'Escanea con tu teléfono para abrir el panel web.',
  },
  android: {
    url: 'https://expo.dev/accounts/alejoo_oo/projects/audiorapy/builds/25208c1c-513c-40ab-9e87-c8884f1f7a0a',
    label: 'instalar la beta de Android',
    caption: 'Escanea con un Android para descargar el APK de la beta.',
  },
  ios: {
    url: 'https://testflight.apple.com/join/BWFrPaur',
    label: 'unirse a la beta en TestFlight',
    caption: 'Escanea con un iPhone para unirte a la beta en TestFlight.',
  },
};

for (const [key, code] of Object.entries(CODES)) {
  const slot = document.querySelector<HTMLElement>(`[data-qr="${key}"]`);
  if (slot) draw(slot, code.url, code.label);
}

// Full screen: the arrows button opens the same code large, for scanning from across a table.
const full = document.querySelector<HTMLDialogElement>('dialog.qr-full');
const fullCode = full?.querySelector<HTMLElement>('[data-qr-full]');
const fullCaption = full?.querySelector<HTMLElement>('[data-qr-full-caption]');
const fullLink = full?.querySelector<HTMLAnchorElement>('[data-qr-full-link]');
if (full && fullCode && fullCaption && fullLink && typeof full.showModal === 'function') {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-qr-open]')) {
    const code = CODES[button.dataset.qrOpen ?? ''];
    if (!code) continue;
    button.hidden = false;
    button.addEventListener('click', () => {
      draw(fullCode, code.url, code.label);
      fullCaption.textContent = code.caption;
      fullLink.href = code.url;
      full.showModal();
    });
  }
  full.querySelector('[data-qr-close]')?.addEventListener('click', () => full.close());
  // A click on the backdrop (outside the panel) closes it too.
  full.addEventListener('click', (e) => {
    if (e.target === full) full.close();
  });
}

// Motion: reveal sections as they scroll in and count the facts up once. The page is complete without JS.
const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');
const reveal = new IntersectionObserver(
  (entries) => {
    for (const e of entries)
      if (e.isIntersecting) {
        e.target.classList.add('in');
        reveal.unobserve(e.target);
        if (!still) countUp(e.target);
      }
  },
  { threshold: 0.15 },
);
for (const el of document.querySelectorAll('.reveal')) reveal.observe(el);

function countUp(root: Element) {
  for (const el of root.querySelectorAll<HTMLElement>('.facts strong')) {
    const text = el.textContent ?? '';
    const target = Number.parseInt(text, 10);
    if (!Number.isFinite(target) || target === 0) continue;
    const suffix = text.slice(String(target).length);
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 900);
      el.textContent = `${Math.round(target * (1 - (1 - k) ** 3))}${suffix}`;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

// Card videos are decoration: with reduced motion they stay on their poster frame.
if (still)
  for (const v of document.querySelectorAll<HTMLVideoElement>('.card-video')) {
    v.removeAttribute('autoplay');
    v.pause();
  }
