import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Settings, MoreHorizontal, ChevronDown, Plus, Grid, Check, Code, Briefcase, BookOpen, Heart, Gamepad2 } from 'lucide-react';
import { cn } from '../utils/helpers';
import { useWorkspaceStore } from '../stores/workspace.store';
import { useDashboardStore } from '../stores/dashboard.store';
import { useSettingsStore } from '../stores/settings.store';
import { initializeWidgetRegistry, getRegisteredWidgets } from '../widgets';
import { ClockWidget } from '../widgets/components/ClockWidget';
import { GreetingWidget } from '../widgets/components/GreetingWidget';
import { SearchWidget } from '../widgets/components/SearchWidget';
import { QuoteWidget } from '../widgets/components/QuoteWidget';
import { TodoWidget } from '../widgets/components/TodoWidget';
import { CollectionsWidget } from '../widgets/components/CollectionsWidget';
import { QuickLinksWidget } from '../widgets/components/QuickLinksWidget';
import { WeatherWidget } from '../widgets/components/WeatherWidget';
import { PomodoroWidget } from '../widgets/components/PomodoroWidget';
import { WorldClockWidget } from '../widgets/components/WorldClockWidget';
import { FocusTimerWidget } from '../widgets/components/FocusTimerWidget';
import { CountdownWidget } from '../widgets/components/CountdownWidget';
import { NotesWidget } from '../widgets/components/NotesWidget';
import { CustomTextWidget } from '../widgets/components/CustomTextWidget';
import { DailyFocusWidget } from '../widgets/components/DailyFocusWidget';
import { ProductivityStatsWidget } from '../widgets/components/ProductivityStatsWidget';
import { DateWidget } from '../widgets/components/DateWidget';
import { AddWidgetModal } from '../components/modals/AddWidgetModal';
import { SettingsDrawer } from '../components/settings/SettingsDrawer';
import { WorkspaceSwitcher } from '../components/workspace/WorkspaceSwitcher';
import { Responsive } from 'react-grid-layout';
import { storageService } from '../services/storage';

const ResponsiveReactGridLayout = Responsive;

function WallpaperBackground({ wallpaper, settings }: { wallpaper?: import('../types').WallpaperConfig; settings: import('../types').WallpaperSettings }) {
  if (!wallpaper || wallpaper.type === 'none') {
    return null;
  }

  const [mediaUrl, setMediaUrl] = useState<string>(wallpaper.value);

  // Regenerate blob URL for uploaded wallpapers on mount
  useEffect(() => {
    if (wallpaper.type === 'image' && wallpaper.id && wallpaper.id.startsWith('upload-')) {
      storageService.getWallpaperUrl(wallpaper.id).then((url) => {
        if (url) setMediaUrl(url);
      });
    } else if (wallpaper.type === 'video' && wallpaper.id && wallpaper.id.startsWith('upload-')) {
      storageService.getWallpaperUrl(wallpaper.id).then((url) => {
        if (url) setMediaUrl(url);
      });
    }
  }, [wallpaper.id, wallpaper.type]);

  // Brightness: 1 = normal, 0 = darkest. Overlay adds dark layer.
  // Use (1 - brightness) for opacity so 1 = fully visible, 0 = hidden
  const brightness = wallpaper.brightness ?? 1;
  const blur = wallpaper.blur ?? 0;
  const overlay = wallpaper.overlay ?? 0;

  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    overflow: 'hidden',
    transition: 'opacity 0.5s ease, filter 0.5s ease',
  };

  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: brightness,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    transform: blur > 0 ? 'scale(1.05)' : undefined,
    transition: 'opacity 0.5s ease, filter 0.5s ease',
  };

  const overlayEl = overlay > 0 ? (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `rgba(0, 0, 0, ${overlay})`,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  ) : null;

  if (wallpaper.type === 'image') {
    const objectFit: React.CSSProperties['objectFit'] =
      wallpaper.position === 'cover' ? 'cover' :
      wallpaper.position === 'contain' ? 'contain' : 'cover';
    return (
      <div style={wrapperStyle}>
        <img
          src={mediaUrl}
          alt=""
          style={{ ...mediaStyle, objectFit, objectPosition: 'center' }}
        />
        {overlayEl}
      </div>
    );
  }

  if (wallpaper.type === 'video') {
    return (
      <div style={wrapperStyle}>
        <video
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          style={{ ...mediaStyle, objectFit: 'cover' }}
        />
        {overlayEl}
      </div>
    );
  }

  if (wallpaper.type === 'gradient') {
    return (
      <div style={wrapperStyle}>
        <div style={{ ...mediaStyle, background: wallpaper.value }} />
        {overlayEl}
      </div>
    );
  }

  return null;
}

