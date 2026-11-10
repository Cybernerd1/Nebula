import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { Globe } from 'lucide-react';
import { WorldClockWidget } from '../components/WorldClockWidget';
import { worldClockWidgetSchema, type WorldClockWidgetSettings } from '../schemas';

export const worldClockWidgetDefinition: WidgetDefinition = {
  id: 'worldClock',
  type: 'worldClock',
  name: 'World Clock',
  description: 'Multiple time zones at a glance',
  category: 'time',
  icon: 'Globe',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 8, h: 5 },
  defaultSettings: {
    timeZones: [],
    format: '24h',
    showDate: true,
    compactMode: false,
  } satisfies WorldClockWidgetSettings,
  settingsSchema: worldClockWidgetSchema,
  component: WorldClockWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};