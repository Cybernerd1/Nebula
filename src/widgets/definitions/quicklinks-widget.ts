import type { WidgetDefinition } from '../../types';
import { z } from 'zod';
import { Link } from 'lucide-react';
import { QuickLinksWidget } from '../components/QuickLinksWidget';
import { quickLinksWidgetSchema, type QuickLinksWidgetSettings } from '../schemas';

export const quickLinksWidgetDefinition: WidgetDefinition = {
  id: 'quicklinks',
  type: 'quicklinks',
  name: 'Quick Links',
  description: 'Quick access to your favorite websites',
  category: 'productivity',
  icon: 'Link',
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 3 },
  maxSize: { w: 12, h: 8 },
  defaultSettings: {
    showIcons: true,
    showNames: true,
    openInNewTab: false,
    iconSize: 32,
    layout: 'grid',
    columns: 6,
    gap: 12,
    borderRadius: 8,
    showAll: false,
    maxVisible: 0,
    compactMode: false,
  } satisfies QuickLinksWidgetSettings,
  settingsSchema: quickLinksWidgetSchema,
  component: QuickLinksWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};