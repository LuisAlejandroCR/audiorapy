// Kpi.tsx: one KPI card — label with icon, the figure, an optional meter and a plain-text unit line.
import { Icon } from './Icon.tsx';

export function Kpi({
  icon,
  label,
  value,
  unit,
  meter,
  tone,
}: {
  icon: string;
  label: string;
  value: number | string;
  unit: string;
  meter?: number;
  tone?: 'ok' | 'warn';
}) {
  return (
    <article className={`summary-card kpi${tone ? ` ${tone}` : ''}`}>
      <span className="summary-label">
        <Icon name={icon} />
        {label}
      </span>
      <strong>{value}</strong>
      {meter !== undefined && (
        <span className="kpi-meter" aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} />
        </span>
      )}
      <span>{unit}</span>
    </article>
  );
}
