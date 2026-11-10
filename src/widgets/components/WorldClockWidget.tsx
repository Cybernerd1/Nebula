import { useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '../../utils/helpers';
import { Globe, Settings, Plus, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetProps } from '../../types';
import type { WorldClockWidgetSettings } from '../schemas';

interface TimeZoneConfig {
  id: string;
  name: string;
  zone: string;
  enabled: boolean;
}

const COMMON_TIMEZONES = [
  { name: 'UTC', zone: 'UTC' },
  { name: 'New York', zone: 'America/New_York' },
  { name: 'Los Angeles', zone: 'America/Los_Angeles' },
  { name: 'London', zone: 'Europe/London' },
  { name: 'Paris', zone: 'Europe/Paris' },
  { name: 'Tokyo', zone: 'Asia/Tokyo' },
  { name: 'Sydney', zone: 'Australia/Sydney' },
  { name: 'Dubai', zone: 'Asia/Dubai' },
  { name: 'Singapore', zone: 'Asia/Singapore' },
  { name: 'Hong Kong', zone: 'Asia/Hong_Kong' },
];

export function WorldClockWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as WorldClockWidgetSettings;
  const [times, setTimes] = useState<Record<string, { time: string; date: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneValue, setNewZoneValue] = useState('');

  const formatTime = useCallback((date: Date, zone: string, format: '12h' | '24h') => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: format === '12h',
      }).format(date);
    } catch {
      return '--:--:--';
    }
  }, []);

  const formatDate = useCallback((date: Date, zone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const newTimes: Record<string, { time: string; date: string }> = {};
      
      settings.timeZones.filter(tz => tz.enabled).forEach(tz => {
        newTimes[tz.id] = {
          time: formatTime(now, tz.zone, settings.format),
          date: settings.showDate ? formatDate(now, tz.zone) : '',
        };
      });
      
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [settings.timeZones, settings.format, settings.showDate, formatTime, formatDate]);

  const addTimeZone = () => {
    if (!newZoneName.trim() || !newZoneValue.trim()) return;
    
    const newTz: TimeZoneConfig = {
      id: `tz-${Date.now()}`,
      name: newZoneName.trim(),
      zone: newZoneValue.trim(),
      enabled: true,
    };
    
    onConfigChange({
      timeZones: [...settings.timeZones, newTz],
    });
    
    setNewZoneName('');
    setNewZoneValue('');
  };

  const removeTimeZone = (id: string) => {
    onConfigChange({
      timeZones: settings.timeZones.filter(tz => tz.id !== id),
    });
  };

  const toggleTimeZone = (id: string) => {
    onConfigChange({
      timeZones: settings.timeZones.map(tz =>
        tz.id === id ? { ...tz, enabled: !tz.enabled } : tz
      ),
    });
  };

  const enabledZones = settings.timeZones.filter(tz => tz.enabled);

  return (
    <div className={cn('widget world-clock-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <Globe className="w-5 h-5" />
          World Clock
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditingId('add')} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Add timezone">
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {editingId === 'add' ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-surface-elevated rounded-lg space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Display name (e.g., Tokyo)"
                className="input text-sm"
              />
              <select
                value={newZoneValue}
                onChange={(e) => setNewZoneValue(e.target.value)}
                className="input text-sm"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.zone} value={tz.zone}>{tz.name} ({tz.zone})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={addTimeZone} className="btn-primary text-sm">Add</button>
            </div>
          </motion.div>
        ) : null}

        {enabledZones.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted">
            <Globe className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-body-md mb-2">No time zones added</p>
            <button onClick={() => setEditingId('add')} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Time Zone
            </button>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {enabledZones.map((tz, index) => (
            <motion.div
              key={tz.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg mb-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text truncate">{tz.name}</span>
                  <span className="text-body-xs text-text-muted px-2 py-0.5 bg-surface rounded">{tz.zone}</span>
                </div>
                <div className="flex items-center gap-4 text-body-sm">
                  <span className="font-mono tabular-nums text-text">{times[tz.id]?.time || '--:--:--'}</span>
                  {settings.showDate && times[tz.id]?.date && (
                    <span className="text-text-muted">{times[tz.id]?.date}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTimeZone(tz.id)}
                  className="p-1.5 hover:bg-surface rounded-lg transition-colors"
                  title="Disable"
                >
                  <Clock className="w-4 h-4 text-success" />
                </button>
                <button
                  onClick={() => removeTimeZone(tz.id)}
                  className="p-1.5 hover:bg-surface rounded-lg transition-colors text-error"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {settings.timeZones.some(tz => !tz.enabled) && (
          <details className="mt-4">
            <summary className="text-body-sm text-text-muted cursor-pointer flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Disabled ({settings.timeZones.filter(tz => !tz.enabled).length})
            </summary>
            <div className="mt-2 space-y-1">
              {settings.timeZones.filter(tz => !tz.enabled).map(tz => (
                <div key={tz.id} className="flex items-center justify-between p-2 bg-surface-elevated/50 rounded-lg">
                  <span className="text-body-sm text-text-muted">{tz.name}</span>
                  <button
                    onClick={() => toggleTimeZone(tz.id)}
                    className="btn-secondary text-sm"
                  >
                    Enable
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}