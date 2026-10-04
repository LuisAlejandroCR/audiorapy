// Icon.tsx: the dashboard's stroke icon set (inline SVG paths, no external assets under the CSP).
import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  calendar: (
    <path d="M5 3v3m14-3v3M4 9h16M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Zm3 8h3v3H8v-3Z" />
  ),
  trend: <path d="m4 17 5-5 4 3 7-8m-5 0h5v5" />,
  session: (
    <path d="M9 4h6m-7 3h8m-9 13h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Zm1-8 2 2 4-4" />
  ),
  shield: <path d="M12 3 5 6v5c0 4.5 2.8 7.6 7 10 4.2-2.4 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4" />,
  lock: <path d="M7 10V7a5 5 0 0 1 10 0v3m-11 0h12v10H6V10Z" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
  check: <path d="m5 12 5 5 9-10" />,
  flame: (
    <path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.4 2.4-5.4 4-7.4.3 2 1.3 3.2 2.6 3.8C11.3 7.4 12.6 5 15 3c-.3 3 3.9 5.6 3.9 10.9C18.9 18.1 16 21 12 21Z" />
  ),
  flag: <path d="M5 21V4m0 0h11l-2 4 2 4H5" />,
  trophy: (
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4v1a4 4 0 0 0 4 4m8-5h4v1a4 4 0 0 1-4 4m-4 2v4m-4 3h8l-1-3H9l-1 3Z" />
  ),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Zm4 4h4" />,
  users: (
    <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0 0-6m2 15a5 5 0 0 0-3-4.6" />
  ),
  target: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  ),
  note: <path d="M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7m-7 4h5" />,
  download: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />,
  key: <path d="M14 10a4 4 0 1 0-3.5 4L9 15.5V18H6.5v2.5H4V18l6.5-6.5A4 4 0 0 0 14 10Zm1-3h.01" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />,
};

export function Icon({ name }: { name: string }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
