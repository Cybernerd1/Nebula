import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Workspace, WidgetConfig, WorkspaceSettings } from '../types';
import { generateId } from '../utils/helpers';
import { storageService } from '../services/storage';
import { useSettingsStore } from './settings.store';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  createWorkspace: (name: string, icon?: string, template?: Partial<Workspace>) => Promise<Workspace>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  duplicateWorkspace: (id: string) => Promise<Workspace>;
  setActiveWorkspace: (id: string) => Promise<void>;
  setDefaultWorkspace: (id: string) => Promise<void>;
  reorderWorkspaces: (workspaceIds: string[]) => Promise<void>;
  getActiveWorkspace: () => Workspace | null;
  getWorkspace: (id: string) => Workspace | null;
  exportWorkspace: (id: string) => Promise<Workspace>;
  importWorkspace: (workspace: Workspace) => Promise<Workspace>;
  persistToStorage: () => Promise<void>;
}

const DEFAULT_WORKSPACE: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Main Workspace',
  icon: 'layout-grid',
  themeId: 'nebula',
  widgets: [],
  collections: [],
  quickLinks: [],
  tasks: [],
  settings: {
    gridColumns: 12,
    gridRowHeight: 80,
    widgetGap: 16,
    compactMode: false,
    showWidgetBorders: false,
  },
  isDefault: true,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      isLoading: true,
      error: null,

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const storage = await storageService.getStorage();
          if (storage && storage.workspaces.length > 0) {
            const activeId = storage.activeWorkspaceId || storage.workspaces[0].id;
            const activeWorkspace = storage.workspaces.find((ws) => ws.id === activeId);
            set({
              workspaces: storage.workspaces,
              activeWorkspaceId: activeId,
              isLoading: false,
            });

            // Apply the active workspace's theme on initialization
            if (activeWorkspace?.themeId) {
              useSettingsStore.getState().applyTheme(activeWorkspace.themeId, activeWorkspace.themeVariant);
            }
          } else {
            const workspace: Workspace = {
              ...DEFAULT_WORKSPACE,
              id: generateId('ws'),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            set({
              workspaces: [workspace],
              activeWorkspaceId: workspace.id,
              isLoading: false,
            });
            await get().persistToStorage();

            // Apply default theme for new workspace
            useSettingsStore.getState().applyTheme('nebula');
          }
        } catch (error) {
          set({ error: 'Failed to initialize workspaces', isLoading: false });
        }
      },

      createWorkspace: async (name, icon = 'layout-grid', template) => {
        const workspace: Workspace = {
          id: generateId('ws'),
          name,
          icon,
          themeId: template?.themeId || 'nebula',
          themeVariant: template?.themeVariant,
          wallpaper: template?.wallpaper,
          widgets: template?.widgets || [],
          collections: template?.collections || [],
          quickLinks: template?.quickLinks || [],
          tasks: template?.tasks || [],
          settings: template?.settings || DEFAULT_WORKSPACE.settings,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        };

        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        }));

        await get().persistToStorage();
        return workspace;
      },

      updateWorkspace: async (id, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? { ...ws, ...updates, updatedAt: Date.now() } : ws
          ),
        }));
        await get().persistToStorage();
      },

      deleteWorkspace: async (id) => {
        const { workspaces, activeWorkspaceId } = get();
        if (workspaces.length <= 1) {
          throw new Error('Cannot delete the last workspace');
        }

        const newWorkspaces = workspaces.filter((ws) => ws.id !== id);
        let newActiveId = activeWorkspaceId;

        if (activeWorkspaceId === id) {
          newActiveId = newWorkspaces[0].id;
        }

        set({
          workspaces: newWorkspaces,
          activeWorkspaceId: newActiveId,
        });

        await get().persistToStorage();
      },

      duplicateWorkspace: async (id) => {
        const workspace = get().getWorkspace(id);
        if (!workspace) throw new Error('Workspace not found');

        const duplicated: Workspace = {
          ...workspace,
          id: generateId('ws'),
          name: `${workspace.name} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        };

        set((state) => ({
          workspaces: [...state.workspaces, duplicated],
        }));

        await get().persistToStorage();
        return duplicated;
      },

      setActiveWorkspace: async (id) => {
        const workspace = get().getWorkspace(id);
        if (!workspace) throw new Error('Workspace not found');

        set({ activeWorkspaceId: id });
        await get().persistToStorage();

        // Apply workspace's theme when switching workspaces
        if (workspace.themeId) {
          useSettingsStore.getState().applyTheme(workspace.themeId, workspace.themeVariant);
        }
      },

      setDefaultWorkspace: async (id) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) => ({
            ...ws,
            isDefault: ws.id === id,
          })),
        }));
        await get().persistToStorage();
      },

      reorderWorkspaces: async (workspaceIds) => {
        const { workspaces } = get();
        const workspaceMap = new Map(workspaces.map((ws) => [ws.id, ws]));
        const reordered = workspaceIds.map((id) => workspaceMap.get(id)!).filter(Boolean);

        set({ workspaces: reordered });
        await get().persistToStorage();
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((ws) => ws.id === activeWorkspaceId) || null;
      },

      getWorkspace: (id) => {
        const { workspaces } = get();
        return workspaces.find((ws) => ws.id === id) || null;
      },

      exportWorkspace: async (id) => {
        const workspace = get().getWorkspace(id);
        if (!workspace) throw new Error('Workspace not found');
        return { ...workspace };
      },

      importWorkspace: async (workspace) => {
        const imported: Workspace = {
          ...workspace,
          id: generateId('ws'),
          name: `${workspace.name} (Imported)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: false,
        };

        set((state) => ({
          workspaces: [...state.workspaces, imported],
        }));

        await get().persistToStorage();
        return imported;
      },

      persistToStorage: async () => {
        const { workspaces, activeWorkspaceId } = get();
        const storage = await storageService.getStorage();
        const globalSettings = storage?.globalSettings;

        await storageService.setStorage({
          version: 1,
          workspaces,
          activeWorkspaceId: activeWorkspaceId || '',
          globalSettings: globalSettings || getDefaultGlobalSettings(),
          metadata: {
            createdAt: storage?.metadata.createdAt || Date.now(),
            updatedAt: Date.now(),
            extensionVersion: '1.0.0',
          },
        });
      },
    }),
    {
      name: 'workspace-store',
      storage: createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: () => ({}),
    }
  )
);

function getDefaultGlobalSettings() {
  return {
    appearance: {
      colorScheme: 'dark' as const,
      accentColor: '#06b6d4',
      cardTransparency: 0,
      cardBlur: 0,
      cornerRadius: 'lg' as const,
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
      defaultPosition: 'center' as const,
    },
    layout: {
      widgetSpacing: 16,
      gridColumns: 12,
      gridRowHeight: 80,
      dashboardAlignment: 'center' as const,
      defaultWidgetSizes: {},
    },
    search: {
      defaultEngine: 'google',
      clockStyle: 'digital' as const,
      timeFormat: '24h' as const,
      showSeconds: false,
      timeZones: [],
    },
    hidden: {
      hiddenWidgets: [],
      hiddenCollections: [],
    },
    shortcuts: {
      shortcuts: {},
    },
    data: {
      autoBackup: false,
      backupInterval: 86400000,
      maxBackups: 10,
    },
  };
}