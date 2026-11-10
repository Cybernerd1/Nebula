import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { Type } from 'lucide-react';
import { CustomTextWidget } from '../components/CustomTextWidget';
import { customTextWidgetSchema, type CustomTextWidgetSettings } from '../schemas';

export const customTextWidgetDefinition: WidgetDefinition = {
  id: 'customText',
  type: 'customText',
  name: 'Custom Text',
  description: 'Display custom text, markdown, or HTML',
  category: 'custom',
  icon: 'Type',
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 12, h: 8 },
  defaultSettings: {
    content: '',
    format: 'markdown',
    fontSize: 16,
    textAlign: 'left',
    lineHeight: 1.6,
    color: '',
    backgroundColor: '',
    padding: 16,
    compactMode: false,
  } satisfies CustomTextWidgetSettings,
  settingsSchema: customTextWidgetSchema,
  component: CustomTextWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};