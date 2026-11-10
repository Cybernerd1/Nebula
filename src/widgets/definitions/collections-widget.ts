import type { WidgetDefinition } from '../../types';
import { z } from 'zod';
import { Folder } from 'lucide-react';
import { CollectionsWidget } from '../components/CollectionsWidget';
import { collectionsWidgetSchema, type CollectionsWidgetSettings } from '../schemas';

export const collectionsWidgetDefinition: WidgetDefinition = {
  id: 'collections',
  type: 'collections',
  name: 'Collections',
  description: 'Organize website shortcuts into categorized collections',
  category: 'productivity',
  icon: 'Folder',
  defaultSize: { w: 6, h: 6 },
  minSize: { w: 4, h: 4 },
  maxSize: { w: 12, h: 12 },
  defaultSettings: {
    showAll: false,
    maxVisiblePerCollection: 6,
    showEmptyCollections: false,
    defaultExpanded: true,
    showIcons: true,
    showNames: true,
    showLinkCount: true,
    compactMode: false,
  } satisfies CollectionsWidgetSettings,
  settingsSchema: collectionsWidgetSchema,
  component: CollectionsWidget,
  canDuplicate: false,
  canResize: true,
  canConfigure: true,
};