export function App() {
  const { initialize: initWorkspaces, error: workspaceError } = useWorkspaceStore();
  const { initialize: initSettings, settings, applyTheme, error: settingsError } = useSettingsStore();
  const { registerWidgetDefinitions } = useDashboardStore();
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        initializeWidgetRegistry();
        const widgets = getRegisteredWidgets();
        registerWidgetDefinitions(widgets);
        await initWorkspaces();
        await initSettings();
        if (mounted) {
          setInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Nebula:', error);
        if (mounted) {
          setInitError('Failed to initialize. Please reload the page.');
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, [initWorkspaces, initSettings, registerWidgetDefinitions]);

  useEffect(() => {
    if (initialized) {
      applyTheme(settings.themes.currentTheme, settings.themes.currentVariant);
    }
  }, [settings.themes.currentTheme, settings.themes.currentVariant, applyTheme, initialized]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading Nebula...</p>
        </div>
      </div>
    );
  }

  if (initError || workspaceError || settingsError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-error">⚠️</div>
          <h2 className="text-heading-lg font-semibold text-text mb-2">Something went wrong</h2>
          <p className="text-text-muted mb-6">{initError || workspaceError || settingsError || 'Unknown error'}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Dashboard />
    </div>
  );
}

function Dashboard() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const { isEditing, setEditing, layout, getVisibleWidgets, getWidgetConfig, getWidgetDefinition } = useDashboardStore();
  const { settings } = useSettingsStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const visibleWidgets = getVisibleWidgets();

  if (!activeWorkspace) return null;

  const handleLayoutChange = (newLayout: readonly import('../types').GridLayoutItem[]) => {
    // Layout changes are handled by the dashboard store
  };

  const WidgetComponentMap: Record<string, React.ComponentType<any>> = {
    clock: ClockWidget,
    date: DateWidget,
    greeting: GreetingWidget,
    search: SearchWidget,
    quote: QuoteWidget,
    todo: TodoWidget,
    collections: CollectionsWidget,
    quicklinks: QuickLinksWidget,
    weather: WeatherWidget,
    pomodoro: PomodoroWidget,
    worldClock: WorldClockWidget,
    focusTimer: FocusTimerWidget,
    countdown: CountdownWidget,
    notes: NotesWidget,
    customText: CustomTextWidget,
    dailyFocus: DailyFocusWidget,
    productivityStats: ProductivityStatsWidget,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        workspace={activeWorkspace}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceChange={setActiveWorkspace}
        onToggleEdit={setEditing}
        isEditing={isEditing}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAddWidget={() => setShowAddWidget(true)}
        onOpenWorkspaceSwitcher={() => setShowWorkspaceSwitcher(true)}
      />

      <main className="flex-1 overflow-hidden relative">
        <WallpaperBackground wallpaper={activeWorkspace.wallpaper} settings={settings.wallpapers} />
        <ResponsiveReactGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: activeWorkspace.settings.gridColumns, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={activeWorkspace.settings.gridRowHeight}
          width={1200}
          margin={[16, 16]}
          containerPadding={[16, 16]}
          onLayoutChange={handleLayoutChange}
        >
          {visibleWidgets.map((widget) => {
            const WidgetComponent = WidgetComponentMap[widget.type];
            const definition = getWidgetDefinition(widget.type);
            if (!WidgetComponent || !definition) return null;

            return (
              <div key={widget.id} data-grid={widget.id}>
                <WidgetWrapper
                  widget={widget}
                  definition={definition}
                  Component={WidgetComponent}
                  isEditing={isEditing}
                />
              </div>
            );
          })}
          <div
            key="add-widget-placeholder"
            data-grid={{ i: 'add-widget-placeholder', x: 0, y: 999, w: 12, h: 1, static: true }}
            className="pointer-events-none"
          />
        </ResponsiveReactGridLayout>

        {isEditing && (
          <div className="absolute bottom-4 right-4 z-50">
            <motion.button
              onClick={() => setEditing(false)}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="btn-primary px-6 py-3 shadow-xl flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Done Editing
            </motion.button>
          </div>
        )}
      </main>

      <Footer
        workspace={activeWorkspace}
        widgetCount={visibleWidgets.length}
      />

      <AnimatePresence>
        {showSettings && (
          <SettingsDrawer
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddWidget && (
          <AddWidgetModal
            isOpen={showAddWidget}
            onClose={() => setShowAddWidget(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWorkspaceSwitcher && (
          <WorkspaceSwitcher
            isOpen={showWorkspaceSwitcher}
            onClose={() => setShowWorkspaceSwitcher(false)}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onSelect={setActiveWorkspace}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function WidgetWrapper({
  widget,
  definition,
  Component,
  isEditing,
}: {
  widget: import('../types').WidgetConfig;
  definition: import('../types').WidgetDefinition;
  Component: React.ComponentType<any>;
  isEditing: boolean;
}) {
  const { updateWidgetSettings, removeWidget, hideWidget } = useDashboardStore();

  return (
    <div className="h-full w-full">
      <Component
        config={widget}
        onConfigChange={updateWidgetSettings}
        onRemove={() => removeWidget(widget.id)}
        onHide={() => hideWidget(widget.id)}
        isEditing={isEditing}
      />
    </div>
  );
}

function Header({
  workspace,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
  onToggleEdit,
  isEditing,
  onOpenSettings,
  onOpenAddWidget,
  onOpenWorkspaceSwitcher,
}: {
  workspace: import('../types').Workspace;
  workspaces: import('../types').Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceChange: (id: string) => void;
  onToggleEdit: (editing: boolean) => void;
  isEditing: boolean;
  onOpenSettings: () => void;
  onOpenAddWidget: () => void;
  onOpenWorkspaceSwitcher: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-xl">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-heading-lg font-bold text-text">Nebula</h1>
            <p className="text-body-xs text-text-muted">Your personal browser workspace</p>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <WorkspaceSwitcherButton
            workspace={workspace}
            workspaces={workspaces}
            onClick={onOpenWorkspaceSwitcher}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddWidget}
            className="btn-icon p-2"
            title="Add Widget (Ctrl+Shift+A)"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleEdit(!isEditing)}
            className={cn(
              'btn-icon p-2 transition-all',
              isEditing ? 'bg-primary text-white' : 'bg-surface-elevated text-text'
            )}
            title={isEditing ? 'Done Editing (Ctrl+E)' : 'Customize (Ctrl+E)'}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="btn-icon p-2"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenWorkspaceSwitcher}
            className="btn-icon p-2"
            title="More Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function WorkspaceSwitcherButton({
  workspace,
  workspaces,
  onClick,
}: {
  workspace: import('../types').Workspace;
  workspaces: import('../types').Workspace[];
  onClick: () => void;
}) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    'layout-grid': LayoutDashboard,
    'code': Code,
    'briefcase': Briefcase,
    'book-open': BookOpen,
    'heart': Heart,
    'gamepad2': Gamepad2,
  };

  const Icon = icons[workspace.icon] || LayoutDashboard;

  return (
    <button
      onClick={onClick}
      className="btn-secondary px-4 py-2 flex items-center gap-2 min-w-[200px] justify-center"
    >
      <Icon className="w-4 h-4" />
      <span className="truncate font-medium">{workspace.name}</span>
      <ChevronDown className="w-4 h-4 ml-auto" />
    </button>
  );
}

function Footer({
  workspace,
  widgetCount,
}: {
  workspace: import('../types').Workspace;
  widgetCount: number;
}) {
  const { workspaces } = useWorkspaceStore();

  return (
    <footer className="border-t border-border px-6 py-3 bg-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-body-xs text-text-muted">
        <div className="flex items-center gap-4">
          <span>Storage: <span className="text-text">~2.4 MB</span></span>
          <span className="hidden sm:inline">|</span>
          <span>Workspaces: <span className="text-text">{workspaces.length}</span></span>
          <span className="hidden sm:inline">|</span>
          <span>Active Widgets: <span className="text-text">{widgetCount}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-text transition-colors">Support</a>
          <span className="hidden sm:inline">|</span>
          <a href="#" className="hover:text-text transition-colors">Feedback</a>
          <span className="hidden sm:inline">|</span>
          <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-text">Ctrl+K</kbd> Search
          <span className="hidden sm:inline">|</span>
          <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-text">Ctrl+E</kbd> Edit
        </div>
      </div>
    </footer>
  );
}