import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { Timer } from 'lucide-react';
import { PomodoroWidget } from '../components/PomodoroWidget';
import { pomodoroWidgetSchema, type PomodoroWidgetSettings } from '../schemas';

export const pomodoroWidgetDefinition: WidgetDefinition = {
  id: 'pomodoro',
  type: 'pomodoro',
  name: 'Pomodoro Timer',
  description: 'Focus timer with work/break cycles',
  category: 'productivity',
  icon: 'Timer',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 6, h: 5 },
  defaultSettings: {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    notificationsEnabled: true,
    compactMode: false,
  } satisfies PomodoroWidgetSettings,
  settingsSchema: pomodoroWidgetSchema,
  component: PomodoroWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};