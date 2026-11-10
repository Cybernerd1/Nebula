import { useEffect, useState, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import { CalendarClock, Settings, RotateCcw, AlertCircle, Flag, Bell, Plus, Check, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetProps } from '../../types';
import type { CountdownWidgetSettings } from '../schemas';

interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as CountdownWidgetSettings;
  const [timeLeft, setTimeLeft] = useState<TimeUnits>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [completed, setCompleted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editTitle, setEditTitle] = useState(settings.title);

  const calculateTimeLeft = useCallback(() => {
    if (!settings.targetDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const target = new Date(settings.targetDate);
    if (settings.targetTime) {
      const [hours, minutes] = settings.targetTime.split(':').map(Number);
      target.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: diff };
  }, [settings.targetDate, settings.targetTime]);

  useEffect(() => {
    const update = () => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      if (newTime.total <= 0 && !completed) {
        setCompleted(true);
        handleComplete();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeLeft, completed]);

  const handleComplete = useCallback(() => {
    if (settings.onComplete === 'repeat' && settings.targetDate) {
      // For repeat, add a day (simplified)
      const newTarget = new Date(settings.targetDate);
      newTarget.setDate(newTarget.getDate() + 1);
      onConfigChange({ targetDate: newTarget.getTime() });
      setCompleted(false);
    } else if (settings.onComplete === 'hide') {
      // Widget would hide itself - handled by parent
    }
  }, [settings, onConfigChange]);

  const startEditing = () => {
    const target = new Date(settings.targetDate);
    setEditDate(target.toISOString().split('T')[0]);
    setEditTime(settings.targetTime || target.toTimeString().slice(0, 5));
    setEditTitle(settings.title);
    setEditing(true);
  };

  const saveEditing = () => {
    if (!editDate) return;
    const dateStr = `${editDate}T${editTime || '00:00'}`;
    const targetDate = new Date(dateStr).getTime();
    
    onConfigChange({
      targetDate,
      targetTime: editTime,
      title: editTitle,
    });
    setEditing(false);
    setCompleted(false);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const resetCountdown = () => {
    onConfigChange({ targetDate: 0, targetTime: '', title: 'Countdown' });
    setCompleted(false);
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const units = [
    { key: 'days', label: 'Days', value: timeLeft.days, show: settings.showDays },
    { key: 'hours', label: 'Hours', value: timeLeft.hours, show: settings.showHours },
    { key: 'minutes', label: 'Minutes', value: timeLeft.minutes, show: settings.showMinutes },
    { key: 'seconds', label: 'Seconds', value: timeLeft.seconds, show: settings.showSeconds },
  ].filter(u => u.show);

  return (
    <div className={cn('widget countdown-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <CalendarClock className="w-5 h-5" />
          {settings.title || 'Countdown'}
        </h3>
        <div className="flex items-center gap-1">
          {!editing && settings.targetDate && (
            <button onClick={startEditing} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Edit">
              <Settings className="w-4 h-4" />
            </button>
          )}
          {editing && (
            <>
              <button onClick={saveEditing} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors text-success" title="Save">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={cancelEditing} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        {editing ? (
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input"
                placeholder="Countdown title"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="label">Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        ) : !settings.targetDate ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted">
            <CalendarClock className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-body-lg mb-2">No countdown set</p>
            <button onClick={startEditing} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> Create Countdown
            </button>
          </div>
        ) : completed && settings.onComplete === 'hide' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted">
            <Flag className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-body-lg mb-2">Countdown complete!</p>
            <button onClick={resetCountdown} className="btn-secondary">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </button>
          </div>
        ) : completed ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-success mb-4"
            >
              <Flag className="w-16 h-16" />
            </motion.div>
            <h2 className="text-heading-xl font-bold text-success mb-2">Time's Up!</h2>
            <p className="text-text-muted mb-6">{settings.title}</p>
            <div className="flex gap-3">
              <button onClick={resetCountdown} className="btn-secondary">
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </button>
              {settings.onComplete === 'repeat' && (
                <button onClick={() => setCompleted(false)} className="btn-primary">
                  <Play className="w-4 h-4 mr-2" /> Restart
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-6">
              {units.map((unit, index) => (
                <motion.div
                  key={unit.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center min-w-[60px]"
                >
                  <div className="text-4xl font-mono font-bold text-text tabular-nums bg-surface-elevated px-4 py-2 rounded-xl shadow-lg min-w-[70px] text-center">
                    {formatNumber(unit.value)}
                  </div>
                  <div className="text-body-xs text-text-muted mt-1 uppercase tracking-wider">{unit.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="w-full max-w-xs">
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <motion.div
                  key={timeLeft.total}
                  initial={{ width: '100%' }}
                  animate={{ width: `${Math.max(0, 100 - (timeLeft.total / (settings.targetDate ? (settings.targetDate - Date.now()) : 1)) * 100)}%` }}
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                />
              </div>
              <div className="flex justify-between text-body-xs text-text-muted mt-2">
                <span>Started</span>
                <span>Target: {new Date(settings.targetDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}