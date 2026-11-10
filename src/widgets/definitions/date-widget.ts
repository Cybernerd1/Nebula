import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { Calendar } from 'lucide-react';
import { DateWidget } from '../components/DateWidget';
import { baseWidgetSchema } from '../schemas';

const dateWidgetSchema = baseWidgetSchema.extend({
  format: z.enum(['full', 'short', 'numeric']).default('full'),
  showWeekday: z.boolean().default(true),
  fontSize: z.number().min(12).max(72).default(24),
});

type DateWidgetSettings = z.infer<typeof dateWidgetSchema>;

export const dateWidgetDefinition: WidgetDefinition = {
  id: 'date',
  type: 'date',
  name: 'Date',
  description: 'Current date and weekday display',
  category: 'time',
  icon: 'Calendar',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 4 },
  defaultSettings: {
    format: 'full',
    showWeekday: true,
    fontSize: 24,
    compactMode: false,
  } satisfies DateWidgetSettings,
  settingsSchema: dateWidgetSchema,
  component: DateWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};