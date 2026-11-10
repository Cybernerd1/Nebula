import type { WidgetDefinition } from '../../types';
import { z } from 'zod';
import { Search as SearchIcon } from 'lucide-react';
import { SearchWidget } from '../components/SearchWidget';
import { searchWidgetSchema, type SearchWidgetSettings } from '../schemas';
import { DEFAULT_SEARCH_ENGINES } from '../../utils/helpers';

export const searchWidgetDefinition: WidgetDefinition = {
  id: 'search',
  type: 'search',
  name: 'Web Search',
  description: 'Search the web with multiple engine support',
  category: 'search',
  icon: 'Search',
  defaultSize: { w: 6, h: 2 },
  minSize: { w: 4, h: 2 },
  maxSize: { w: 12, h: 3 },
  defaultSettings: {
    engine: 'google',
    showSuggestions: true,
    openInNewTab: false,
    placeholder: 'Search the web...',
    width: 400,
    position: 'center',
    compactMode: false,
  } satisfies SearchWidgetSettings,
  settingsSchema: searchWidgetSchema,
  component: SearchWidget,
  canDuplicate: false,
  canResize: true,
  canConfigure: true,
};