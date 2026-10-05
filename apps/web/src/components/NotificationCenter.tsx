// NotificationCenter.tsx: the bell in the top bar — unread count, and a panel with family alerts first,
// then visits within 24 h, then achievements. Opening it shows everything; "Marcar todo como leído"
// clears the count. Escape or the close button dismisses it.
import { useEffect, useRef } from 'react';
import type { InboxItem } from '../lib/inbox.ts';
import { formatStampEs } from '../lib/stats.ts';
import { Icon } from './Icon.tsx';

const KIND_ICON: Record<InboxItem['kind'], string> = {
  alert: 'bell',
  visit: 'calendar',
  achievement: 'trophy',
};

export function NotificationCenter({
  items,
  open,
  onToggle,
  onReadAll,
  onOpenItem,
}: {
  items: InboxItem[];
  open: boolean;
  onToggle: () => void;
  onReadAll: () => void;
  onOpenItem: (item: InboxItem) => void;
}) {
  const unread = items.filter((i) => i.unread).length;
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onToggle();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onToggle]);

  return (
    <div className="inbox">
      <button
        type="button"
        className="icon-button"
        aria-expanded={open}
        aria-controls="inbox-panel"
        aria-label={unread ? `Notificaciones: ${unread} sin leer` : 'Notificaciones'}
        onClick={onToggle}
      >
        <Icon name="bell" />
        {unread > 0 && (
          <span className="badge-count" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          id="inbox-panel"
          ref={panel}
          className="inbox-panel"
          role="dialog"
          aria-label="Notificaciones"
          tabIndex={-1}
        >
          <div className="inbox-head">
            <strong>Notificaciones</strong>
            <button type="button" className="link" onClick={onReadAll} disabled={unread === 0}>
              Marcar todo como leído
            </button>
          </div>
          {items.length === 0 ? (
            <p className="muted inbox-empty">Todo al día. Aquí verás avisos, visitas y logros.</p>
          ) : (
            <ul>
              {items.map((i) => (
                <li key={i.id} className={i.unread ? 'unread' : undefined}>
                  <button type="button" onClick={() => onOpenItem(i)}>
                    <span className={`inbox-icon ${i.kind}`} aria-hidden="true">
                      <Icon name={KIND_ICON[i.kind]} />
                    </span>
                    <span className="inbox-copy">
                      <strong>{i.title}</strong>
                      <span>
                        {i.detail}
                        {i.kind === 'alert' && i.at ? ` · ${formatStampEs(i.at)}` : ''}
                      </span>
                    </span>
                    {i.unread && <span className="sr-only">sin leer</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
