import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { Flag } from 'lucide-react';
import { DailyFocusWidget } from '../components/DailyFocusWidget';
import { dailyFocusWidgetSchema, type DailyFocusWidgetSettings } from '../schemas';

export const dailyFocusWidgetDefinition: WidgetDefinition = {
  id: 'dailyFocus',
  type: 'dailyFocus',
  name: 'Daily Focus',
  description: 'Track daily goals and priorities',
  category: 'productivity',
  icon: 'Flag',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 6, h: 6 },
  defaultSettings: {
    goals: [],
    maxGoals: 3,
    showProgress: true,
    resetTime: '00:00',
    notificationsEnabled: true,
    compactMode: false,
  } satisfies DailyFocusWidgetSettings,
  settingsSchema: dailyFocusWidgetSchema,
  component: DailyFocusWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};