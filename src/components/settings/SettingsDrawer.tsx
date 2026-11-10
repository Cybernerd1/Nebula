import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Palette, Image, Grid, Search, EyeOff, Keyboard, HardDrive,
  LayoutDashboard, Plus, Download, Upload, RotateCcw, Cloud, Trash2,
  Copy, Star, Check, Paintbrush, Sun, Moon, Monitor,
  Code, Briefcase, BookOpen, Heart, Gamepad2,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { useSettingsStore } from '../../stores/settings.store';
import { useDashboardStore } from '../../stores/dashboard.store';
import { getRegisteredWidgets, getWidgetCategories } from '../../widgets';
import { storageService } from '../../services/storage';
import type { WallpaperConfig } from '../../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_SECTIONS = [
  { id: 'appearance', label: 'Appearance',  Icon: Palette },
  { id: 'themes',     label: 'Themes',      Icon: Paintbrush },
  { id: 'wallpapers', label: 'Wallpapers',  Icon: Image },
  { id: 'layout',     label: 'Layout',      Icon: Grid },
  { id: 'search',     label: 'Search',      Icon: Search },
  { id: 'hidden',     label: 'Visibility',  Icon: EyeOff },
  { id: 'shortcuts',  label: 'Shortcuts',   Icon: Keyboard },
  { id: 'data',       label: 'Data',        Icon: HardDrive },
  { id: 'workspaces', label: 'Workspaces',  Icon: LayoutDashboard },
] as const;

type SectionId = typeof NAV_SECTIONS[number]['id'];

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('appearance');

  const {
    settings,
    updateAppearance, updateThemes, updateWallpapers, updateLayout,
    updateSearch, updateHidden, updateShortcuts, updateData,
    applyTheme, addCustomTheme, removeCustomTheme,
    exportSettings, importSettings, resetSettings,
  } = useSettingsStore();

  const {
    workspaces, activeWorkspaceId,
    createWorkspace, updateWorkspace, deleteWorkspace,
    duplicateWorkspace, setActiveWorkspace, setDefaultWorkspace,
    exportWorkspace, importWorkspace,
  } = useWorkspaceStore();

  const { hiddenWidgets, hideWidget, showWidget } = useDashboardStore();
  const activeWorkspaceWidgets =
    workspaces.find((ws) => ws.id === activeWorkspaceId)?.widgets ?? [];

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[150]"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '840px',
            backgroundColor: 'var(--color-surface-elevated)',
            borderLeft: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-2xl)',
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
        >
          {/* Drawer header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 1.25rem',
              height: '56px',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                letterSpacing: '-0.01em',
              }}
            >
              Settings
            </h2>
            <button onClick={onClose} className="btn-icon" aria-label="Close settings">
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Two-column body */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Nav sidebar */}
            <nav
              style={{
                width: '168px',
                borderRight: '1px solid var(--color-border)',
                padding: '0.75rem 0.5rem',
                overflowY: 'auto',
                flexShrink: 0,
              }}
              aria-label="Settings sections"
            >
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {NAV_SECTIONS.map(({ id, label, Icon }) => (
                  <li key={id}>
                    <button
                      onClick={() => setActiveSection(id)}
                      className={cn(
                        'settings-nav-item',
                        activeSection === id && 'active'
                      )}
                      aria-current={activeSection === id ? 'page' : undefined}
                    >
                      <Icon style={{ width: '14px', height: '14px', flexShrink: 0 }} aria-hidden />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Content area */}
            <div
              className="scrollbar-thin"
              style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}
            >
              {activeSection === 'appearance' && (
                <AppearanceSection settings={settings.appearance} onUpdate={updateAppearance} />
              )}
              {activeSection === 'themes' && (
                <ThemesSection
                  settings={settings.themes}
                  onUpdate={updateThemes}
                  applyTheme={applyTheme}
                  addCustomTheme={addCustomTheme}
                  removeCustomTheme={removeCustomTheme}
                />
              )}
              {activeSection === 'wallpapers' && (
                <WallpapersSection
                  settings={settings.wallpapers}
                  onUpdate={updateWallpapers}
                  activeWorkspaceId={activeWorkspaceId}
                />
              )}
              {activeSection === 'layout' && (
                <LayoutSection settings={settings.layout} onUpdate={updateLayout} />
              )}
              {activeSection === 'search' && (
                <SearchSection settings={settings.search} onUpdate={updateSearch} />
              )}
              {activeSection === 'hidden' && (
                <HiddenSection
                  settings={settings.hidden}
                  onUpdate={updateHidden}
                  hiddenWidgets={hiddenWidgets}
                  widgets={activeWorkspaceWidgets}
                  onHideInstance={hideWidget}
                  onShowInstance={showWidget}
                />
              )}
              {activeSection === 'shortcuts' && (
                <ShortcutsSection settings={settings.shortcuts} onUpdate={updateShortcuts} />
              )}
              {activeSection === 'data' && (
                <DataSection
                  settings={settings.data}
                  onUpdate={updateData}
                  exportSettings={exportSettings}
                  importSettings={importSettings}
                  resetSettings={resetSettings}
                />
              )}
              {activeSection === 'workspaces' && (
                <WorkspacesSection
                  workspaces={workspaces}
                  activeWorkspaceId={activeWorkspaceId}
                  onCreate={createWorkspace}
                  onUpdate={updateWorkspace}
                  onDelete={deleteWorkspace}
                  onDuplicate={duplicateWorkspace}
                  onSelect={setActiveWorkspace}
                  onSetDefault={setDefaultWorkspace}
                  onExport={exportWorkspace}
                  onImport={importWorkspace}
                />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Shared settings layout helpers ─────────────────────── */

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-text)',
          }}
        >
          {label}
        </span>
        {hint && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.25rem',
        padding: '0.25rem',
        backgroundColor: 'var(--color-surface-secondary)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            flex: 1,
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: value === opt ? 500 : 400,
            transition: 'all 150ms ease',
            backgroundColor:
              value === opt ? 'var(--color-surface-elevated)' : 'transparent',
            color: value === opt ? 'var(--color-text)' : 'var(--color-text-secondary)',
            boxShadow: value === opt ? 'var(--shadow-xs)' : 'none',
          }}
        >
          {labels ? labels[opt] : opt}
        </button>
      ))}
    </div>
  );
}

