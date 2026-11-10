import { useEffect, useRef, useState } from 'react';
import { EyeOff, Trash2, Settings, X } from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboard.store';

/* ─────────────────────────────────────────────────────────────
   WidgetEditToolbar
   Consistent hide / remove buttons shown on hover in edit mode.
   Usage: render inside a container that has position:relative.
───────────────────────────────────────────────────────────── */
export function WidgetEditToolbar({
  onHide,
  onRemove,
  actions,
}: {
  onHide: () => void;
  onRemove: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        display: 'flex',
        gap: '0.125rem',
        zIndex: 10,
        opacity: 0,
        transition: 'opacity 150ms ease',
        pointerEvents: 'none',
      }}
      /* The .group class on the parent widget grid item makes these visible via CSS */
      className="widget-edit-toolbar"
    >
      {actions}
      <button
        onClick={(e) => { e.stopPropagation(); onHide(); }}
        className="btn-icon"
        title="Hide widget"
        aria-label="Hide widget"
        style={{ pointerEvents: 'auto', color: 'var(--color-warning)' }}
      >
        <EyeOff style={{ width: '14px', height: '14px' }} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="btn-icon"
        title="Remove widget"
        aria-label="Remove widget"
        style={{ pointerEvents: 'auto', color: 'var(--color-error)' }}
      >
        <Trash2 style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WidgetSettingsButton
   Gear icon that opens the schema-driven settings popover.
───────────────────────────────────────────────────────────── */
export function WidgetSettingsButton({
  config,
  onChange,
}: {
  config: import('../../types').WidgetConfig;
  onChange: (settings: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="btn-icon"
        title="Widget settings"
        aria-label="Widget settings"
        style={{ pointerEvents: 'auto' }}
      >
        <Settings style={{ width: '14px', height: '14px' }} />
      </button>
      {open && (
        <WidgetSettingsPopover
          config={config}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Schema field parser — reads a Zod schema's .shape
───────────────────────────────────────────────────────────── */
type SchemaField = {
  key: string;
  label: string;
  kind: 'boolean' | 'number' | 'string' | 'enum';
  options?: string[];
  min?: number;
  max?: number;
};

function prettify(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function parseSchema(schema: unknown): SchemaField[] {
  const shape = (schema as { shape?: Record<string, unknown> })?.shape;
  if (!shape) return [];
  const fields: SchemaField[] = [];

  for (const [key, fieldNode] of Object.entries(shape)) {
    const def = (fieldNode as { def?: { type?: string; values?: string[]; innerType?: unknown } }).def;
    const type = def?.type;
    if (type === 'boolean') {
      fields.push({ key, label: prettify(key), kind: 'boolean' });
    } else if (type === 'number') {
      const n = fieldNode as { minValue?: number | null; maxValue?: number | null };
      fields.push({ key, label: prettify(key), kind: 'number', min: n.minValue ?? undefined, max: n.maxValue ?? undefined });
    } else if (type === 'enum' && Array.isArray(def?.values)) {
      fields.push({ key, label: prettify(key), kind: 'enum', options: def.values });
    } else if (type === 'string') {
      fields.push({ key, label: prettify(key), kind: 'string' });
    }
  }
  return fields;
}

/* ─────────────────────────────────────────────────────────────
   WidgetSettingsPopover
   Schema-driven settings dialog — z-index 300, properly centred.
───────────────────────────────────────────────────────────── */
export function WidgetSettingsPopover({
  config,
  onChange,
  onClose,
}: {
  config: import('../../types').WidgetConfig;
  onChange: (settings: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const definition = useDashboardStore((s) => s.widgetDefinitions.get(config.type));
  const fields = definition?.settingsSchema ? parseSchema(definition.settingsSchema) : [];
  const panelRef = useRef<HTMLDivElement>(null);

  /* Escape closes */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  if (fields.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-overlay)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        ref={panelRef}
        style={{
          width: '100%',
          maxWidth: '400px',
          maxHeight: '70vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-2xl)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${definition?.name ?? 'Widget'} settings`}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {definition?.name ?? 'Widget'} Settings
          </span>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        </div>

        {/* Fields */}
        <div
          style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
          className="scrollbar-thin"
        >
          {fields.map((field) => {
            const value = (config.settings as Record<string, unknown>)?.[field.key];

            if (field.kind === 'boolean') {
              return (
                <label
                  key={field.key}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{field.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => onChange({ [field.key]: e.target.checked })}
                    className="checkbox"
                  />
                </label>
              );
            }

            if (field.kind === 'number') {
              return (
                <div
                  key={field.key}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{field.label}</span>
                  <input
                    type="number"
                    value={typeof value === 'number' ? value : ''}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isNaN(n)) onChange({ [field.key]: n });
                    }}
                    style={{
                      width: '80px',
                      height: '32px',
                      padding: '0 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '0.875rem',
                      textAlign: 'right',
                    }}
                  />
                </div>
              );
            }

            if (field.kind === 'enum') {
              return (
                <div
                  key={field.key}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{field.label}</span>
                  <select
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => onChange({ [field.key]: e.target.value })}
                    className="input"
                    style={{ width: '140px', height: '32px', fontSize: '0.875rem' }}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            }

            /* string */
            return (
              <div
                key={field.key}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{field.label}</span>
                <input
                  type="text"
                  value={typeof value === 'string' ? value : ''}
                  onChange={(e) => onChange({ [field.key]: e.target.value })}
                  style={{
                    flex: '0 0 55%',
                    height: '32px',
                    padding: '0 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
