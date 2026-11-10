import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Settings, ChevronDown, Plus, LayoutGrid, Check,
  Code, Briefcase, BookOpen, Heart, Gamepad2, Sparkles,
} from 'lucide-react';
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
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import { storageService } from '../services/storage';
import { useTaskStore } from '../stores/task.store';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

/* ─────────────────────────────────────────────────────────────
   Wallpaper Background
   Renders fixed behind everything. Hooks run unconditionally
   to prevent React hook-count mismatches on type changes.
───────────────────────────────────────────────────────────── */
function WallpaperBackground({
  wallpaper,
  settings,
}: {
  wallpaper?: import('../types').WallpaperConfig;
  settings: import('../types').WallpaperSettings;
}) {
  const [mediaUrl, setMediaUrl] = useState<string>(wallpaper?.value ?? '');

  // For uploaded wallpapers, fetch fresh blob URLs on mount and when ID changes
  useEffect(() => {
    let cancelled = false;

    if (
      (wallpaper?.type === 'image' || wallpaper?.type === 'video') &&
      wallpaper.id?.startsWith('upload-')
    ) {
      // Fetch fresh blob URL for uploaded wallpapers
      storageService.getWallpaperUrl(wallpaper.id).then((url) => {
        if (!cancelled && url) {
          console.log('Loaded wallpaper URL:', wallpaper.id);
          setMediaUrl(url);
        }
      }).catch((err) => {
        console.error('Failed to load wallpaper:', err);
      });
    } else if (wallpaper?.type === 'gradient' || wallpaper?.type === 'image' || wallpaper?.type === 'video') {
      // For gallery/custom wallpapers, use the value directly
      console.log('Using wallpaper value directly:', { type: wallpaper.type, value: wallpaper.value?.substring(0, 50) });
      setMediaUrl(wallpaper.value ?? '');
    }

    return () => { cancelled = true; };
  }, [wallpaper?.id, wallpaper?.type, wallpaper?.value]);

  if (!wallpaper || wallpaper.type === 'none') {
    console.log('No wallpaper to display:', wallpaper?.type);
    return null;
  }

  const brightness = wallpaper.brightness ?? 1;
  const blur = wallpaper.blur ?? 0;
  const overlay = wallpaper.overlay ?? 0;

  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: -1,
    overflow: 'hidden',
  };

  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: brightness,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    transform: blur > 0 ? 'scale(1.05)' : undefined,
    transition: 'opacity 0.4s ease',
  };

  const overlayEl =
    overlay > 0 ? (
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
      wallpaper.position === 'contain' ? 'contain' : 'cover';
    return (
      <div style={wrapperStyle}>
        <img
          src={mediaUrl}
          alt=""
          aria-hidden="true"
          style={{ ...mediaStyle, objectFit, objectPosition: 'center' }}
          onError={(e) => console.error('Image load failed:', e)}
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
          aria-hidden="true"
          style={{ ...mediaStyle, objectFit: 'cover' }}
          onError={(e) => console.error('Video load failed:', e)}
        />
        {overlayEl}
      </div>
    );
  }

  if (wallpaper.type === 'gradient') {
    console.log('Rendering gradient:', mediaUrl?.substring(0, 50));
    return (
      <div style={wrapperStyle}>
        <div 
          aria-hidden="true" 
          style={{ ...mediaStyle, background: mediaUrl || wallpaper.value }}
          data-debug="gradient"
        />
        {overlayEl}
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────
   App — initialises stores, shows loading / error states
───────────────────────────────────────────────────────────── */
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
        if (mounted) setInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Nebula:', err);
        if (mounted) setInitError('Failed to initialize. Please reload the page.');
      }
    };
    init();
    return () => { mounted = false; };
  }, [initWorkspaces, initSettings, registerWidgetDefinitions]);

  useEffect(() => {
    if (initialized) {
      const theme = settings.themes.currentTheme;
      const variant = settings.themes.currentVariant || 'dark';

      // Set the CSS selector attributes for theme targeting
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-variant', variant);

      // Apply AMOLED class if appropriate
      if (theme === 'amoled' || variant === 'amoled') {
        document.documentElement.classList.add('amoled');
      } else {
        document.documentElement.classList.remove('amoled');
      }

      // Apply additional theme logic
      applyTheme(theme, variant);
    }
  }, [settings.themes.currentTheme, settings.themes.currentVariant, applyTheme, initialized]);

  /* Loading */
  if (!initialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" aria-label="Loading" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Loading Nebula…
          </p>
        </div>
      </div>
    );
  }

  /* Error */
  if (initError || workspaceError || settingsError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="text-center" style={{ maxWidth: '400px' }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
          >
            <span style={{ fontSize: '1.25rem' }}>⚠</span>
          </div>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              marginBottom: '1.5rem',
              lineHeight: 1.6,
            }}
          >
            {initError || workspaceError || settingsError || 'Unknown error'}
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <Dashboard />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Dashboard
───────────────────────────────────────────────────────────── */
function Dashboard() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const {
    isEditing,
    setEditing,
    layout,
    rebuildLayout,
    applyLayoutChange,
    getVisibleWidgets,
    getWidgetDefinition,
  } = useDashboardStore();
  const { settings } = useSettingsStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const visibleWidgets = getVisibleWidgets();

  /* Sync grid layout with workspace */
  useEffect(() => {
    if (activeWorkspace) rebuildLayout(activeWorkspace.widgets);
  }, [activeWorkspace, rebuildLayout]);

  /* Hydrate task store */
  useEffect(() => {
    if (activeWorkspaceId) useTaskStore.getState().initialize(activeWorkspaceId);
  }, [activeWorkspaceId]);

  /* Global keyboard shortcuts */
  useEffect(() => {
    const shortcuts = settings.shortcuts.shortcuts;
    const match = (combo: string, e: KeyboardEvent) => {
      if (!combo) return false;
      const parts = combo.toLowerCase().split('+');
      const key = parts[parts.length - 1];
      const needCtrl = parts.includes('ctrl') || parts.includes('mod');
      const needShift = parts.includes('shift');
      const needAlt = parts.includes('alt');
      const keyEvent = key === ',' ? e.key === ',' : e.key.toLowerCase() === key;
      return (
        keyEvent &&
        needCtrl === (e.ctrlKey || e.metaKey) &&
        needShift === e.shiftKey &&
        needAlt === e.altKey
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) ||
        target?.isContentEditable;
      if (typing && !(e.ctrlKey || e.metaKey || e.key === 'Escape')) return;

      if (match(shortcuts['search'] || '', e)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-nebula-search-input]')?.focus();
      } else if (match(shortcuts['edit'] || '', e)) {
        e.preventDefault();
        setEditing(!isEditing);
      } else if (match(shortcuts['workspace'] || '', e)) {
        e.preventDefault();
        setShowWorkspaceSwitcher((v) => !v);
      } else if (match(shortcuts['addWidget'] || '', e)) {
        e.preventDefault();
        setShowAddWidget(true);
      } else if (match(shortcuts['settings'] || '', e)) {
        e.preventDefault();
        setShowSettings((v) => !v);
      } else if (e.key === 'Escape') {
        if (showAddWidget) setShowAddWidget(false);
        else if (showWorkspaceSwitcher) setShowWorkspaceSwitcher(false);
        else if (showSettings) setShowSettings(false);
        else if (isEditing) setEditing(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    settings.shortcuts.shortcuts,
    isEditing,
    showSettings,
    showAddWidget,
    showWorkspaceSwitcher,
    setEditing,
  ]);

  if (!activeWorkspace) return null;

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

  const gridColumns = activeWorkspace.settings.gridColumns || settings.layout.gridColumns;
  const gridRowHeight = activeWorkspace.settings.gridRowHeight || settings.layout.gridRowHeight;
  const widgetGap = activeWorkspace.settings.widgetGap || settings.layout.widgetSpacing;

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
        onOpenWorkspaceSwitcher={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
      />

      <main className="flex-1 relative" style={{ minHeight: 0 }}>
        <WallpaperBackground
          wallpaper={activeWorkspace.wallpaper}
          settings={settings.wallpapers}
        />

        {/* Edit mode banner */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative z-30 flex items-center justify-between px-6 py-2.5"
              style={{
                backgroundColor: 'var(--color-primary-muted)',
                borderBottom: '1px solid var(--color-primary)',
              }}
            >
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                }}
              >
                Edit mode — drag to rearrange, resize from corners
              </span>
              <button
                onClick={() => setEditing(false)}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                style={{ height: '28px', padding: '0 0.75rem', fontSize: '0.8125rem' }}
              >
                <Check style={{ width: '14px', height: '14px' }} />
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ResponsiveReactGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: gridColumns, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={gridRowHeight}
          margin={[widgetGap, widgetGap]}
          containerPadding={[widgetGap, widgetGap]}
          onLayoutChange={(newLayout) => applyLayoutChange(newLayout)}
        >
          {visibleWidgets.map((widget) => {
            const WidgetComponent = WidgetComponentMap[widget.type];
            const definition = getWidgetDefinition(widget.type);
            if (!WidgetComponent || !definition) return null;
            return (
              <div key={widget.id} className="group">
                <WidgetWrapper
                  widget={widget}
                  definition={definition}
                  Component={WidgetComponent}
                  isEditing={isEditing}
                />
              </div>
            );
          })}
          {/* Invisible spacer at the bottom so widgets can be dropped below */}
          <div
            key="__bottom-spacer"
            data-grid={{ i: '__bottom-spacer', x: 0, y: 999, w: 12, h: 1, static: true }}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          />
        </ResponsiveReactGridLayout>
      </main>

      <Footer widgetCount={visibleWidgets.length} />

      <AnimatePresence>
        {showSettings && (
          <SettingsDrawer isOpen={showSettings} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddWidget && (
          <AddWidgetModal isOpen={showAddWidget} onClose={() => setShowAddWidget(false)} />
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

/* ─────────────────────────────────────────────────────────────
   Widget Wrapper — connects store to widget component props
───────────────────────────────────────────────────────────── */
function WidgetWrapper({
  widget,
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
        onConfigChange={(patch: Record<string, unknown>) =>
          updateWidgetSettings(widget.id, patch)
        }
        onRemove={() => removeWidget(widget.id)}
        onHide={() => hideWidget(widget.id)}
        isEditing={isEditing}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Header  — 64px, three-column layout
   Left: logo + product name + subtitle
   Center: workspace selector
   Right: actions
───────────────────────────────────────────────────────────── */
function Header({
  workspace,
  workspaces,
  activeWorkspaceId,
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
    <header
      className="sticky top-0 z-40"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '0 1.5rem',
          gap: '1rem',
        }}
      >
        {/* ── Left: Logo + Product name ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-muted)',
              flexShrink: 0,
            }}
          >
            <Sparkles
              style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }}
              aria-hidden="true"
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.9375rem',
                fontWeight: 650,
                color: 'var(--color-text)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              Nebula
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.2,
              }}
            >
              {workspaces.length > 1 ? `${workspaces.length} workspaces` : 'Browser workspace'}
            </div>
          </div>
        </div>

        {/* ── Center: Workspace switcher ── */}
        <WorkspaceSwitcherButton workspace={workspace} onClick={onOpenWorkspaceSwitcher} />

        {/* ── Right: Actions ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            justifyContent: 'flex-end',
          }}
        >
          {/* Add widget */}
          <button
            onClick={onOpenAddWidget}
            className="btn-icon"
            aria-label="Add widget"
            title="Add widget (Ctrl+Shift+A)"
          >
            <Plus style={{ width: '18px', height: '18px' }} />
          </button>

          {/* Separator */}
          <div
            style={{
              width: '1px',
              height: '20px',
              backgroundColor: 'var(--color-border)',
              margin: '0 0.25rem',
            }}
            aria-hidden="true"
          />

          {/* Edit / customize */}
          <button
            onClick={() => onToggleEdit(!isEditing)}
            className={cn('btn-icon', isEditing && 'active-state')}
            aria-label={isEditing ? 'Exit edit mode' : 'Edit layout'}
            aria-pressed={isEditing}
            title={isEditing ? 'Done editing (Ctrl+E)' : 'Edit layout (Ctrl+E)'}
            style={
              isEditing
                ? {
                  backgroundColor: 'var(--color-primary-muted)',
                  color: 'var(--color-primary)',
                }
                : {}
            }
          >
            <LayoutGrid style={{ width: '18px', height: '18px' }} />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="btn-icon"
            aria-label="Settings"
            title="Settings (Ctrl+,)"
          >
            <Settings style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
   Workspace Switcher Button — compact pill in header center
───────────────────────────────────────────────────────────── */
function WorkspaceSwitcherButton({
  workspace,
  onClick,
}: {
  workspace: import('../types').Workspace;
  onClick: () => void;
}) {
  const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
    'layout-grid': LayoutDashboard,
    code: Code,
    briefcase: Briefcase,
    'book-open': BookOpen,
    heart: Heart,
    gamepad2: Gamepad2,
  };
  const Icon = ICON_MAP[workspace.icon] || LayoutDashboard;

  return (
    <button
      onClick={onClick}
      aria-label={`Switch workspace: ${workspace.name}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        height: '34px',
        padding: '0 0.875rem',
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        fontSize: '0.8125rem',
        fontWeight: 500,
        color: 'var(--color-text)',
        maxWidth: '240px',
        minWidth: '160px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          'var(--color-border-strong)';
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          'var(--color-surface-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          'var(--color-border)';
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          'var(--color-surface-elevated)';
      }}
    >
      <Icon
        style={{
          width: '14px',
          height: '14px',
          color: 'var(--color-text-secondary)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'left',
        }}
      >
        {workspace.name}
      </span>
      <ChevronDown
        style={{
          width: '14px',
          height: '14px',
          color: 'var(--color-text-muted)',
          flexShrink: 0,
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Footer — minimal, 40px, keyboard shortcuts hint
───────────────────────────────────────────────────────────── */
function Footer({ widgetCount }: { widgetCount: number }) {
  const { workspaces } = useWorkspaceStore();
  const [storageUsed, setStorageUsed] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    storageService.getStorageUsage().then(({ used }) => {
      if (mounted && used > 0) {
        const mb = used / (1024 * 1024);
        setStorageUsed(mb < 0.01 ? '< 0.01 MB' : `${mb.toFixed(2)} MB`);
      }
    });
    return () => {
      mounted = false;
    };
  }, [widgetCount]);

  return (
    <footer
      style={{
        height: 'var(--footer-height)',
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 70%, transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '0 1.5rem',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.6875rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {storageUsed && (
            <span>
              Storage:{' '}
              <span style={{ color: 'var(--color-text-secondary)' }}>{storageUsed}</span>
            </span>
          )}
          <span>
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
          </span>
          <span>
            {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          aria-label="Keyboard shortcuts"
        >
          <span>
            <kbd>Ctrl+K</kbd> Search
          </span>
          <span>
            <kbd>Ctrl+E</kbd> Edit
          </span>
          <span>
            <kbd>Ctrl+,</kbd> Settings
          </span>
        </div>
      </div>
    </footer>
  );
}
