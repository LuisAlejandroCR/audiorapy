// theme.ts: the blue, beige, white and green palette shared with the web and the landing (one light
// theme everywhere), plus the support-level colors. Text pairs are ≥ 4.5:1.
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
  bg: '#F5EFE4',
  surface: '#FFFFFF',
  text: '#14243B',
  muted: '#5A6472',
  line: '#E3DACB',
  accent: '#1D5FD1',
  accentText: '#FFFFFF',
  warnBg: '#F7E9C8',
  warnText: '#6B4C00',
  errorText: '#8A1F11',
  gold: '#8A5A00',
  goldBg: '#F7E9C8',
  hero: '#1D5FD1',
  heroText: '#FFFFFF',
  cue: { independent: '#256B4C', min: '#0E7C86', mod: '#C98A2B', max: '#B5402F' },
};

export const serif = 'serif';
