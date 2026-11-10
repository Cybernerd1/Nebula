import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock as ClockIcon, ChevronLeft, ChevronRight, Settings, Eye, EyeOff, Copy, Trash2, Maximize2, Minimize2 } from 'lucide-react';
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
  const [showTimeZones, setShowTimeZones] = useState(false);
  const settings = config.settings as ClockWidgetSettings;

  useEffect(() => {
    if (isPreview) return;
    
    const updateTime = () => setTime(new Date());
    updateTime();
    const interval = setInterval(updateTime, settings.showSeconds ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [settings.showSeconds, isPreview]);

  const formatTime = (date: Date, timeZone?: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: settings.format === '12h',
      timeZone,
    };
    if (settings.showSeconds) {
      options.second = '2-digit';
    }
    return date.toLocaleTimeString(undefined, options);
  };

  const formatDate = (date: Date, timeZone?: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: settings.showWeekday ? 'long' : undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    };
    return date.toLocaleDateString(undefined, options);
  };

  const currentTime = useMemo(() => {
    const mainTime = formatTime(time);
    const mainDate = settings.showDate ? formatDate(time) : null;
    
    const timeZones = settings.timeZones
      .filter((tz) => tz.enabled)
      .map((tz) => ({
        name: tz.name,
        time: formatTime(time, tz.zone),
        date: settings.showDate ? formatDate(time, tz.zone) : null,
      }));

    return { mainTime, mainDate, timeZones };
  }, [time, settings]);

  const handleSettingsChange = (newSettings: Partial<ClockWidgetSettings>) => {
    onConfigChange({ ...settings, ...newSettings });
  };

  if (isPreview) {
    return (
      <div className="p-6 bg-surface-elevated border border-border rounded-xl">
        <div className="text-center">
          <div className="font-mono text-4xl font-bold text-text" style={{ fontSize: `${settings.fontSize}px` }}>
            {settings.format === '12h' ? '12:34 PM' : '12:34'}
          </div>
          {settings.showDate && (
            <div className="mt-2 text-text-muted">Monday, January 15, 2024</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-full w-full bg-surface-elevated border border-border rounded-xl p-6 transition-all duration-normal',
        'hover:shadow-lg hover:border-border-strong',
        isEditing && 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
      )}
      style={{
        minHeight: '120px',
        fontSize: `${settings.fontSize}px`,
      }}
    >
      {isEditing && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100" style={{ transitionDelay: '0ms' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowTimeZones(!showTimeZones); }}
            className="btn-icon p-1.5"
            title="Time Zones"
          >
            <ClockIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSettingsChange({ style: settings.style === 'digital' ? 'analog' : 'digital' }); }}
            className="btn-icon p-1.5"
            title="Toggle Style"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            className="btn-icon p-1.5 text-warning"
            title="Hide Widget"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="btn-icon p-1.5 text-error"
            title="Remove Widget"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="h-full flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={settings.style}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {settings.style === 'digital' ? (
              <div className="font-mono font-bold text-text" style={{ fontSize: `${settings.fontSize}px`, letterSpacing: '-0.02em' }}>
                {currentTime.mainTime}
              </div>
            ) : (
              <AnalogClock time={time} size={Math.min(settings.fontSize * 2, 200)} />
            )}
          </motion.div>
        </AnimatePresence>

        {settings.showDate && currentTime.mainDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-text-muted font-medium"
            style={{ fontSize: `${Math.max(settings.fontSize * 0.35, 14)}px` }}
          >
            {currentTime.mainDate}
          </motion.div>
        )}

        <AnimatePresence>
          {showTimeZones && currentTime.timeZones.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 w-full space-y-3"
            >
              <div className="flex items-center justify-between text-text-subtle text-xs uppercase tracking-wider">
                <span>Time Zones</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTimeZones(false); }}
                  className="btn-icon p-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {currentTime.timeZones.map((tz) => (
                <motion.div
                  key={tz.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-border/50"
                >
                  <div className="text-left">
                    <div className="text-text-subtle text-sm">{tz.name}</div>
                    <div className="font-mono font-bold text-text" style={{ fontSize: `${settings.fontSize * 0.5}px` }}>
                      {tz.time}
                    </div>
                    {tz.date && <div className="text-text-muted text-xs">{tz.date}</div>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ClockSettingsPanel
        config={config}
        settings={settings}
        onChange={handleSettingsChange}
        isOpen={isEditing}
      />
    </div>
  );
}

