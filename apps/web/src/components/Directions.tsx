// Directions.tsx: "Cómo llegar" for one visit — the family's address (kept only in this browser) and one
// button; tapping it lets her choose the maps app (Google Maps, Apple Maps or Waze) it opens in. Nothing is sent until a link is tapped.
import { useState, type FormEvent } from 'react';
import { MAP_APPS, MAX_ADDRESS, mapLink } from '../lib/maps.ts';

export function Directions({
  contact,
  address,
  onSave,
}: {
  contact: string;
  address: string;
  onSave: (address: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(address);
  const [choosing, setChoosing] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(value);
    setEditing(false);
  };

  if (editing || !address) {
    return (
      <details className="directions" open={editing || undefined}>
        <summary>{address ? 'Editar dirección' : 'Agregar dirección'}</summary>
        <form className="address-form" onSubmit={submit}>
          <label>
            Dirección de la familia {contact}
            <input
              value={value}
              maxLength={MAX_ADDRESS}
              autoComplete="off"
              placeholder="Calle 45 # 12-30, Bogotá"
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <span className="hint">Se guarda solo en este navegador.</span>
          <div className="row">
            <button type="submit">Guardar dirección</button>
            {editing && (
              <button
                type="button"
                className="ghost"
                onClick={() => (setValue(address), setEditing(false))}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </details>
    );
  }

  return (
    <div className="directions">
      <span className="address">{address}</span>
      <div className="map-links">
        <div className="chooser">
          <button
            type="button"
            className="ghost"
            aria-expanded={choosing}
            aria-controls={`maps-${contact}`}
            onClick={() => setChoosing((c) => !c)}
          >
            Cómo llegar
          </button>
          {choosing && (
            <ul className="chooser-menu" id={`maps-${contact}`} aria-label={`Abrir ${address} en`}>
              {MAP_APPS.map((m) => (
                <li key={m.id}>
                  <a
                    href={mapLink(m.id, address) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setChoosing(false)}
                  >
                    {m.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="link" onClick={() => setEditing(true)}>
          Editar
        </button>
      </div>
    </div>
  );
}
