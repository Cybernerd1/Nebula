import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { Clock } from 'lucide-react';
import { ClockWidget } from '../components/ClockWidget';
import { clockWidgetSchema, type ClockWidgetSettings } from '../schemas';

export const clockWidgetDefinition: WidgetDefinition = {
  id: 'clock',
  type: 'clock',
  name: 'Clock',
  description: 'Real-time digital or analog clock with multiple time zones',
  category: 'time',
  icon: 'Clock',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 8, h: 6 },
  defaultSettings: {
    style: 'digital',
    format: '24h',
    showSeconds: false,
    fontSize: 48,
    showDate: true,
    showWeekday: true,
    timeZones: [],
    compactMode: false,
  } satisfies ClockWidgetSettings,
  settingsSchema: clockWidgetSchema,
  component: ClockWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};