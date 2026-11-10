import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { StickyNote } from 'lucide-react';
import { NotesWidget } from '../components/NotesWidget';
import { notesWidgetSchema, type NotesWidgetSettings } from '../schemas';

export const notesWidgetDefinition: WidgetDefinition = {
  id: 'notes',
  type: 'notes',
  name: 'Notes',
  description: 'Quick notes and scratchpad',
  category: 'productivity',
  icon: 'StickyNote',
  defaultSize: { w: 6, h: 5 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 12, h: 8 },
  defaultSettings: {
    defaultContent: '',
    autoSave: true,
    saveDelay: 1000,
    showToolbar: true,
    showWordCount: false,
    fontSize: 14,
    fontFamily: 'inherit',
    compactMode: false,
  } satisfies NotesWidgetSettings,
  settingsSchema: notesWidgetSchema,
  component: NotesWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};