/* ─── Appearance ─────────────────────────── */

function AppearanceSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').AppearanceSettings;
  onUpdate: (u: Partial<import('../../types').AppearanceSettings>) => Promise<void>;
}) {
  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '1rem' }}>Appearance</h2>

      <SettingsGroup>
        {/* Color scheme */}
        <SettingsRow label="Color scheme">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {(['light', 'dark', 'amoled'] as const).map((scheme) => {
              const icons = { light: Sun, dark: Moon, amoled: Monitor };
              const Icon = icons[scheme];
              const isActive = settings.colorScheme === scheme;
              return (
                <button
                  key={scheme}
                  onClick={() => onUpdate({ colorScheme: scheme })}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isActive
                      ? 'var(--color-primary-muted)'
                      : 'var(--color-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'all 150ms ease',
                  }}
                >
                  <Icon
                    style={{
                      width: '16px',
                      height: '16px',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    }}
                    aria-hidden
                  />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {scheme}
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsRow>

        {/* Accent color */}
        <SettingsRow label="Accent color">
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                padding: '2px',
                backgroundColor: 'transparent',
              }}
              aria-label="Accent color picker"
            />
            <input
              type="text"
              value={settings.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
              className="input"
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', height: '36px' }}
              aria-label="Accent color hex value"
            />
          </div>
        </SettingsRow>

        {/* Card transparency */}
        <SettingsRow
          label="Card transparency"
          hint={`${Math.round(settings.cardTransparency * 100)}%`}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={settings.cardTransparency * 100}
            onChange={(e) => onUpdate({ cardTransparency: Number(e.target.value) / 100 })}
          />
        </SettingsRow>

        {/* Card blur */}
        <SettingsRow
          label="Card blur"
          hint={`${settings.cardBlur}px`}
        >
          <input
            type="range"
            min="0"
            max="40"
            value={settings.cardBlur}
            onChange={(e) => onUpdate({ cardBlur: Number(e.target.value) })}
          />
        </SettingsRow>

        {/* Corner radius */}
        <SettingsRow label="Corner radius">
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['none', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((r) => {
              const isActive = settings.cornerRadius === r;
              return (
                <button
                  key={r}
                  onClick={() => onUpdate({ cornerRadius: r })}
                  style={{
                    flex: 1,
                    height: '32px',
                    borderRadius: r === 'none' ? '0' : r === 'sm' ? '4px' : r === 'md' ? '6px' : r === 'lg' ? '8px' : r === 'xl' ? '12px' : '16px',
                    border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isActive ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    fontSize: '0.6875rem',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </SettingsRow>

        {/* Font family */}
        <SettingsRow label="Font family">
          <select
            value={settings.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="input"
            style={{ height: '36px' }}
          >
            <option value="system">System default</option>
            <option value="inter">Inter</option>
            <option value="space-grotesk">Space Grotesk</option>
            <option value="jetbrains">JetBrains Mono</option>
          </select>
        </SettingsRow>

        {/* Font size */}
        <SettingsRow label="Base font size" hint={`${settings.fontSize}px`}>
          <input
            type="range"
            min="12"
            max="20"
            value={settings.fontSize}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

/* ─── Themes ─────────────────────────── */

function ThemesSection({
  settings,
  onUpdate,
  applyTheme,
  addCustomTheme,
  removeCustomTheme,
}: {
  settings: import('../../types').ThemeSettings;
  onUpdate: (u: Partial<import('../../types').ThemeSettings>) => Promise<void>;
  applyTheme: (id: string, variant?: string) => Promise<void>;
  addCustomTheme: (theme: import('../../types').CustomTheme) => Promise<void>;
  removeCustomTheme: (id: string) => Promise<void>;
}) {
  const THEMES = [
    { id: 'nebula',    name: 'Nebula',    desc: 'Cyan & violet on dark',   variants: ['dark', 'light'] },
    { id: 'paper',     name: 'Paper',     desc: 'Editorial warm tones',    variants: ['light'] },
    { id: 'terminal',  name: 'Terminal',  desc: 'Developer green/amber',   variants: ['green', 'amber'] },
    { id: 'glass',     name: 'Glass',     desc: 'Frosted glassmorphism',   variants: ['dark', 'light'] },
    { id: 'retro',     name: 'Retro',     desc: 'Vintage computing',       variants: ['dark', 'light'] },
    { id: 'brutalist', name: 'Brutalist', desc: 'High-contrast editorial', variants: ['light', 'dark'] },
  ] as const;

  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '1rem' }}>Themes</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {THEMES.map((theme) => {
          const isActive = settings.currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => {
                onUpdate({ currentTheme: theme.id, currentVariant: theme.variants[0] });
                applyTheme(theme.id, theme.variants[0]);
              }}
              style={{
                padding: '0.875rem',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: isActive ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  {theme.name}
                </span>
                {isActive && (
                  <Check
                    style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }}
                    aria-hidden
                  />
                )}
              </div>
              <span
                style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}
              >
                {theme.desc}
              </span>

              {/* Variant pills */}
              {theme.variants.length > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {theme.variants.map((v) => {
                    const vActive = isActive && settings.currentVariant === v;
                    return (
                      <button
                        key={v}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate({ currentTheme: theme.id, currentVariant: v });
                          applyTheme(theme.id, v);
                        }}
                        style={{
                          height: '20px',
                          padding: '0 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.6875rem',
                          fontWeight: vActive ? 500 : 400,
                          backgroundColor: vActive
                            ? 'var(--color-primary)'
                            : 'var(--color-surface-secondary)',
                          color: vActive ? '#ffffff' : 'var(--color-text-muted)',
                          transition: 'all 150ms ease',
                        }}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom themes */}
      {settings.customThemes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="settings-heading">Custom themes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {settings.customThemes.map((theme) => (
              <div
                key={theme.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>
                    {theme.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Based on {theme.baseTheme}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => {
                      onUpdate({ currentTheme: 'custom', currentVariant: theme.id });
                      applyTheme('custom', theme.id);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => removeCustomTheme(theme.id)}
                    className="btn-icon"
                    aria-label={`Delete ${theme.name}`}
                    style={{ color: 'var(--color-error)' }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create custom theme */}
      <CreateCustomThemeForm
        baseThemes={[
          { id: 'nebula', name: 'Nebula' },
          { id: 'paper', name: 'Paper' },
          { id: 'glass', name: 'Glass' },
        ]}
        addCustomTheme={addCustomTheme}
      />
    </div>
  );
}

function CreateCustomThemeForm({
  baseThemes,
  addCustomTheme,
}: {
  baseThemes: { id: string; name: string }[];
  addCustomTheme: (theme: import('../../types').CustomTheme) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [base, setBase] = useState(baseThemes[0]?.id || 'nebula');
  const [accent, setAccent] = useState('#06b6d4');

  if (!creating) {
    return (
      <button onClick={() => setCreating(true)} className="btn btn-secondary" style={{ width: '100%' }}>
        <Plus style={{ width: '14px', height: '14px' }} />
        Create custom theme
      </button>
    );
  }

  return (
    <div
      style={{
        padding: '0.875rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <SettingsRow label="Theme name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My custom theme"
          className="input"
          style={{ height: '36px' }}
          autoFocus
        />
      </SettingsRow>
      <SettingsRow label="Base theme">
        <select value={base} onChange={(e) => setBase(e.target.value)} className="input" style={{ height: '36px' }}>
          {baseThemes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </SettingsRow>
      <SettingsRow label="Accent color">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
            style={{ width: '36px', height: '36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: 'transparent' }} />
          <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{accent}</span>
        </div>
      </SettingsRow>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={() => setCreating(false)} className="btn btn-secondary btn-sm">Cancel</button>
        <button
          onClick={async () => {
            if (!name.trim()) return;
            await addCustomTheme({ id: `custom-${Date.now()}`, name: name.trim(), baseTheme: base, tokens: { colors: { primary: accent, accent } }, createdAt: Date.now() });
            setName(''); setAccent('#06b6d4'); setCreating(false);
          }}
          className="btn btn-primary btn-sm"
          disabled={!name.trim()}
        >
          <Plus style={{ width: '13px', height: '13px' }} />
          Create
        </button>
      </div>
    </div>
  );
}

/* ─── Wallpapers ─────────────────────────── */

function WallpapersSection({
  settings,
  onUpdate,
  activeWorkspaceId,
}: {
  settings: import('../../types').WallpaperSettings;
  onUpdate: (u: Partial<import('../../types').WallpaperSettings>) => Promise<void>;
  activeWorkspaceId: string | null;
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadUrls, setUploadUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    settings.galleryImages
      .filter((w) => w.category === 'uploads')
      .forEach((wp) => {
        storageService.getWallpaperUrl(wp.id).then((url) => {
          if (!cancelled && url)
            setUploadUrls((prev) => (prev[wp.id] === url ? prev : { ...prev, [wp.id]: url }));
        });
      });
    return () => { cancelled = true; };
  }, [settings.galleryImages]);

  const GRADIENTS = [
    { id: 'nebula-gradient',  name: 'Nebula',   preview: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a2e 50%, #16213e 100%)' },
    { id: 'sunset-gradient',  name: 'Sunset',   preview: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)' },
    { id: 'ocean-gradient',   name: 'Ocean',    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'forest-gradient',  name: 'Forest',   preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
    { id: 'fire-gradient',    name: 'Fire',     preview: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
    { id: 'midnight-gradient',name: 'Midnight', preview: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)' },
    { id: 'aurora-gradient',  name: 'Aurora',   preview: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)' },
    { id: 'rose-gradient',    name: 'Rose',     preview: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
    { id: 'cyber-gradient',   name: 'Cyberpunk',preview: 'linear-gradient(135deg, #ff00cc 0%, #333399 100%)' },
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFileUpload(e.dataTransfer.files);
  };

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      try {
        const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await storageService.saveWallpaper(id, file);
        const url = await storageService.getWallpaperUrl(id);
        if (url) {
          onUpdate({
            galleryImages: [
              ...settings.galleryImages,
              { id, name: file.name, preview: url, thumbnail: url, category: 'uploads', type: file.type.startsWith('video/') ? 'video' : 'image' },
            ],
          });
        }
      } catch (err) {
        console.error('Failed to upload wallpaper:', err);
      }
    }
  };

  const selectWallpaper = async (wp: { id: string; preview: string; name: string; type?: 'image' | 'video' }) => {
    const store = useWorkspaceStore.getState();
    const wsId = store.activeWorkspaceId;
    if (!wsId) {
      console.error('No active workspace ID');
      return;
    }
    
    const config: WallpaperConfig = {
      type: wp.type || (wp.id.endsWith('-gradient') ? 'gradient' : 'image'),
      source: wp.id.startsWith('upload-') ? 'upload' : 'gallery',
      value: wp.preview,
      ...(wp.id.startsWith('upload-') ? { id: wp.id } : {}),
      brightness: settings.defaultBrightness ?? 1,
      blur: settings.defaultBlur ?? 0,
      overlay: settings.defaultOverlay ?? 0.5,
      position: (settings.defaultPosition || 'center') as 'center' | 'cover' | 'contain' | 'top' | 'bottom' | 'left' | 'right',
      autoRotate: false,
      rotationInterval: settings.rotationInterval,
    };
    
    console.log('Setting wallpaper:', { wsId, config });
    
    try {
      await store.updateWorkspace(wsId, { wallpaper: config });
      console.log('Wallpaper updated successfully');
      
      // Force a re-read of the workspace to verify it was saved
      const updated = store.workspaces.find(ws => ws.id === wsId);
      console.log('Workspace after update:', updated?.wallpaper);
    } catch (err) {
      console.error('Failed to update wallpaper:', err);
    }
  };

  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '1rem' }}>Wallpapers</h2>

      {/* Gradient gallery */}
      <h3 className="settings-heading" style={{ fontSize: '0.8125rem', marginBottom: '0.625rem' }}>Gradients</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '0.375rem',
          marginBottom: '1.25rem',
        }}
      >
        {GRADIENTS.map((g) => (
          <button
            key={g.id}
            onClick={() => selectWallpaper({ id: g.id, preview: g.preview, name: g.name })}
            style={{
              aspectRatio: '16/9',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              background: g.preview,
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'; }}
            aria-label={`Select ${g.name} wallpaper`}
          >
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '0.25rem 0.375rem',
                fontSize: '0.625rem',
                color: '#fff',
                background: 'rgba(0,0,0,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {g.name}
            </span>
          </button>
        ))}
      </div>

      {/* Uploads */}
      {settings.galleryImages.filter((w) => w.category === 'uploads').length > 0 && (
        <>
          <h3 className="settings-heading" style={{ fontSize: '0.8125rem', marginBottom: '0.625rem' }}>Uploads</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.375rem', marginBottom: '1.25rem' }}>
            {settings.galleryImages.filter((w) => w.category === 'uploads').map((wp) => {
              const url = uploadUrls[wp.id] || wp.preview;
              return (
                <div key={wp.id} style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                  {wp.type === 'video'
                    ? <video src={url} muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <img src={url} alt={wp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}>
                    <button onClick={() => selectWallpaper(wp)} style={{ padding: '0.25rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#fff' }} aria-label="Select">
                      <Check style={{ width: '14px', height: '14px' }} />
                    </button>
                    <button onClick={() => { storageService.deleteWallpaper(wp.id); onUpdate({ galleryImages: settings.galleryImages.filter((w) => w.id !== wp.id) }); }}
                      style={{ padding: '0.25rem', background: 'rgba(239,68,68,0.3)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#fff' }} aria-label="Delete">
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Upload dropzone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          textAlign: 'center',
          backgroundColor: dragActive ? 'var(--color-primary-muted)' : 'transparent',
          transition: 'all 150ms ease',
          marginBottom: '1.25rem',
        }}
      >
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
        <Image style={{ width: '24px', height: '24px', color: 'var(--color-text-muted)', margin: '0 auto 0.5rem' }} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Drag & drop images or videos
        </p>
        <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
          <Upload style={{ width: '13px', height: '13px' }} />
          Browse files
        </button>
      </div>

      {/* Current wallpaper controls */}
      {activeWorkspaceId && (() => {
        const ws = useWorkspaceStore.getState().getWorkspace(activeWorkspaceId!);
        const wallpaper = ws?.wallpaper;
        if (!wallpaper || wallpaper.type === 'none') return null;
        const update = (u: Partial<WallpaperConfig>) =>
          useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId!, { wallpaper: { ...wallpaper, ...u } });
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 className="settings-heading" style={{ fontSize: '0.8125rem' }}>Current wallpaper</h3>
            <SettingsRow label="Brightness" hint={`${Math.round(wallpaper.brightness * 100)}%`}>
              <input type="range" min="0" max="100" value={wallpaper.brightness * 100} onChange={(e) => update({ brightness: Number(e.target.value) / 100 })} />
            </SettingsRow>
            <SettingsRow label="Blur" hint={`${wallpaper.blur}px`}>
              <input type="range" min="0" max="40" value={wallpaper.blur} onChange={(e) => update({ blur: Number(e.target.value) })} />
            </SettingsRow>
            <SettingsRow label="Overlay" hint={`${Math.round(wallpaper.overlay * 100)}%`}>
              <input type="range" min="0" max="100" value={wallpaper.overlay * 100} onChange={(e) => update({ overlay: Number(e.target.value) / 100 })} />
            </SettingsRow>
            <SettingsRow label="Position">
              <select value={wallpaper.position} onChange={(e) => update({ position: e.target.value as WallpaperConfig['position'] })} className="input" style={{ height: '36px' }}>
                {['center', 'cover', 'contain', 'top', 'bottom', 'left', 'right'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </SettingsRow>
            <button onClick={() => useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId!, { wallpaper: { ...wallpaper, type: 'none' as const } })}
              className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', color: 'var(--color-error)' }}>
              <Trash2 style={{ width: '13px', height: '13px' }} />
              Remove wallpaper
            </button>
          </div>
        );
      })()}
    </div>
  );
}

/* ─── Layout ─────────────────────────── */

function LayoutSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').LayoutSettings;
  onUpdate: (u: Partial<import('../../types').LayoutSettings>) => Promise<void>;
}) {
  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '1rem' }}>Layout</h2>
      <SettingsGroup>
        <SettingsRow label="Widget spacing" hint={`${settings.widgetSpacing}px`}>
          <input type="range" min="0" max="32" value={settings.widgetSpacing} onChange={(e) => onUpdate({ widgetSpacing: Number(e.target.value) })} />
        </SettingsRow>
        <SettingsRow label="Grid columns" hint={`${settings.gridColumns}`}>
          <input type="range" min="4" max="24" value={settings.gridColumns} onChange={(e) => onUpdate({ gridColumns: Number(e.target.value) })} />
        </SettingsRow>
        <SettingsRow label="Row height" hint={`${settings.gridRowHeight}px`}>
          <input type="range" min="40" max="120" value={settings.gridRowHeight} onChange={(e) => onUpdate({ gridRowHeight: Number(e.target.value) })} />
        </SettingsRow>
        <SettingsRow label="Dashboard alignment">
          <SegmentedControl
            options={['left', 'center', 'stretch'] as const}
            value={(settings.dashboardAlignment ?? 'center') as 'left' | 'center' | 'stretch'}
            onChange={(v) => onUpdate({ dashboardAlignment: v })}
          />
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

/* ─── Search ─────────────────────────── */

function SearchSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').SearchSettings;
  onUpdate: (u: Partial<import('../../types').SearchSettings>) => Promise<void>;
}) {
  const ENGINES = [
    { id: 'google',    name: 'Google',     emoji: 'G' },
    { id: 'bing',      name: 'Bing',       emoji: 'B' },
    { id: 'duckduckgo',name: 'DuckDuckGo', emoji: 'D' },
    { id: 'brave',     name: 'Brave',      emoji: 'Br' },
  ];

  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '1rem' }}>Search</h2>

      <SettingsGroup>
        <SettingsRow label="Default search engine">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {ENGINES.map((eng) => {
              const isActive = settings.defaultEngine === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => onUpdate({ defaultEngine: eng.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isActive ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-surface-secondary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem',
                    fontWeight: 700, color: 'var(--color-text-secondary)', flexShrink: 0,
                  }}>{eng.emoji}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--color-primary)' : 'var(--color-text)', flex: 1 }}>
                    {eng.name}
                  </span>
                  {isActive && <Check style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />}
                </button>
              );
            })}
          </div>
        </SettingsRow>

        <SettingsRow label="Time format">
          <SegmentedControl options={['12h', '24h'] as const} value={(settings.timeFormat ?? '24h') as '12h' | '24h'} onChange={(v) => onUpdate({ timeFormat: v })} />
        </SettingsRow>

        <SettingsRow label="Show seconds">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <input type="checkbox" id="showSecs" checked={settings.showSeconds} onChange={(e) => onUpdate({ showSeconds: e.target.checked })} className="checkbox" aria-labelledby="showSecs-label" />
            <label id="showSecs-label" htmlFor="showSecs" style={{ fontSize: '0.875rem', color: 'var(--color-text)', cursor: 'pointer' }}>Show seconds on clock widgets</label>
          </div>
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

/* ─── Hidden Elements ─────────────────────── */

function HiddenSection({
  settings,
  onUpdate,
  hiddenWidgets,
  widgets,
  onHideInstance,
  onShowInstance,
}: {
  settings: import('../../types').HiddenSettings;
  onUpdate: (u: Partial<import('../../types').HiddenSettings>) => Promise<void>;
  hiddenWidgets: Set<string>;
  widgets: import('../../types').WidgetConfig[];
  onHideInstance: (id: string) => void;
  onShowInstance: (id: string) => void;
}) {
  const allWidgets = getRegisteredWidgets();
  const definitionNames = new Map(allWidgets.map((w) => [w.type, w.name]));

  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '0.5rem' }}>Visibility</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Control which widgets are visible on this workspace.
      </p>

      {widgets.length === 0 ? (
        <div className="empty-state" style={{ height: '120px' }}>
          <p className="empty-state-description">No widgets on this workspace yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {widgets.map((widget) => {
            const isHidden = widget.hidden || hiddenWidgets.has(widget.id);
            return (
              <div key={widget.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>{definitionNames.get(widget.type) || widget.type}</span>
                  {isHidden && <span className="badge badge-warning" style={{ fontSize: '0.625rem' }}>Hidden</span>}
                </div>
                <button onClick={() => isHidden ? onShowInstance(widget.id) : onHideInstance(widget.id)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', height: '28px', padding: '0 0.625rem' }}>
                  {isHidden ? 'Show' : 'Hide'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Type-level toggle */}
      <h3 className="settings-heading" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Disable widget types</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {allWidgets.map((widget) => {
          const isDisabled = settings.hiddenWidgets.includes(widget.type);
          return (
            <label key={widget.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4375rem 0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>{widget.name}</span>
              <input type="checkbox" className="checkbox" checked={!isDisabled}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? settings.hiddenWidgets.filter((id) => id !== widget.type)
                    : [...settings.hiddenWidgets, widget.type];
                  onUpdate({ hiddenWidgets: updated });
                }} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Shortcuts ─────────────────────────── */

function ShortcutsSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').ShortcutSettings;
  onUpdate: (u: Partial<import('../../types').ShortcutSettings>) => Promise<void>;
}) {
  const SHORTCUTS = [
    { id: 'search',       name: 'Focus search',    desc: 'Focus the search widget', default: 'Ctrl+K' },
    { id: 'edit',         name: 'Edit layout',     desc: 'Toggle edit mode',         default: 'Ctrl+E' },
    { id: 'workspace',    name: 'Switch workspace',desc: 'Open workspace switcher',  default: 'Ctrl+Shift+W' },
    { id: 'settings',     name: 'Open settings',   desc: 'Open settings drawer',    default: 'Ctrl+,' },
    { id: 'addWidget',    name: 'Add widget',      desc: 'Open add-widget panel',   default: 'Ctrl+Shift+A' },
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturedKeys, setCapturedKeys] = useState('');
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') { setEditingId(null); setCapturedKeys(''); return; }
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    if (e.key && !['Control','Shift','Alt','Meta'].includes(e.key)) {
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    }
    const combo = parts.join('+');
    setCapturedKeys(combo);
    if (parts.some((p) => !['Ctrl','Shift','Alt'].includes(p))) {
      onUpdate({ shortcuts: { ...settings.shortcuts, [id]: combo } });
      setEditingId(null);
      setCapturedKeys('');
    }
  };

  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '0.5rem' }}>Keyboard shortcuts</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Click a shortcut to rebind it. Press Escape to cancel.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {SHORTCUTS.map((sc) => {
          const isEditing = editingId === sc.id;
          const current = settings.shortcuts[sc.id] || sc.default;
          return (
            <div
              key={sc.id}
              ref={(el) => { rowRefs.current[sc.id] = el; }}
              role="button"
              tabIndex={isEditing ? 0 : -1}
              onClick={() => !isEditing && setEditingId(sc.id) && requestAnimationFrame(() => rowRefs.current[sc.id]?.focus())}
              onKeyDown={(e) => isEditing && handleKeyDown(e, sc.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isEditing ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: isEditing ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                cursor: isEditing ? 'default' : 'pointer',
                transition: 'all 150ms ease',
                outline: 'none',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>{sc.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sc.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <kbd style={{ ...(isEditing ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}) }}>
                  {isEditing ? (capturedKeys || 'Press keys…') : current}
                </kbd>
                {!isEditing && current !== sc.default && (
                  <button onClick={(e) => { e.stopPropagation(); onUpdate({ shortcuts: { ...settings.shortcuts, [sc.id]: sc.default } }); }} className="btn-icon" style={{ width: '24px', height: '24px' }} aria-label="Reset to default">
                    <RotateCcw style={{ width: '12px', height: '12px' }} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Data ─────────────────────────── */

function DataSection({
  settings,
  onUpdate,
  exportSettings,
  importSettings,
  resetSettings,
}: {
  settings: import('../../types').DataSettings;
  onUpdate: (u: Partial<import('../../types').DataSettings>) => Promise<void>;
  exportSettings: () => import('../../types').GlobalSettings;
  importSettings: (s: import('../../types').GlobalSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
}) {
  const workspaceStore = useWorkspaceStore.getState();

  const download = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (handler: (data: unknown) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try { handler(JSON.parse(await file.text())); } catch { alert('Invalid JSON file'); }
    };
    input.click();
  };

  const DataButton = ({ Icon, label, onClick, danger }: { Icon: React.ComponentType<{ style?: React.CSSProperties }>; label: string; onClick: () => void; danger?: boolean }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        width: '100%',
        padding: '0.625rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${danger ? 'var(--color-border)' : 'var(--color-border)'}`,
        backgroundColor: 'var(--color-surface)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        color: danger ? 'var(--color-error)' : 'var(--color-text)',
        textAlign: 'left',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-hover)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface)'; }}
    >
      <Icon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
      {label}
    </button>
  );

  return (
    <div>
      <h2 className="settings-heading" style={{ marginBottom: '1rem' }}>Data</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 className="settings-heading" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Export</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <DataButton Icon={Download} label="Export settings" onClick={() => download(exportSettings(), `nebula-settings-${new Date().toISOString().split('T')[0]}.json`)} />
            <DataButton Icon={Download} label="Export current workspace" onClick={() => { const wsId = workspaceStore.activeWorkspaceId; if (wsId) workspaceStore.exportWorkspace(wsId).then((ws) => download(ws, `nebula-workspace-${ws.name}-${new Date().toISOString().split('T')[0]}.json`)); }} />
            <DataButton Icon={Cloud} label="Create full backup" onClick={() => download({ settings: exportSettings(), workspaces: workspaceStore.workspaces, activeWorkspaceId: workspaceStore.activeWorkspaceId, exportedAt: new Date().toISOString(), version: '1.0.0' }, `nebula-backup-${new Date().toISOString().split('T')[0]}.json`)} />
          </div>
        </div>

        <div>
          <h3 className="settings-heading" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Import</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <DataButton Icon={Upload} label="Import settings" onClick={() => importJson((d) => importSettings(d as import('../../types').GlobalSettings))} />
            <DataButton Icon={Upload} label="Import workspace" onClick={() => importJson((d) => workspaceStore.importWorkspace(d as import('../../types').Workspace))} />
            <DataButton Icon={RotateCcw} label="Restore from backup" onClick={() => importJson(async (d: any) => { if (d.settings) await importSettings(d.settings); if (d.workspaces) for (const ws of d.workspaces) await workspaceStore.importWorkspace(ws); })} />
          </div>
        </div>

        <div
          style={{
            padding: '0.875rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(239,68,68,0.25)',
            backgroundColor: 'rgba(239,68,68,0.04)',
          }}
        >
          <h3 className="settings-heading" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--color-error)' }}>Danger zone</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <DataButton Icon={Trash2} label="Reset to defaults" danger onClick={async () => { if (confirm('Reset all settings to defaults?')) { await resetSettings(); window.location.reload(); } }} />
            <DataButton Icon={Trash2} label="Clear all local data" danger onClick={async () => { if (confirm('Delete ALL data? This cannot be undone.') && confirm('Are you sure?')) { await storageService.clearAll(); window.location.reload(); } }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Workspaces ─────────────────────────── */

function WorkspacesSection({
  workspaces,
  activeWorkspaceId,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  onSelect,
  onSetDefault,
  onExport,
  onImport,
}: {
  workspaces: import('../../types').Workspace[];
  activeWorkspaceId: string | null;
  onCreate: (name: string, icon?: string) => Promise<import('../../types').Workspace>;
  onUpdate: (id: string, u: Partial<import('../../types').Workspace>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<import('../../types').Workspace>;
  onSelect: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onExport: (id: string) => Promise<import('../../types').Workspace>;
  onImport: (ws: import('../../types').Workspace) => Promise<import('../../types').Workspace>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('layout-grid');

  const ICONS = [
    { id: 'layout-grid', Icon: LayoutDashboard },
    { id: 'code', Icon: Code },
    { id: 'briefcase', Icon: Briefcase },
    { id: 'book-open', Icon: BookOpen },
    { id: 'heart', Icon: Heart },
    { id: 'gamepad2', Icon: Gamepad2 },
  ];
  const ICON_MAP = Object.fromEntries(ICONS.map(({ id, Icon }) => [id, Icon]));

  const download = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 className="settings-heading" style={{ marginBottom: 0 }}>Workspaces</h2>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">
          <Plus style={{ width: '13px', height: '13px' }} />
          New
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {workspaces.map((ws) => {
          const Icon = ICON_MAP[ws.icon] || LayoutDashboard;
          const isActive = ws.id === activeWorkspaceId;
          return (
            <div key={ws.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-lg)', border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: isActive ? 'var(--color-primary-muted)' : 'var(--color-surface)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', backgroundColor: isActive ? 'rgba(34,211,238,0.15)' : 'var(--color-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: '15px', height: '15px', color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} aria-hidden />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--color-primary)' : 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ws.name}
                  {ws.isDefault && <span className="badge badge-primary" style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>Default</span>}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{ws.widgets.length} widgets · {ws.collections.length} collections</div>
              </div>
              <div style={{ display: 'flex', gap: '0.125rem', flexShrink: 0 }}>
                {!isActive && <button onClick={() => onSelect(ws.id)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', height: '26px', padding: '0 0.5rem' }}>Switch</button>}
                {!ws.isDefault && <button onClick={() => onSetDefault(ws.id)} className="btn-icon" style={{ width: '26px', height: '26px' }} title="Set default"><Star style={{ width: '12px', height: '12px' }} /></button>}
                <button onClick={() => onDuplicate(ws.id)} className="btn-icon" style={{ width: '26px', height: '26px' }} title="Duplicate"><Copy style={{ width: '12px', height: '12px' }} /></button>
                <button onClick={() => onExport(ws.id).then((w) => download(w, `nebula-workspace-${w.name}.json`))} className="btn-icon" style={{ width: '26px', height: '26px' }} title="Export"><Download style={{ width: '12px', height: '12px' }} /></button>
                {workspaces.length > 1 && <button onClick={() => onDelete(ws.id)} className="btn-icon" style={{ width: '26px', height: '26px', color: 'var(--color-error)' }} title="Delete"><Trash2 style={{ width: '12px', height: '12px' }} /></button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--color-overlay)' }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="modal-panel"
              style={{ width: '100%', maxWidth: '380px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Create workspace</h3>
                <button onClick={() => setShowCreate(false)} className="btn-icon" style={{ marginLeft: 'auto' }}><X style={{ width: '15px', height: '15px' }} /></button>
              </div>
              <div className="modal-body" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <SettingsRow label="Name">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && newName.trim() && onCreate(newName.trim(), newIcon).then(() => setShowCreate(false))} placeholder="e.g., Development, Personal" className="input" style={{ height: '36px' }} autoFocus />
                </SettingsRow>
                <SettingsRow label="Icon">
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {ICONS.map(({ id, Icon }) => (
                      <button key={id} onClick={() => setNewIcon(id)} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', border: `1px solid ${newIcon === id ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: newIcon === id ? 'var(--color-primary-muted)' : 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: '14px', height: '14px', color: newIcon === id ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} aria-hidden />
                      </button>
                    ))}
                  </div>
                </SettingsRow>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowCreate(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={() => { if (newName.trim()) { onCreate(newName.trim(), newIcon); setShowCreate(false); setNewName(''); } }} className="btn btn-primary btn-sm" disabled={!newName.trim()}>
                  <Plus style={{ width: '13px', height: '13px' }} />
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
