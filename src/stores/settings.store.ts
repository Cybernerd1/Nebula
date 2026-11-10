import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GlobalSettings, AppearanceSettings, ThemeSettings, WallpaperSettings, LayoutSettings, SearchSettings, HiddenSettings, ShortcutSettings, DataSettings } from '../types';
import { storageService } from '../services/storage';

const DEFAULT_SETTINGS: GlobalSettings = {
  appearance: {
    colorScheme: 'dark',
    accentColor: '#06b6d4',
    cardTransparency: 0,
    cardBlur: 0,
    cornerRadius: 'lg',
    fontFamily: 'system',
    fontSize: 16,
  },
  themes: {
    currentTheme: 'nebula',
    customThemes: [],
  },
  wallpapers: {
    galleryImages: [],
    autoRotate: false,
    rotationInterval: 300000,
    defaultBrightness: 1,
    defaultBlur: 0,
    defaultOverlay: 0.5,
    defaultPosition: 'center',
  },
  layout: {
    widgetSpacing: 16,
    gridColumns: 12,
    gridRowHeight: 80,
    dashboardAlignment: 'center',
    defaultWidgetSizes: {},
  },
  search: {
    defaultEngine: 'google',
    clockStyle: 'digital',
    timeFormat: '24h',
    showSeconds: false,
    timeZones: [],
  },
  hidden: {
    hiddenWidgets: [],
    hiddenCollections: [],
  },
  shortcuts: {
    shortcuts: {
      'search': 'Ctrl+K',
      'edit': 'Ctrl+E',
      'workspace': 'Ctrl+Shift+W',
      'settings': 'Ctrl+,',
      'addWidget': 'Ctrl+Shift+A',
      'commandPalette': 'Ctrl+Shift+P',
    },
  },
  data: {
    autoBackup: false,
    backupInterval: 86400000,
    maxBackups: 10,
  },
};

interface SettingsState {
  settings: GlobalSettings;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  updateAppearance: (updates: Partial<AppearanceSettings>) => Promise<void>;
  updateThemes: (updates: Partial<ThemeSettings>) => Promise<void>;
  updateWallpapers: (updates: Partial<WallpaperSettings>) => Promise<void>;
  updateLayout: (updates: Partial<LayoutSettings>) => Promise<void>;
  updateSearch: (updates: Partial<SearchSettings>) => Promise<void>;
  updateHidden: (updates: Partial<HiddenSettings>) => Promise<void>;
  updateShortcuts: (updates: Partial<ShortcutSettings>) => Promise<void>;
  updateData: (updates: Partial<DataSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => GlobalSettings;
  importSettings: (settings: GlobalSettings) => Promise<void>;
  applyTheme: (themeId: string, variant?: string) => Promise<void>;
  addCustomTheme: (theme: ThemeSettings['customThemes'][0]) => Promise<void>;
  removeCustomTheme: (themeId: string) => Promise<void>;
  toggleHiddenWidget: (widgetId: string) => Promise<void>;
  toggleHiddenCollection: (collectionId: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: true,
      error: null,

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const stored = await storageService.getSettings();
          if (stored) {
            // Deep-merge shortcut defaults so new shortcuts added in an
            // upgrade aren't missing from previously stored settings
            const merged: GlobalSettings = {
              ...DEFAULT_SETTINGS,
              ...stored,
              shortcuts: {
                shortcuts: { ...DEFAULT_SETTINGS.shortcuts.shortcuts, ...(stored.shortcuts?.shortcuts || {}) },
              },
            };
            set({ settings: merged, isLoading: false });
            // Re-apply appearance (accent color, radius, effects, etc.) so
            // they survive a reload, not just theme selection
            applyAppearanceToDOM(merged.appearance);
            // Theme is applied by workspace store's initialize to respect per-workspace themes
          } else {
            set({ settings: DEFAULT_SETTINGS, isLoading: false });
            applyAppearanceToDOM(DEFAULT_SETTINGS.appearance);
          }
        } catch (error) {
          set({ error: 'Failed to initialize settings', isLoading: false });
        }
      },

