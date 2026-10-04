// Celebration.tsx: a short, dismissible toast when a start-route step is done. Announced politely to
// screen readers; the confetti is decorative and disappears under prefers-reduced-motion.
import { useEffect } from 'react';
import { Icon } from './Icon.tsx';

export interface Cheer {
  title: string;
  detail: string;
  big?: boolean;
}

export function Celebration({ cheer, onDone }: { cheer: Cheer; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, cheer.big ? 6000 : 4000);
    return () => clearTimeout(t);
  }, [cheer, onDone]);

  return (
    <div className={`cheer${cheer.big ? ' big' : ''}`} role="status" aria-live="polite">
      <span className="confetti" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <span className="cheer-badge" aria-hidden="true">
        <Icon name={cheer.big ? 'trophy' : 'star'} />
      </span>
      <span className="cheer-copy">
        <strong>{cheer.title}</strong>
        <span>{cheer.detail}</span>
      </span>
      <button type="button" className="cheer-close" onClick={onDone} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
