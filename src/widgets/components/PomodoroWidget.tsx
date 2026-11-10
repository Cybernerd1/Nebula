import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import { Play, Pause, RotateCcw, Settings, Bell, Volume2, VolumeX, AlertCircle, CheckCircle, Clock, CheckCircle as CheckCircleIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetProps } from '../../types';
import type { PomodoroWidgetSettings } from '../schemas';

type PomodoroState = 'idle' | 'work' | 'break' | 'longBreak';
type PomodoroPhase = 'work' | 'break' | 'longBreak';

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: 'Focus Time',
  break: 'Short Break',
  longBreak: 'Long Break',
};

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  work: 'var(--color-primary)',
  break: 'var(--color-success)',
  longBreak: 'var(--color-info)',
};

export function PomodoroWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as PomodoroWidgetSettings;
  const [state, setState] = useState<PomodoroState>('idle');
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
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

  const getPhaseDuration = useCallback((phase: PomodoroPhase) => {
    switch (phase) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [settings.soundEnabled]);

  const showNotification = useCallback((title: string, body: string) => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-128.png' });
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
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handlePhaseComplete();
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
    setState('idle');
    setCurrentPhase('work');
    setTimeLeft(settings.workDuration * 60);
    setCompletedSessions(0);
  }, [pauseTimer, settings.workDuration]);

  const handlePhaseComplete = useCallback(() => {
    pauseTimer();
    playSound();

    if (currentPhase === 'work') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);
      
      showNotification('Work session complete!', 'Time for a break.');
      
      if (newCompleted % settings.sessionsBeforeLongBreak === 0) {
        setCurrentPhase('longBreak');
        setState('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
        showNotification('Long break!', `Take a ${settings.longBreakDuration} minute break.`);
        if (settings.autoStartBreaks) setTimeout(startTimer, 1000);
      } else {
        setCurrentPhase('break');
        setState('break');
        setTimeLeft(settings.breakDuration * 60);
        showNotification('Break time!', `Take a ${settings.breakDuration} minute break.`);
        if (settings.autoStartBreaks) setTimeout(startTimer, 1000);
      }
    } else {
      showNotification('Break over!', 'Ready to focus?');
      setCurrentPhase('work');
      setState('work');
      setTimeLeft(settings.workDuration * 60);
      if (settings.autoStartWork) setTimeout(startTimer, 1000);
    }
  }, [currentPhase, completedSessions, settings, pauseTimer, playSound, showNotification, startTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / getPhaseDuration(currentPhase);

  return (
    <div className={cn('widget pomodoro-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text">Pomodoro</h3>
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
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="8"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke={PHASE_COLORS[currentPhase]}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
              style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-body-xs text-text-muted uppercase tracking-wider mb-1">
              {PHASE_LABELS[currentPhase]}
            </div>
            <motion.div
              key={timeLeft}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-4xl font-mono font-light text-text tabular-nums"
            >
              {formatTime(timeLeft)}
            </motion.div>
            <div className="text-body-sm text-text-muted mt-2">
              {completedSessions} sessions completed
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {state === 'idle' && (
            <motion.button
              onClick={() => { setState('work'); setTimeLeft(settings.workDuration * 60); startTimer(); }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Focus
            </motion.button>
          )}

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

          {!isRunning && state !== 'idle' && (
            <motion.button
              onClick={startTimer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Resume
            </motion.button>
          )}

          {(state !== 'idle' || completedSessions > 0) && (
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
          {completedSessions > 0 && (
            <motion.div
              key="streak"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 flex items-center gap-2 text-text-muted"
            >
              <CheckCircleIcon className="w-5 h-5 text-success" />
              <span className="text-body-sm">Today: {completedSessions} completed</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}