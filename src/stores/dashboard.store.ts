import { create } from 'zustand';
import type { WidgetConfig, GridLayoutItem, WidgetDefinition } from '../types';
import { generateId } from '../utils/helpers';
import { useWorkspaceStore } from './workspace.store';
import { useSettingsStore } from './settings.store';

let layoutPersistTimer: ReturnType<typeof setTimeout> | null = null;

// Compare layouts by content so we don't cascade identity-only updates
// between the grid and the workspace store (prevents render loops)
function layoutsEquivalent(a: GridLayoutItem[], b: GridLayoutItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item) => {
    const other = b.find((l) => l.i === item.i);
    return !!other &&
      item.x === other.x && item.y === other.y &&
      item.w === other.w && item.h === other.h;
  });
}

// Grid column count used for position clamping (matches the default layout)
const GRID_MAX_COLS = 12;
const GRID_MAX_ROWS = 48;

function clampValue(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.round(Math.min(Math.max(num, min), Math.max(min, max)));
}

// Clamp a widget's persisted geometry to its definition's bounds. Corrupted
// or out-of-range data (e.g. a clock persisted as 1x1, under its 3x2 minimum)
// previously reached the grid untouched and broke the layout.
function sanitizeWidgetGeometry(
  widget: WidgetConfig,
  definitions: Map<string, WidgetDefinition>,
): WidgetConfig {
  const def = definitions.get(widget.type);
  const fallbackW = def?.defaultSize?.w ?? 4;
  const fallbackH = def?.defaultSize?.h ?? 3;
  const minW = def?.minSize?.w ?? fallbackW;
  const minH = def?.minSize?.h ?? fallbackH;
  const maxW = def?.maxSize?.w ?? GRID_MAX_COLS;
  const maxH = def?.maxSize?.h ?? GRID_MAX_ROWS;

  const w = clampValue(widget.size?.w, minW, maxW, fallbackW);
  const h = clampValue(widget.size?.h, minH, maxH, fallbackH);
  const x = clampValue(widget.position?.x, 0, GRID_MAX_COLS - w, 0);
  const y = clampValue(widget.position?.y, 0, GRID_MAX_ROWS, 0);

  if (
    widget.size?.w === w && widget.size?.h === h &&
    widget.position?.x === x && widget.position?.y === y
  ) {
    return widget;
  }
  return {
    ...widget,
    size: { ...widget.size, w, h },
    position: { ...widget.position, x, y },
  };
}

interface DashboardState {
  isEditing: boolean;
  editingWidgetId: string | null;
  layout: GridLayoutItem[];
  hiddenWidgets: Set<string>;
  widgetDefinitions: Map<string, WidgetDefinition>;

  setEditing: (editing: boolean) => void;
  setEditingWidget: (id: string | null) => void;
  setLayout: (layout: GridLayoutItem[]) => void;
  rebuildLayout: (widgets: WidgetConfig[]) => void;
  applyLayoutChange: (layout: readonly GridLayoutItem[]) => void;
  updateWidgetPosition: (id: string, x: number, y: number) => void;
  updateWidgetSize: (id: string, w: number, h: number) => void;
  addWidget: (type: string, position?: { x: number; y: number }) => WidgetConfig | null;
  removeWidget: (id: string) => void;
  hideWidget: (id: string) => void;
  showWidget: (id: string) => void;
  toggleWidgetVisibility: (id: string) => void;
  updateWidgetSettings: (id: string, settings: Record<string, unknown>) => void;
  duplicateWidget: (id: string) => WidgetConfig | null;
  resetWidgetSettings: (id: string) => void;
  getWidgetConfig: (id: string) => WidgetConfig | undefined;
  getVisibleWidgets: () => WidgetConfig[];
  registerWidgetDefinitions: (definitions: WidgetDefinition[]) => void;
  getWidgetDefinition: (type: string) => WidgetDefinition | undefined;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isEditing: false,  editingWidgetId: null,
  layout: [],
  hiddenWidgets: new Set(),
  widgetDefinitions: new Map(),

  setEditing: (editing) => set({ isEditing: editing, editingWidgetId: editing ? get().editingWidgetId : null }),

  setEditingWidget: (id) => set({ editingWidgetId: id }),

  setLayout: (layout) => set({ layout }),

  // Rebuild the RGL layout from the active workspace's widgets (used on init
  // and whenever the workspace's widget list changes externally)
  rebuildLayout: (widgets) => {
    const definitions = get().widgetDefinitions;

    // Repair pass: write clamped geometry back to the workspace so corrupted
    // persisted sizes heal automatically on the next save
    const sanitized = widgets.map((w) => sanitizeWidgetGeometry(w, definitions));
    if (sanitized.some((w, i) => w !== widgets[i])) {
      const { activeWorkspaceId } = useWorkspaceStore.getState();
      const workspace = activeWorkspaceId
        ? useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId)
        : null;
      if (workspace) {
        useWorkspaceStore.getState().updateWorkspace(workspace.id, { widgets: sanitized });
      }
    }

