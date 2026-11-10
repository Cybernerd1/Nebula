import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock as ClockIcon, EyeOff, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import type { WidgetProps, ClockWidgetSettings } from '../../types';

export function ClockWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [time, setTime] = useState(new Date());
  const settings = config.settings as ClockWidgetSettings;

  useEffect(() => {
    if (isPreview) return;
    const tick = () => setTime(new Date());
    tick();
    const id = setInterval(tick, settings.showSeconds ? 1000 : 15000);
    return () => clearInterval(id);
  }, [settings.showSeconds, isPreview]);

  const formatTime = (date: Date, tz?: string) =>
    date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      ...(settings.showSeconds ? { second: '2-digit' } : {}),
      hour12: settings.format === '12h',
      ...(tz ? { timeZone: tz } : {}),
    });

  const formatDate = (date: Date, tz?: string) =>
    date.toLocaleDateString(undefined, {
      weekday: settings.showWeekday ? 'long' : undefined,
      month: 'long',
      day: 'numeric',
      ...(tz ? { timeZone: tz } : {}),
    });

  const { mainTime, mainDate, timeZones } = useMemo(() => ({
    mainTime: formatTime(time),
    mainDate: settings.showDate ? formatDate(time) : null,
    timeZones: (settings.timeZones ?? [])
      .filter((tz) => tz.enabled)
      .map((tz) => ({
        name: tz.name,
        time: formatTime(time, tz.zone),
      })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [time, settings.format, settings.showSeconds, settings.showDate, settings.showWeekday, settings.timeZones]);

  const handleChange = (patch: Partial<ClockWidgetSettings>) =>
    onConfigChange({ ...settings, ...patch });

  /* ── clock font size: fit the widget — clamp between 32–96px ── */
  const clockFontSize = Math.max(32, Math.min(settings.fontSize ?? 56, 96));

  if (isPreview) {
    return (
      <div className="widget-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          className="tabular-nums"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.5rem',
            fontWeight: 500,
            color: 'var(--color-text)',
            letterSpacing: '-0.03em',
          }}
        >
          {settings.format === '12h' ? '12:34 PM' : '12:34'}
        </div>
        {settings.showDate && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Monday, January 15
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('widget-card', isEditing && 'is-editing')}>
      {/* Edit toolbar */}
      {isEditing && (
        <div
          className="widget-actions"
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            opacity: 0,
            transition: 'opacity 150ms ease',
          }}
        >
          <button onClick={(e) => { e.stopPropagation(); onHide(); }} className="btn-icon" title="Hide widget" style={{ color: 'var(--color-warning)' }}>
            <EyeOff style={{ width: '14px', height: '14px' }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="btn-icon" title="Remove widget" style={{ color: 'var(--color-error)' }}>
            <Trash2 style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {/* Clock body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem',
          gap: '0.25rem',
          minHeight: 0,
        }}
      >
        {settings.style === 'analog' ? (
          <AnalogClock time={time} size={Math.min(clockFontSize * 1.6, 180)} />
        ) : (
          <div
            className="tabular-nums"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: `${clockFontSize}px`,
              fontWeight: 500,
              color: 'var(--color-text)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
            aria-live="polite"
            aria-label={`Current time: ${mainTime}`}
          >
            {mainTime}
          </div>
        )}

        {settings.showDate && mainDate && (
          <div
            style={{
              fontSize: `${Math.max(clockFontSize * 0.28, 11)}px`,
              color: 'var(--color-text-muted)',
              fontWeight: 400,
              letterSpacing: '0.01em',
            }}
          >
            {mainDate}
          </div>
        )}

        {/* Additional time zones */}
        {timeZones.length > 0 && (
          <div
            style={{
              marginTop: '0.75rem',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            {timeZones.map((tz) => (
              <div
                key={tz.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-secondary)',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {tz.name}
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
                >
                  {tz.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline settings — shown in edit mode via a bottom-anchored row */}
      {isEditing && (
        <ClockSettingsBar settings={settings} onChange={handleChange} />
      )}
    </div>
  );
}

/* ── Compact settings bar shown at the bottom in edit mode ── */
function ClockSettingsBar({
  settings,
  onChange,
}: {
  settings: ClockWidgetSettings;
  onChange: (patch: Partial<ClockWidgetSettings>) => void;
}) {
  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        height: '24px',
        padding: '0 0.5rem',
        borderRadius: 'var(--radius-full)',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        backgroundColor: active ? 'var(--color-primary-muted)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        fontSize: '0.6875rem',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25rem',
        padding: '0.5rem 0 0',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {pill('12h', settings.format === '12h', () => onChange({ format: '12h' }))}
      {pill('24h', settings.format === '24h', () => onChange({ format: '24h' }))}
      <div
        style={{ width: '1px', backgroundColor: 'var(--color-border)', alignSelf: 'stretch', margin: '0 0.125rem' }}
        aria-hidden
      />
      {pill('Digital', settings.style === 'digital', () => onChange({ style: 'digital' }))}
      {pill('Analog', settings.style === 'analog', () => onChange({ style: 'analog' }))}
      <div
        style={{ width: '1px', backgroundColor: 'var(--color-border)', alignSelf: 'stretch', margin: '0 0.125rem' }}
        aria-hidden
      />
      {pill('Seconds', !!settings.showSeconds, () => onChange({ showSeconds: !settings.showSeconds }))}
      {pill('Date', !!settings.showDate, () => onChange({ showDate: !settings.showDate }))}
      {/* Font size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onChange({ fontSize: Math.max(32, (settings.fontSize ?? 56) - 8) }); }}
          style={{ width: '22px', height: '22px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Decrease clock size"
        >
          −
        </button>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', minWidth: '28px', textAlign: 'center' }}>
          {settings.fontSize ?? 56}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onChange({ fontSize: Math.min(96, (settings.fontSize ?? 56) + 8) }); }}
          style={{ width: '22px', height: '22px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Increase clock size"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ── Analog Clock SVG ── */
function AnalogClock({ time, size }: { time: Date; size: number }) {
  const h = time.getHours() % 12;
  const m = time.getMinutes();
  const s = time.getSeconds();
  const hDeg = h * 30 + m * 0.5;
  const mDeg = m * 6;
  const sDeg = s * 6;
  const r = size / 2;
  const cx = r;
  const cy = r;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Analog clock — ${time.toLocaleTimeString()}`}
    >
      {/* Face */}
      <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
      {/* Hour marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const outerR = r - 4;
        const innerR = i % 3 === 0 ? r - 10 : r - 7;
        return (
          <line
            key={i}
            x1={cx + innerR * Math.sin(angle)}
            y1={cy - innerR * Math.cos(angle)}
            x2={cx + outerR * Math.sin(angle)}
            y2={cy - outerR * Math.cos(angle)}
            stroke="var(--color-text-muted)"
            strokeWidth={i % 3 === 0 ? 1.5 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {/* Hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + (r * 0.5) * Math.sin((hDeg * Math.PI) / 180)}
        y2={cy - (r * 0.5) * Math.cos((hDeg * Math.PI) / 180)}
        stroke="var(--color-text)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + (r * 0.72) * Math.sin((mDeg * Math.PI) / 180)}
        y2={cy - (r * 0.72) * Math.cos((mDeg * Math.PI) / 180)}
        stroke="var(--color-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Second hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + (r * 0.78) * Math.sin((sDeg * Math.PI) / 180)}
        y2={cy - (r * 0.78) * Math.cos((sDeg * Math.PI) / 180)}
        stroke="var(--color-primary)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="var(--color-primary)" />
    </svg>
  );
}
