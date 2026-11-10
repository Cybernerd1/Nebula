import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { CalendarClock } from 'lucide-react';
import { CountdownWidget } from '../components/CountdownWidget';
import { countdownWidgetSchema, type CountdownWidgetSettings } from '../schemas';

export const countdownWidgetDefinition: WidgetDefinition = {
  id: 'countdown',
  type: 'countdown',
  name: 'Countdown',
  description: 'Count down to a specific date and time',
  category: 'time',
  icon: 'CalendarClock',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 6, h: 4 },
  defaultSettings: {
    targetDate: 0,
    targetTime: '',
    title: 'Countdown',
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
    compactMode: false,
    onComplete: 'stop',
  } satisfies CountdownWidgetSettings,
  settingsSchema: countdownWidgetSchema,
  component: CountdownWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};