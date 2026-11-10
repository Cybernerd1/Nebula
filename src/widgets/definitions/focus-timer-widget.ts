import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { Target } from 'lucide-react';
import { FocusTimerWidget } from '../components/FocusTimerWidget';
import { focusTimerWidgetSchema, type FocusTimerWidgetSettings } from '../schemas';

export const focusTimerWidgetDefinition: WidgetDefinition = {
  id: 'focusTimer',
  type: 'focusTimer',
  name: 'Focus Timer',
  description: 'Simple countdown timer for focus sessions',
  category: 'productivity',
  icon: 'Target',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 6, h: 4 },
  defaultSettings: {
    defaultDuration: 30,
    presetDurations: [5, 10, 15, 20, 25, 30, 45, 60],
    soundEnabled: true,
    notificationsEnabled: true,
    autoStart: false,
    compactMode: false,
  } satisfies FocusTimerWidgetSettings,
  settingsSchema: focusTimerWidgetSchema,
  component: FocusTimerWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};