      updateAppearance: async (updates) => {
        const newSettings = { ...get().settings, appearance: { ...get().settings.appearance, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
        applyAppearanceToDOM(newSettings.appearance);
      },

      updateThemes: async (updates) => {
        const newSettings = { ...get().settings, themes: { ...get().settings.themes, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
        // Apply theme whenever theme id OR variant changes
        if (updates.currentTheme || updates.currentVariant !== undefined) {
          const themeId = updates.currentTheme ?? get().settings.themes.currentTheme;
          const variant = updates.currentVariant ?? get().settings.themes.currentVariant;
          get().applyTheme(themeId, variant);
        }
      },

      updateWallpapers: async (updates) => {
        const newSettings = { ...get().settings, wallpapers: { ...get().settings.wallpapers, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      updateLayout: async (updates) => {
        const newSettings = { ...get().settings, layout: { ...get().settings.layout, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      updateSearch: async (updates) => {
        const newSettings = { ...get().settings, search: { ...get().settings.search, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      updateHidden: async (updates) => {
        const newSettings = { ...get().settings, hidden: { ...get().settings.hidden, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      updateShortcuts: async (updates) => {
        const newSettings = { ...get().settings, shortcuts: { ...get().settings.shortcuts, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      updateData: async (updates) => {
        const newSettings = { ...get().settings, data: { ...get().settings.data, ...updates } };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      resetSettings: async () => {
        set({ settings: DEFAULT_SETTINGS });
        await storageService.setSettings(DEFAULT_SETTINGS);
        get().applyTheme('nebula');
        applyAppearanceToDOM(DEFAULT_SETTINGS.appearance);
      },

      exportSettings: () => {
        return { ...get().settings };
      },

      importSettings: async (settings) => {
        const merged = { ...DEFAULT_SETTINGS, ...settings };
        set({ settings: merged });
        await storageService.setSettings(merged);
        get().applyTheme(merged.themes.currentTheme, merged.themes.currentVariant);
        applyAppearanceToDOM(merged.appearance);
      },

      applyTheme: async (themeId, variant) => {
        const { themes, appearance } = get().settings;
        const customTheme = themeId === 'custom'
          ? themes.customThemes.find((t) => t.id === variant)
          : null;

        // Apply data-theme and data-variant attributes to <html>
        document.documentElement.setAttribute('data-theme', themeId);
        if (variant) {
          document.documentElement.setAttribute('data-variant', variant);
        } else {
          document.documentElement.removeAttribute('data-variant');
        }

        // Apply custom token overrides if it's a custom theme, otherwise
        // clear any leftovers from a previously applied custom theme
        if (customTheme) {
          applyCustomThemeTokens(customTheme.tokens);
        } else {
          clearCustomThemeTokens();
        }

        // Re-apply appearance overrides (accent color, corner radius, etc.)
        // so they persist on top of whichever theme CSS variables were set
        applyAppearanceToDOM(appearance);
      },

      addCustomTheme: async (theme) => {
        const newSettings = {
          ...get().settings,
          themes: {
            ...get().settings.themes,
            customThemes: [...get().settings.themes.customThemes, theme],
          },
        };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      removeCustomTheme: async (themeId) => {
        const newSettings = {
          ...get().settings,
          themes: {
            ...get().settings.themes,
            customThemes: get().settings.themes.customThemes.filter((t) => t.id !== themeId),
          },
        };
        set({ settings: newSettings });
        await storageService.setSettings(newSettings);
      },

      toggleHiddenWidget: async (widgetId) => {
        const { hidden } = get().settings;
        const hiddenWidgets = hidden.hiddenWidgets.includes(widgetId)
          ? hidden.hiddenWidgets.filter((id) => id !== widgetId)
          : [...hidden.hiddenWidgets, widgetId];
        
        await get().updateHidden({ hiddenWidgets });
      },

      toggleHiddenCollection: async (collectionId) => {
        const { hidden } = get().settings;
        const hiddenCollections = hidden.hiddenCollections.includes(collectionId)
          ? hidden.hiddenCollections.filter((id) => id !== collectionId)
          : [...hidden.hiddenCollections, collectionId];
        
        await get().updateHidden({ hiddenCollections });
      },
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: () => ({}),
    }
  )
);

function applyAppearanceToDOM(appearance: AppearanceSettings) {
  const root = document.documentElement;
  
  root.setAttribute('data-color-scheme', appearance.colorScheme);
  if (appearance.colorScheme === 'amoled') {
    root.classList.add('amoled');
  } else {
    root.classList.remove('amoled');
  }

  if (appearance.accentColor) {
    root.style.setProperty('--color-accent', appearance.accentColor);
    root.style.setProperty('--color-primary', appearance.accentColor);
  }

  const radiusMap = {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  };
  root.style.setProperty('--radius-md', radiusMap[appearance.cornerRadius]);
  root.style.setProperty('--radius-lg', `calc(${radiusMap[appearance.cornerRadius]} * 1.5)`);
  root.style.setProperty('--radius-xl', `calc(${radiusMap[appearance.cornerRadius]} * 2)`);

  if (appearance.cardTransparency !== undefined) {
    root.style.setProperty('--card-opacity', String(1 - appearance.cardTransparency));
  }

  if (appearance.cardBlur !== undefined) {
    root.style.setProperty('--card-blur', `${appearance.cardBlur}px`);
  }

  if (appearance.fontSize !== undefined) {
    root.style.setProperty('--font-size-base', `${appearance.fontSize}px`);
  }
}

const CUSTOM_TOKEN_PROPS: string[] = [];

function applyCustomThemeTokens(tokens: Partial<import('../types').ThemeTokens>) {
  // Clear previously applied custom tokens first so switching between
  // custom themes (or back to built-ins) doesn't leave stale overrides
  clearCustomThemeTokens();
  const root = document.documentElement;
  
  if (tokens.colors) {
    Object.entries(tokens.colors).forEach(([key, value]) => {
      const prop = `--color-${key}`;
      root.style.setProperty(prop, value);
      CUSTOM_TOKEN_PROPS.push(prop);
    });
  }
  
  if (tokens.fonts) {
    Object.entries(tokens.fonts).forEach(([key, value]) => {
      const prop = `--font-${key}`;
      root.style.setProperty(prop, value);
      CUSTOM_TOKEN_PROPS.push(prop);
    });
  }
  
  if (tokens.shadows) {
    Object.entries(tokens.shadows).forEach(([key, value]) => {
      const prop = `--shadow-${key}`;
      root.style.setProperty(prop, value);
      CUSTOM_TOKEN_PROPS.push(prop);
    });
  }
}

function clearCustomThemeTokens() {
  const root = document.documentElement;
  CUSTOM_TOKEN_PROPS.forEach((prop) => root.style.removeProperty(prop));
  CUSTOM_TOKEN_PROPS.length = 0;
}