    const layout: GridLayoutItem[] = sanitized.map((w) => ({
      i: w.id,
      x: w.position.x,
      y: w.position.y,
      w: w.size.w,
      h: w.size.h,
      minW: w.minSize?.w,
      minH: w.minSize?.h,
      maxW: w.maxSize?.w,
      maxH: w.maxSize?.h,
      isDraggable: true,
      isResizable: get().widgetDefinitions.get(w.type)?.canResize ?? true,
      resizeHandles: ['se', 'e', 's'],
    }));
    if (layoutsEquivalent(get().layout, layout)) return;
    set({
      layout,
      hiddenWidgets: new Set(widgets.filter((w) => w.hidden).map((w) => w.id)),
    });
  },

  // Persist layout changes made by dragging/resizing back onto the widgets
  applyLayoutChange: (layout) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (!activeWorkspaceId) return;

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    // Clamp emitted items against each widget's definition bounds so nothing
    // below minimum size (or out of grid range) can ever be persisted
    const definitions = get().widgetDefinitions;
    const clamped: GridLayoutItem[] = layout.map((item) => {
      const widget = workspace.widgets.find((w) => w.id === item.i);
      if (!widget) return item;
      const def = definitions.get(widget.type);
      const minW = def?.minSize?.w ?? widget.minSize?.w ?? 1;
      const minH = def?.minSize?.h ?? widget.minSize?.h ?? 1;
      const maxW = def?.maxSize?.w ?? widget.maxSize?.w ?? GRID_MAX_COLS;
      const maxH = def?.maxSize?.h ?? widget.maxSize?.h ?? GRID_MAX_ROWS;
      const w = clampValue(item.w, minW, maxW, minW);
      const h = clampValue(item.h, minH, maxH, minH);
      const x = clampValue(item.x, 0, GRID_MAX_COLS - w, 0);
      const y = clampValue(item.y, 0, GRID_MAX_ROWS, 0);
      return { ...item, w, h, x, y };
    });

    if (layoutsEquivalent(get().layout, clamped)) return;

    set({ layout: clamped });

    // Persist widget positions/sizes on the workspace (debounced to avoid
    // thrashing state while the user is actively dragging)
    if (layoutPersistTimer) clearTimeout(layoutPersistTimer);
    layoutPersistTimer = setTimeout(() => {
      const { activeWorkspaceId: wsId } = useWorkspaceStore.getState();
      if (!wsId) return;
      const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === wsId);
      if (!workspace) return;

      useWorkspaceStore.getState().updateWorkspace(wsId, {
        widgets: workspace.widgets.map((w) => {
          const item = clamped.find((l) => l.i === w.id);
          if (!item) return w;
          return {
            ...w,
            position: { ...w.position, x: item.x, y: item.y },
            size: { ...w.size, w: item.w, h: item.h },
          };
        }),
      });
    }, 400);
  },

  updateWidgetPosition: (id, x, y) =>
    set((state) => ({
      layout: state.layout.map((item) =>
        item.i === id ? { ...item, x, y } : item
      ),
    })),

  updateWidgetSize: (id, w, h) =>
    set((state) => ({
      layout: state.layout.map((item) =>
        item.i === id ? { ...item, w, h } : item
      ),
    })),

  addWidget: (type, position) => {
    const definition = get().widgetDefinitions.get(type);
    if (!definition) return null;

    const { workspaces, activeWorkspaceId } = useWorkspaceStore.getState();
    const workspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return null;

    const existingWidgetIds = new Set(workspace.widgets.map((w) => w.id));
    let newId = generateId('widget');
    while (existingWidgetIds.has(newId)) {
      newId = generateId('widget');
    }

    const maxOrder = Math.max(0, ...workspace.widgets.map((w) => w.order));
    const newOrder = maxOrder + 1;

    // Stack new widgets below the lowest one — a placeholder row count does
    // not track actual widget heights and causes overlaps
    const maxYBottom = workspace.widgets.reduce(
      (max, w) => Math.max(max, (w.position?.y ?? 0) + (w.size?.h ?? 0)),
      0,
    );

    const widgetConfig: WidgetConfig = {
      id: newId,
      type,
      enabled: true,
      position: position || { x: 0, y: maxYBottom },
      size: { ...definition.defaultSize },
      minSize: { ...definition.minSize },
      maxSize: { ...definition.maxSize },
      settings: { ...definition.defaultSettings },
      hidden: false,
      order: newOrder,
    };

    const layoutItem: GridLayoutItem = {
      i: newId,
      x: widgetConfig.position.x,
      y: widgetConfig.position.y,
      w: widgetConfig.size.w,
      h: widgetConfig.size.h,
      minW: widgetConfig.minSize?.w,
      minH: widgetConfig.minSize?.h,
      maxW: widgetConfig.maxSize?.w,
      maxH: widgetConfig.maxSize?.h,
      isDraggable: true,
      isResizable: definition.canResize,
      resizeHandles: ['se', 'e', 's'],
    };

    useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId!, {
      widgets: [...workspace.widgets, widgetConfig],
    });

    set((state) => ({
      layout: [...state.layout, layoutItem],
    }));

    return widgetConfig;
  },

  removeWidget: (id) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (!activeWorkspaceId) return;

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, {
      widgets: workspace.widgets.filter((w) => w.id !== id),
    });

    set((state) => ({
      layout: state.layout.filter((item) => item.i !== id),
      hiddenWidgets: new Set([...state.hiddenWidgets].filter((hid) => hid !== id)),
    }));
  },

  hideWidget: (id) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    const workspace = activeWorkspaceId
      ? useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId)
      : null;
    if (workspace) {
      useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId!, {
        widgets: workspace.widgets.map((w) => (w.id === id ? { ...w, hidden: true } : w)),
      });
    }

    set((state) => {
      const newHidden = new Set(state.hiddenWidgets);
      newHidden.add(id);
      return { hiddenWidgets: newHidden };
    });
  },

  showWidget: (id) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    const workspace = activeWorkspaceId
      ? useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId)
      : null;
    if (workspace) {
      useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId!, {
        widgets: workspace.widgets.map((w) => (w.id === id ? { ...w, hidden: false } : w)),
      });
    }

    set((state) => {
      const newHidden = new Set(state.hiddenWidgets);
      newHidden.delete(id);
      return { hiddenWidgets: newHidden };
    });
  },

  toggleWidgetVisibility: (id) =>
    set((state) => {
      const newHidden = new Set(state.hiddenWidgets);
      if (newHidden.has(id)) {
        newHidden.delete(id);
      } else {
        newHidden.add(id);
      }
      return { hiddenWidgets: newHidden };
    }),

  updateWidgetSettings: (id, settings) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (!activeWorkspaceId) return;

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    const widget = workspace.widgets.find((w) => w.id === id);
    if (!widget) return;

    useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, {
      widgets: workspace.widgets.map((w) =>
        w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w
      ),
    });
  },

  duplicateWidget: (id) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (!activeWorkspaceId) return null;

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return null;

    const widget = workspace.widgets.find((w) => w.id === id);
    if (!widget) return null;

    const definition = get().widgetDefinitions.get(widget.type);
    if (!definition || !definition.canDuplicate) return null;

    const existingWidgetIds = new Set(workspace.widgets.map((w) => w.id));
    let newId = generateId('widget');
    while (existingWidgetIds.has(newId)) {
      newId = generateId('widget');
    }

    const maxOrder = Math.max(0, ...workspace.widgets.map((w) => w.order));
    const newOrder = maxOrder + 1;

    const newWidget: WidgetConfig = {
      ...widget,
      id: newId,
      order: newOrder,
      position: { x: widget.position.x + 1, y: widget.position.y + 1 },
    };

    const layoutItem: GridLayoutItem = {
      i: newId,
      x: newWidget.position.x,
      y: newWidget.position.y,
      w: newWidget.size.w,
      h: newWidget.size.h,
      minW: newWidget.minSize?.w,
      minH: newWidget.minSize?.h,
      maxW: newWidget.maxSize?.w,
      maxH: newWidget.maxSize?.h,
      isDraggable: true,
      isResizable: definition.canResize,
      resizeHandles: ['se', 'e', 's'],
    };

    useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, {
      widgets: [...workspace.widgets, newWidget],
    });

    set((state) => ({
      layout: [...state.layout, layoutItem],
    }));

    return newWidget;
  },

  resetWidgetSettings: (id) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (!activeWorkspaceId) return;

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    const widget = workspace.widgets.find((w) => w.id === id);
    if (!widget) return;

    const definition = get().widgetDefinitions.get(widget.type);
    if (!definition) return;

    useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, {
      widgets: workspace.widgets.map((w) =>
        w.id === id ? { ...w, settings: { ...definition.defaultSettings } } : w
      ),
    });
  },

  getWidgetConfig: (id) => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (!activeWorkspaceId) return undefined;

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    return workspace?.widgets.find((w) => w.id === id);
  },

  getVisibleWidgets: () => {
    const { activeWorkspaceId } = useWorkspaceStore.getState();
    if (!activeWorkspaceId) return [];

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return [];

    // Honor widget-level hidden flags (hide buttons) and theme-level hidden
    // widget types configured in Settings -> Hidden Elements
    const hiddenTypes = new Set(useSettingsStore.getState().settings.hidden.hiddenWidgets);
    const { hiddenWidgets } = get();
    return workspace.widgets.filter((w) => !hiddenWidgets.has(w.id) && !w.hidden && !hiddenTypes.has(w.type));
  },

  registerWidgetDefinitions: (definitions) => {
    const map = new Map<string, WidgetDefinition>();
    definitions.forEach((def) => map.set(def.type, def));
    set({ widgetDefinitions: map });
  },

  getWidgetDefinition: (type) => {
    return get().widgetDefinitions.get(type);
  },
}));

