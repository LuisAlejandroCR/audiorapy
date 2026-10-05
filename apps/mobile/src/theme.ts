// theme.ts: the "Terracota" palette shared with the web (olive, cream, terracotta, oxblood) for light
// and dark, plus the support-level colors. Text pairs are ≥ 4.5:1.
import type { CueLevel } from '@audiorapy/domain';

export interface Theme {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  accentText: string;
  warnBg: string;
  warnText: string;
  errorText: string;
  gold: string;
  goldBg: string;
  hero: string;
  heroText: string;
  cue: Record<CueLevel, string>;
}

export const light: Theme = {
  bg: '#FBF6EE',
  surface: '#FFFFFF',
  text: '#2B211B',
  muted: '#6B5E52',
  line: '#E6D8C3',
  accent: '#4A5A42',
  accentText: '#FFFFFF',
  warnBg: '#F7E7C9',
  warnText: '#6E4A12',
  errorText: '#7B2525',
  gold: '#8A5A00',
  goldBg: '#F7E7C9',
  hero: '#4A5A42',
  heroText: '#F4F1E8',
  cue: { independent: '#607456', min: '#3F7F86', mod: '#C98A2B', max: '#A63A2A' },
};

export const dark: Theme = {
  bg: '#1E1916',
  surface: '#2A231F',
  text: '#EEE0CC',
  muted: '#C8B9A6',
  line: '#43382F',
  accent: '#A9BE97',
  accentText: '#1E1916',
  warnBg: '#3D3020',
  warnText: '#F2D39B',
  errorText: '#E8A6A0',
  gold: '#F2C86B',
  goldBg: '#3D3020',
  hero: '#3D4B36',
  heroText: '#F4F1E8',
  cue: { independent: '#A9BE97', min: '#86C3C4', mod: '#E8B45E', max: '#E8907F' },
};

export const serif = 'serif';
