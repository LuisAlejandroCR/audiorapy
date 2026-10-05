// landing.ts: fills the landing's QR codes — the dashboard at this site's own /app/ (so it is right on
// any domain) and, when VITE_EXPO_URL is set at build time, the Expo preview for Expo Go.
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

const web = document.querySelector<HTMLElement>('[data-qr="web"]');
if (web) draw(web, new URL('/app/', window.location.origin).href, 'abrir el panel web');

const expoUrl = (import.meta.env.VITE_EXPO_URL as string | undefined) ?? '';
const expo = document.querySelector<HTMLElement>('[data-qr="expo"]');
if (expo && expoUrl) {
  draw(expo, expoUrl, 'abrir la app en Expo Go');
  document.querySelector('[data-qr-hint="expo"]')?.remove();
}
