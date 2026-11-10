import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import { Play, Pause, RotateCcw, Settings, Bell, Volume2, VolumeX, Target, Clock, Minus, Plus, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetProps } from '../../types';
import type { FocusTimerWidgetSettings } from '../schemas';

export function FocusTimerWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as FocusTimerWidgetSettings;
  const [duration, setDuration] = useState(settings.defaultDuration * 60);
  const [timeLeft, setTimeLeft] = useState(settings.defaultDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [settings.soundEnabled]);

  const showNotification = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, [settings.notificationsEnabled]);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const startTimer = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setCompleted(false);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isRunning]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimeLeft(duration);
    setCompleted(false);
  }, [pauseTimer, duration]);

  const handleComplete = useCallback(() => {
    pauseTimer();
    playSound();
    showNotification('Focus session complete!', `${duration / 60} minutes done.`);
    setCompleted(true);
  }, [pauseTimer, playSound, showNotification, duration]);

  const changeDuration = useCallback((minutes: number) => {
    const newDuration = minutes * 60;
    setDuration(newDuration);
    if (!isRunning) {
      setTimeLeft(newDuration);
    }
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? 1 - timeLeft / duration : 0;

  return (
    <div className={cn('widget focus-timer-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <Target className="w-5 h-5" />
          Focus Timer
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={resetTimer} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-56 h-56 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="10"
            />
            <motion.circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - progress)}
              style={{ filter: 'drop-shadow(0 0 12px var(--color-primary))' }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={timeLeft}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-5xl font-mono font-light text-text tabular-nums"
            >
              {formatTime(timeLeft)}
            </motion.div>
            <div className="text-body-sm text-text-muted mt-1">
              {completed ? 'Session complete!' : isRunning ? 'Focusing...' : 'Ready to focus'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {settings.presetDurations.map((preset) => (
            <button
              key={preset}
              onClick={() => changeDuration(preset)}
              disabled={isRunning}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                duration === preset * 60
                  ? 'bg-primary text-white'
                  : 'bg-surface-elevated text-text hover:bg-surface-hover'
              )}
            >
              {preset}min
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isRunning && (
            <motion.button
              onClick={pauseTimer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-secondary px-6 py-3 flex items-center gap-2"
            >
              <Pause className="w-5 h-5" />
              Pause
            </motion.button>
          )}

          {!isRunning && !completed && (
            <motion.button
              onClick={startTimer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start
            </motion.button>
          )}

          {completed && (
            <motion.button
              onClick={resetTimer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              New Session
            </motion.button>
          )}

          {!isRunning && timeLeft !== duration && (
            <motion.button
              onClick={resetTimer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-secondary px-6 py-3 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {completed && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 flex items-center gap-2 text-success"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-body-md font-medium">Well done! Session completed.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}