// maps.ts: "Cómo llegar" deep links (Google Maps, Apple Maps, Waze) for a family's address, and the
// per-browser address book. Addresses stay in this browser; they leave it only when a link is tapped.
import { z } from 'zod';

export type MapApp = 'google' | 'apple' | 'waze';

export const MAP_APPS: ReadonlyArray<{ id: MapApp; label: string; host: string }> = [
  { id: 'google', label: 'Google Maps', host: 'www.google.com' },
  { id: 'apple', label: 'Apple Maps', host: 'maps.apple.com' },
  { id: 'waze', label: 'Waze', host: 'waze.com' },
];

export const MAX_ADDRESS = 200;

/** Collapses whitespace and control characters; empty means "no address". */
export function cleanAddress(raw: string): string {
  return raw
    .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ADDRESS)
    .trim();
}

/** Always https, always one of three fixed hosts; the address only ever travels as a query value. */
export function mapLink(app: MapApp, address: string): string | null {
  const q = cleanAddress(address);
  if (!q) return null;
  const v = encodeURIComponent(q);
  switch (app) {
    case 'google':
      return `https://www.google.com/maps/search/?api=1&query=${v}`;
    case 'apple':
      return `https://maps.apple.com/?q=${v}`;
    case 'waze':
      return `https://waze.com/ul?q=${v}&navigate=yes`;
  }
}

const KEY = 'audiorapy.addresses.v1';
const BookSchema = z.record(z.string().max(64), z.string().max(MAX_ADDRESS));

export type AddressBook = Record<string, string>;

/** A key that cannot reach Object.prototype when used as a property name. */
function isSafeKey(k: string): boolean {
  return k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && k.length <= 64;
}

export function parseBook(raw: string | null): AddressBook {
  if (!raw) return {};
  try {
    const parsed = BookSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return {};
    return Object.fromEntries(Object.entries(parsed.data).filter(([k]) => isSafeKey(k)));
  } catch {
    return {};
  }
}

export function loadBook(): AddressBook {
  try {
    return parseBook(localStorage.getItem(KEY));
  } catch {
    return {};
  }
}

/** Saves (or with an empty address, forgets) the address for a masked contact. */
export function saveAddress(book: AddressBook, contact: string, address: string): AddressBook {
  if (!isSafeKey(contact)) return book;
  const next = { ...book };
  const clean = cleanAddress(address);
  if (clean) next[contact] = clean;
  else delete next[contact];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: lasts for this page only */
  }
  return next;
}
