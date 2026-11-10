import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetProps } from '../../types';
import type { PomodoroWidgetSettings } from '../schemas';

type Phase = 'work' | 'break' | 'longBreak';

const PHASE_LABEL: Record<Phase, string> = {
  work:      'Focus',
  break:     'Short break',
  longBreak: 'Long break',
};

const PHASE_COLOR: Record<Phase, string> = {
  work:      'var(--color-primary)',
  break:     'var(--color-success)',
  longBreak: 'var(--color-info)',
};

export function PomodoroWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as PomodoroWidgetSettings;
  const [phase, setPhase] = useState<Phase>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  /* ── tone generator — no external file needed ── */
  const beep = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }, [settings.soundEnabled]);

  const notify = useCallback((title: string, body: string) => {
    if (!settings.notificationsEnabled) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-128.png' });
    }
  }, [settings.notificationsEnabled]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const phaseDuration = useCallback((p: Phase) => {
    if (p === 'work')      return settings.workDuration * 60;
    if (p === 'break')     return settings.breakDuration * 60;
    return settings.longBreakDuration * 60;
  }, [settings]);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          /* Phase transition */
          stop();
          beep();
          setPhase((curPhase) => {
            setSessions((n) => {
              const newN = curPhase === 'work' ? n + 1 : n;
              if (curPhase === 'work') {
                const isLong = newN % settings.sessionsBeforeLongBreak === 0;
                const nextPhase = isLong ? 'longBreak' : 'break';
                notify('Break time!', `Take a ${isLong ? settings.longBreakDuration : settings.breakDuration} minute break.`);
                setTimeLeft(isLong ? settings.longBreakDuration * 60 : settings.breakDuration * 60);
                setPhase(nextPhase);
              } else {
                notify('Focus time!', `Start a ${settings.workDuration} minute focus session.`);
                setTimeLeft(settings.workDuration * 60);
                setPhase('work');
              }
              return newN;
            });
            return curPhase;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [running, stop, beep, notify, settings]);

  const reset = useCallback(() => {
    stop();
    setPhase('work');
    setTimeLeft(settings.workDuration * 60);
    setSessions(0);
  }, [stop, settings.workDuration]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const total = phaseDuration(phase);
  const progress = total > 0 ? (total - timeLeft) / total : 0;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 52;
  const color = PHASE_COLOR[phase];

  return (
    <div className={cn('widget-card', 'pomodoro-widget')}>
      {/* Header */}
      <div className="widget-header">
        <span className="widget-title">
          <Bell aria-hidden />
          Pomodoro
        </span>
        <div className="widget-actions">
          <button onClick={reset} className="btn-icon" title="Reset timer" aria-label="Reset">
            <RotateCcw style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          minHeight: 0,
          padding: '0.5rem 0',
        }}
      >
        {/* Circular progress */}
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{ transform: 'rotate(-90deg)' }}
            aria-hidden
          >
            {/* Track */}
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" strokeWidth="6" />
            {/* Progress */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 400ms ease' }}
            />
          </svg>

          {/* Time text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1px',
            }}
          >
            <div
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.625rem',
                fontWeight: 500,
                color: 'var(--color-text)',
                lineHeight: 1,
              }}
              aria-live="polite"
              aria-label={`Time remaining: ${mins} minutes ${secs} seconds`}
            >
              {mins}:{secs}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {PHASE_LABEL[phase]}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {running ? (
            <button onClick={stop} className="btn btn-secondary" style={{ height: '36px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
              <Pause style={{ width: '14px', height: '14px' }} />
              Pause
            </button>
          ) : (
            <button onClick={start} className="btn btn-primary" style={{ height: '36px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', backgroundColor: color, borderColor: color }}>
              <Play style={{ width: '14px', height: '14px' }} />
              {timeLeft === phaseDuration(phase) ? (phase === 'work' ? 'Start focus' : 'Start break') : 'Resume'}
            </button>
          )}
        </div>

        {/* Session counter */}
        <AnimatePresence>
          {sessions > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                gap: '0.25rem',
                alignItems: 'center',
              }}
            >
              {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                  }}
                  aria-hidden
                />
              ))}
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
                {sessions} session{sessions !== 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
