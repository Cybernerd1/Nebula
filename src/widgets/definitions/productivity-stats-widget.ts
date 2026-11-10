import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { BarChart } from 'lucide-react';
import { ProductivityStatsWidget } from '../components/ProductivityStatsWidget';
import { productivityStatsWidgetSchema, type ProductivityStatsWidgetSettings } from '../schemas';

export const productivityStatsWidgetDefinition: WidgetDefinition = {
  id: 'productivityStats',
  type: 'productivityStats',
  name: 'Productivity Stats',
  description: 'Visualize your productivity metrics',
  category: 'productivity',
  icon: 'BarChart',
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 6 },
  defaultSettings: {
    showTasksCompleted: true,
    showFocusTime: true,
    showPomodoroCount: true,
    showStreak: true,
    period: 'week',
    chartType: 'bar',
    compactMode: false,
  } satisfies ProductivityStatsWidgetSettings,
  settingsSchema: productivityStatsWidgetSchema,
  component: ProductivityStatsWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};