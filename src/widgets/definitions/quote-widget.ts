import type { WidgetDefinition } from '../../types';
import { z } from 'zod';
import { Quote as QuoteIcon } from 'lucide-react';
import { QuoteWidget } from '../components/QuoteWidget';
import { quoteWidgetSchema, type QuoteWidgetSettings } from '../schemas';
import { DEFAULT_QUOTES } from '../../utils/helpers';

export const quoteWidgetDefinition: WidgetDefinition = {
  id: 'quote',
  type: 'quote',
  name: 'Daily Quote',
  description: 'Inspirational quotes with favorites and custom quotes',
  category: 'information',
  icon: 'Quote',
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 6 },
  defaultSettings: {
    source: 'api',
    customQuotes: [],
    autoRefresh: false,
    refreshInterval: 86400,
    showAuthor: true,
    fontSize: 18,
    textAlign: 'center',
    compactMode: false,
  } satisfies QuoteWidgetSettings,
  settingsSchema: quoteWidgetSchema,
  component: QuoteWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};