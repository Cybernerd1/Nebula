import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Coffee, Sparkles, Settings, EyeOff, Trash2, User } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { getGreeting } from '../../utils/helpers';
import type { WidgetProps, GreetingWidgetSettings } from '../../types';

export function GreetingWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [time, setTime] = useState(new Date());
  const settings = config.settings as GreetingWidgetSettings;

  useEffect(() => {
    if (isPreview) return;
    const updateTime = () => setTime(new Date());
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [isPreview]);

  const hour = time.getHours();
  const timeBasedGreeting = getGreeting(hour);
  const displayGreeting = settings.customGreeting || timeBasedGreeting;
  const displayName = settings.displayName;

  const greetingIcon = useMemo(() => {
    if (hour < 5) return <Moon className="w-8 h-8" />;
    if (hour < 12) return <Sun className="w-8 h-8" />;
    if (hour < 17) return <Coffee className="w-8 h-8" />;
    if (hour < 22) return <Sparkles className="w-8 h-8" />;
    return <Moon className="w-8 h-8" />;
  }, [hour]);

  const handleSettingsChange = (newSettings: Partial<GreetingWidgetSettings>) => {
    onConfigChange({ ...settings, ...newSettings });
  };

  if (isPreview) {
    return (
      <div className="p-6 bg-surface-elevated border border-border rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl text-primary">{greetingIcon}</div>
          <div>
            <div className="text-2xl font-bold text-text">Good morning, John</div>
            <div className="text-text-muted">Ready to start your day?</div>
          </div>
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
    >
      {isEditing && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); handleSettingsChange({ displayName: '' }); }}
            className="btn-icon p-1.5"
            title="Clear Name"
          >
            <User className="w-4 h-4" />
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

      <div className="h-full flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-primary/20 rounded-xl text-primary flex-shrink-0"
        >
          {greetingIcon}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-w-0"
        >
          <div
            className="font-bold text-text truncate"
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: 1.2 }}
          >
            {displayGreeting}{displayName && `, ${displayName}`}
          </div>
          {!settings.customGreeting && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-text-muted"
              style={{ fontSize: `${Math.max(settings.fontSize * 0.5, 14)}px` }}
            >
              {hour < 12 ? 'Ready to start your day?' : hour < 17 ? 'Hope your day is going well' : 'Time to unwind'}
            </motion.div>
          )}
        </motion.div>
      </div>

      <GreetingSettingsPanel
        config={config}
        settings={settings}
        onChange={handleSettingsChange}
        isOpen={isEditing}
      />
    </div>
  );
}

function GreetingSettingsPanel({
  config,
  settings,
  onChange,
  isOpen,
}: {
  config: import('../../types').WidgetConfig;
  settings: GreetingWidgetSettings;
  onChange: (settings: Partial<GreetingWidgetSettings>) => void;
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
          <h3 className="text-heading-md font-semibold text-text">Greeting Settings</h3>
          <button
            onClick={() => onChange({ ...settings })}
            className="btn-icon p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              placeholder="Your name"
              className="input"
              maxLength={30}
            />
          </div>

          <div>
            <label className="label">Custom Greeting (optional)</label>
            <input
              type="text"
              value={settings.customGreeting}
              onChange={(e) => onChange({ customGreeting: e.target.value })}
              placeholder="Leave empty for time-based greeting"
              className="input"
              maxLength={50}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showTimeBased"
              checked={settings.showTimeBasedGreeting}
              onChange={(e) => onChange({ showTimeBasedGreeting: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="showTimeBased" className="text-body-md text-text">Show time-based greeting when custom is empty</label>
          </div>

          <div>
            <label className="label">Font Size: {settings.fontSize}px</label>
            <input
              type="range"
              min="16"
              max="72"
              value={settings.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { X } from 'lucide-react';