function AnalogClock({ time, size }: { time: Date; size: number }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Analog clock showing ${time.toLocaleTimeString()}`}
    >
      <div className="absolute inset-0 border-2 border-border rounded-full" />
      <div className="absolute inset-4 border border-border/50 rounded-full" />
      <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
      
      <div
        className="absolute top-1/2 left-1/2 w-0.5 h-1/4 bg-text transform-origin-bottom center"
        style={{
          transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`,
          transformOrigin: 'center bottom',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-0.5 h-2/5 bg-text transform-origin-bottom center"
        style={{
          transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
          transformOrigin: 'center bottom',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-0.5 h-3/5 bg-primary transform-origin-bottom center"
        style={{
          transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
          transformOrigin: 'center bottom',
        }}
      />
      
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate(-50%, -100%) rotate(${i * 30}deg) translateY(-${size * 0.42}px)`,
          }}
        >
          <div className="w-full h-full bg-text-subtle rounded" style={{ width: i % 3 === 0 ? 4 : 2, height: i % 3 === 0 ? 4 : 2 }} />
        </div>
      ))}
    </div>
  );
}

function ClockSettingsPanel({
  config,
  settings,
  onChange,
  isOpen,
}: {
  config: import('../../types').WidgetConfig;
  settings: ClockWidgetSettings;
  onChange: (settings: Partial<ClockWidgetSettings>) => void;
  isOpen: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-overlay/80 backdrop-blur-sm rounded-xl z-10 p-6 flex items-center justify-center animate-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface-elevated border border-border rounded-xl p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading-md font-semibold text-text">Clock Settings</h3>
          <button
            onClick={() => onChange({ ...settings })}
            className="btn-icon p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Style</label>
            <div className="flex gap-2">
              {['digital', 'analog'].map((style) => (
                <button
                  key={style}
                  onClick={() => onChange({ style: style as 'digital' | 'analog' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.style === style
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Time Format</label>
            <div className="flex gap-2">
              {['12h', '24h'].map((format) => (
                <button
                  key={format}
                  onClick={() => onChange({ format: format as '12h' | '24h' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.format === format
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showSeconds"
              checked={settings.showSeconds}
              onChange={(e) => onChange({ showSeconds: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="showSeconds" className="text-body-md text-text">Show seconds</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showDate"
              checked={settings.showDate}
              onChange={(e) => onChange({ showDate: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="showDate" className="text-body-md text-text">Show date</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showWeekday"
              checked={settings.showWeekday}
              onChange={(e) => onChange({ showWeekday: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="showWeekday" className="text-body-md text-text">Show weekday</label>
          </div>

          <div>
            <label className="label">Font Size: {settings.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="120"
              value={settings.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          {settings.timeZones.length > 0 && (
            <div>
              <label className="label">Configured Time Zones</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {settings.timeZones.map((tz) => (
                  <div key={tz.id} className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border">
                    <div>
                      <div className="text-body-sm font-medium text-text">{tz.name}</div>
                      <div className="text-body-xs text-text-muted">{tz.zone}</div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tz.enabled}
                        onChange={(e) => onChange({
                          timeZones: settings.timeZones.map((t) =>
                            t.id === tz.id ? { ...t, enabled: e.target.checked } : t
                          )
                        })}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-body-sm text-text">Enabled</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { X } from 'lucide-react';