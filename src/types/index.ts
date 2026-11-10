import { z } from 'zod';

// Re-export widget settings types from schemas
export type ClockWidgetSettings = z.infer<typeof import('../widgets/schemas').clockWidgetSchema>;
export type GreetingWidgetSettings = z.infer<typeof import('../widgets/schemas').greetingWidgetSchema>;
export type SearchWidgetSettings = z.infer<typeof import('../widgets/schemas').searchWidgetSchema>;
export type QuoteWidgetSettings = z.infer<typeof import('../widgets/schemas').quoteWidgetSchema>;
export type TodoWidgetSettings = z.infer<typeof import('../widgets/schemas').todoWidgetSchema>;
export type CollectionsWidgetSettings = z.infer<typeof import('../widgets/schemas').collectionsWidgetSchema>;
export type QuickLinksWidgetSettings = z.infer<typeof import('../widgets/schemas').quickLinksWidgetSchema>;
export type WeatherWidgetSettings = z.infer<typeof import('../widgets/schemas').weatherWidgetSchema>;
export type PomodoroWidgetSettings = z.infer<typeof import('../widgets/schemas').pomodoroWidgetSchema>;
export type WorldClockWidgetSettings = z.infer<typeof import('../widgets/schemas').worldClockWidgetSchema>;
export type FocusTimerWidgetSettings = z.infer<typeof import('../widgets/schemas').focusTimerWidgetSchema>;
export type CountdownWidgetSettings = z.infer<typeof import('../widgets/schemas').countdownWidgetSchema>;
export type NotesWidgetSettings = z.infer<typeof import('../widgets/schemas').notesWidgetSchema>;
export type CustomTextWidgetSettings = z.infer<typeof import('../widgets/schemas').customTextWidgetSchema>;
export type DailyFocusWidgetSettings = z.infer<typeof import('../widgets/schemas').dailyFocusWidgetSchema>;
export type ProductivityStatsWidgetSettings = z.infer<typeof import('../widgets/schemas').productivityStatsWidgetSchema>;

export interface WidgetConfig {
  id: string;
  type: string;
  enabled: boolean;
  position: WidgetPosition;
  size: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  settings: Record<string, unknown>;
  hidden: boolean;
  order: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  w: number;
  h: number;
}

export interface WidgetDefinition {
  id: string;
  type: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  defaultSettings: Record<string, unknown>;
  settingsSchema: z.ZodSchema;
  component: React.ComponentType<WidgetProps>;
  previewComponent?: React.ComponentType;
  canDuplicate: boolean;
  canResize: boolean;
  canConfigure: boolean;
}

export type WidgetCategory =
  | 'time'
  | 'productivity'
  | 'search'
  | 'information'
  | 'media'
  | 'custom';

export interface WidgetProps {
  config: WidgetConfig;
  onConfigChange: (settings: Record<string, unknown>) => void;
  onRemove: () => void;
  onHide: () => void;
  isEditing: boolean;
  isPreview?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  themeId: string;
  themeVariant?: string;
  wallpaper?: WallpaperConfig;
  widgets: WidgetConfig[];
  collections: Collection[];
  quickLinks: QuickLink[];
  tasks: Task[];
  settings: WorkspaceSettings;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
}

export interface WorkspaceSettings {
  gridColumns: number;
  gridRowHeight: number;
  widgetGap: number;
  compactMode: boolean;
  showWidgetBorders: boolean;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  links: QuickLink[];
  expanded: boolean;
  visible: boolean;
  order: number;
  showAll: boolean;
  maxVisible: number;
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
  favicon?: string;
  customIcon?: string;
  openInNewTab: boolean;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  order: number;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WallpaperConfig {
  type: 'image' | 'video' | 'gradient' | 'none';
  source: 'gallery' | 'upload' | 'custom';
  value: string;
  brightness: number;
  blur: number;
  overlay: number;
  position: 'center' | 'cover' | 'contain' | 'top' | 'bottom' | 'left' | 'right';
  autoRotate: boolean;
  rotationInterval: number;
  rotationImages?: string[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  preview: string;
  variants: ThemeVariant[];
  tokens: ThemeTokens;
  category: 'premium' | 'developer' | 'minimal' | 'artistic';
}

export interface ThemeVariant {
  id: string;
  name: string;
  description: string;
  tokens: Partial<ThemeTokens>;
}

export interface ThemeTokens {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
  animations: Record<string, string>;
  backgrounds: Record<string, string>;
}

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  suggestionUrl?: string;
  icon: string;
  isDefault: boolean;
}

export interface SearchEngineConfig {
  engineId: string;
  showSuggestions: boolean;
  openInNewTab: boolean;
  shortcutKey: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  favorite: boolean;
  source: 'api' | 'custom';
  createdAt: number;
}

export interface GlobalSettings {
  appearance: AppearanceSettings;
  themes: ThemeSettings;
  wallpapers: WallpaperSettings;
  layout: LayoutSettings;
  search: SearchSettings;
  hidden: HiddenSettings;
  shortcuts: ShortcutSettings;
  data: DataSettings;
}

export interface AppearanceSettings {
  colorScheme: 'light' | 'dark' | 'amoled' | 'system';
  accentColor: string;
  cardTransparency: number;
  cardBlur: number;
  cornerRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontFamily: string;
  fontSize: number;
}

export interface ThemeSettings {
  currentTheme: string;
  currentVariant?: string;
  customThemes: CustomTheme[];
}

export interface CustomTheme {
  id: string;
  name: string;
  baseTheme: string;
  tokens: Partial<ThemeTokens>;
  createdAt: number;
}

export interface WallpaperSettings {
  galleryImages: GalleryWallpaper[];
  autoRotate: boolean;
  rotationInterval: number;
  defaultBrightness: number;
  defaultBlur: number;
  defaultOverlay: number;
  defaultPosition: WallpaperConfig['position'];
}

export interface GalleryWallpaper {
  id: string;
  name: string;
  preview: string;
  thumbnail: string;
  category: string;
  type: 'image' | 'video';
}

export interface LayoutSettings {
  widgetSpacing: number;
  gridColumns: number;
  gridRowHeight: number;
  dashboardAlignment: 'center' | 'left' | 'stretch';
  defaultWidgetSizes: Record<string, WidgetSize>;
}

export interface SearchSettings {
  defaultEngine: string;
  clockStyle: 'digital' | 'analog';
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  timeZones: TimeZoneConfig[];
}

export interface TimeZoneConfig {
  id: string;
  name: string;
  zone: string;
  enabled: boolean;
}

export interface HiddenSettings {
  hiddenWidgets: string[];
  hiddenCollections: string[];
}

export interface ShortcutSettings {
  shortcuts: Record<string, string>;
}

export interface DataSettings {
  autoBackup: boolean;
  backupInterval: number;
  maxBackups: number;
}

export interface StorageSchema {
  version: number;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  globalSettings: GlobalSettings;
  metadata: {
    createdAt: number;
    updatedAt: number;
    extensionVersion: string;
  };
}

export interface ImportExportData {
  version: number;
  exportDate: number;
  workspaces: Workspace[];
  globalSettings: GlobalSettings;
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKeys: string;
  configurable: boolean;
  action: string;
}

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
  title?: string;
}

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  resizeHandles?: ('s' | 'e' | 'w' | 'n' | 'se' | 'sw' | 'ne' | 'nw')[];
}

export interface BreakpointConfig {
  cols: number;
  breakpoint: number;
}