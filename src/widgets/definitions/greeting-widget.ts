import type { WidgetDefinition } from '../../types';
import { z } from 'zod';
import { Sun, Moon, Coffee, Sparkles } from 'lucide-react';
import { GreetingWidget } from '../components/GreetingWidget';
import { greetingWidgetSchema, type GreetingWidgetSettings } from '../schemas';

export const greetingWidgetDefinition: WidgetDefinition = {
  id: 'greeting',
  type: 'greeting',
  name: 'Greeting',
  description: 'Dynamic time-based greeting with customizable name',
  category: 'time',
  icon: 'Sun',
  defaultSize: { w: 6, h: 2 },
  minSize: { w: 4, h: 2 },
  maxSize: { w: 12, h: 4 },
  defaultSettings: {
    displayName: '',
    customGreeting: '',
    showTimeBasedGreeting: true,
    fontSize: 32,
    compactMode: false,
  } satisfies GreetingWidgetSettings,
  settingsSchema: greetingWidgetSchema,
  component: GreetingWidget,
  canDuplicate: false,
  canResize: true,
  canConfigure: true,
};