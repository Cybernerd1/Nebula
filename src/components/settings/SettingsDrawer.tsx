import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Palette, Image, Grid, Keyboard, Download, Upload, RefreshCw, Trash2, Copy, ChevronRight, ChevronLeft, Plus, Sparkles, Paintbrush, Layers, LayoutDashboard, Bell, HelpCircle, Info, Settings as SettingsIcon, HardDrive, Cloud, Share2, RotateCcw, Eye, EyeOff, SlidersHorizontal, Zap, Shield, Hash, Type, Contrast, Maximize2, Minimize2, Search, Star, Code, Briefcase, BookOpen, Heart, Gamepad2, Check, Folder, Link, Globe, ChevronDown, ChevronUp, MoreVertical, Settings, EyeOff as EyeOffIcon, Trash2 as Trash2Icon } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { useSettingsStore } from '../../stores/settings.store';
import { useDashboardStore } from '../../stores/dashboard.store';
import { getRegisteredWidgets, getWidgetCategories } from '../../widgets';
import { storageService } from '../../services/storage';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const [activeSection, setActiveSection] = useState<string>('appearance');

  const { settings, updateAppearance, updateThemes, updateWallpapers, updateLayout, updateSearch, updateHidden, updateShortcuts, updateData, applyTheme, addCustomTheme, removeCustomTheme, toggleHiddenWidget, toggleHiddenCollection, exportSettings, importSettings, resetSettings } = useSettingsStore();
  const { workspaces, activeWorkspaceId, createWorkspace, updateWorkspace, deleteWorkspace, duplicateWorkspace, setActiveWorkspace, setDefaultWorkspace, exportWorkspace, importWorkspace } = useWorkspaceStore();
  const { hiddenWidgets, layout } = useDashboardStore();

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'themes', label: 'Themes', icon: Paintbrush },
    { id: 'wallpapers', label: 'Wallpapers', icon: Image },
    { id: 'layout', label: 'Layout', icon: Grid },
    { id: 'search', label: 'Search & Time', icon: Search },
    { id: 'hidden', label: 'Hidden Elements', icon: EyeOff },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'data', label: 'Your Data', icon: HardDrive },
    { id: 'workspaces', label: 'Workspaces', icon: LayoutDashboard },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="w-full max-w-4xl h-full bg-surface-elevated border-l border-border shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-heading-lg font-bold text-text">Settings</h2>
            <button onClick={onClose} className="btn-icon p-2 text-text-muted hover:text-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <nav className="w-56 border-r border-border p-4 overflow-y-auto flex-shrink-0">
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-3 text-body-sm transition-all',
                        activeSection === section.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-muted hover:bg-surface-hover hover:text-text'
                      )}
                    >
                      <section.icon className="w-5 h-5" />
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex-1 overflow-y-auto p-6">
              {activeSection === 'appearance' && <AppearanceSection settings={settings.appearance} onUpdate={updateAppearance} />}
              {activeSection === 'themes' && <ThemesSection settings={settings.themes} onUpdate={updateThemes} applyTheme={applyTheme} addCustomTheme={addCustomTheme} removeCustomTheme={removeCustomTheme} />}
              {activeSection === 'wallpapers' && <WallpapersSection settings={settings.wallpapers} onUpdate={updateWallpapers} />}
              {activeSection === 'layout' && <LayoutSection settings={settings.layout} onUpdate={updateLayout} />}
              {activeSection === 'search' && <SearchSection settings={settings.search} onUpdate={updateSearch} />}
              {activeSection === 'hidden' && <HiddenSection settings={settings.hidden} onUpdate={updateHidden} hiddenWidgets={hiddenWidgets} />}
              {activeSection === 'shortcuts' && <ShortcutsSection settings={settings.shortcuts} onUpdate={updateShortcuts} />}
              {activeSection === 'data' && <DataSection settings={settings.data} onUpdate={updateData} exportSettings={exportSettings} importSettings={importSettings} resetSettings={resetSettings} />}
              {activeSection === 'workspaces' && <WorkspacesSection workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} onCreate={createWorkspace} onUpdate={updateWorkspace} onDelete={deleteWorkspace} onDuplicate={duplicateWorkspace} onSelect={setActiveWorkspace} onSetDefault={setDefaultWorkspace} onExport={exportWorkspace} onImport={importWorkspace} />}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AppearanceSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').AppearanceSettings;
  onUpdate: (updates: Partial<import('../../types').AppearanceSettings>) => Promise<void>;
}) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Color Scheme</h3>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'amoled'].map((scheme) => (
            <button
              key={scheme}
              onClick={() => onUpdate({ colorScheme: scheme as 'light' | 'dark' | 'amoled' })}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                settings.colorScheme === scheme
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border-strong'
              )}
            >
              <div className={cn(
                'w-full h-12 rounded-lg mb-2',
                scheme === 'light' ? 'bg-white border border-gray-200' : scheme === 'dark' ? 'bg-gray-900' : 'bg-black'
              )} />
              <span className="font-medium text-text capitalize">{scheme}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Accent Color</h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={settings.accentColor}
            onChange={(e) => onUpdate({ accentColor: e.target.value })}
            className="w-12 h-12 rounded-lg border border-border cursor-pointer"
          />
          <input
            type="text"
            value={settings.accentColor}
            onChange={(e) => onUpdate({ accentColor: e.target.value })}
            className="flex-1 input font-mono"
          />
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Card Style</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Transparency: {Math.round(settings.cardTransparency * 100)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.cardTransparency * 100}
              onChange={(e) => onUpdate({ cardTransparency: Number(e.target.value) / 100 })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="label">Blur: {settings.cardBlur}px</label>
            <input
              type="range"
              min="0"
              max="40"
              value={settings.cardBlur}
              onChange={(e) => onUpdate({ cardBlur: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Corner Radius</h3>
        <div className="flex gap-2">
          {['none', 'sm', 'md', 'lg', 'xl', '2xl'].map((radius) => (
            <button
              key={radius}
              onClick={() => onUpdate({ cornerRadius: radius as any })}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg border transition-all',
                settings.cornerRadius === radius
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface hover:bg-surface-hover border-border text-text'
              )}
            >
              {radius.charAt(0).toUpperCase() + radius.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Typography</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Font Family</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="input"
            >
              <option value="system">System Default</option>
              <option value="inter">Inter</option>
              <option value="crimson">Crimson Pro</option>
              <option value="space-grotesk">Space Grotesk</option>
              <option value="jetbrains">JetBrains Mono</option>
            </select>
          </div>
          <div>
            <label className="label">Base Font Size: {settings.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="24"
              value={settings.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemesSection({
  settings,
  onUpdate,
  applyTheme,
  addCustomTheme,
  removeCustomTheme,
}: {
  settings: import('../../types').ThemeSettings;
  onUpdate: (updates: Partial<import('../../types').ThemeSettings>) => Promise<void>;
  applyTheme: (themeId: string, variant?: string) => Promise<void>;
  addCustomTheme: (theme: import('../../types').CustomTheme) => Promise<void>;
  removeCustomTheme: (themeId: string) => Promise<void>;
}) {
  const themes = [
    { id: 'nebula', name: 'Nebula', description: 'Futuristic with cyan & violet accents', category: 'premium', variants: ['dark', 'light'] },
    { id: 'paper', name: 'Paper', description: 'Editorial design with warm tones', category: 'minimal', variants: ['light'] },
    { id: 'terminal', name: 'Terminal', description: 'Developer-inspired with green/amber', category: 'developer', variants: ['green', 'amber'] },
    { id: 'glass', name: 'Glass', description: 'Premium glassmorphism', category: 'artistic', variants: ['dark', 'light'] },
    { id: 'retro', name: 'Retro', description: 'Vintage computing aesthetic', category: 'artistic', variants: ['dark', 'light'] },
    { id: 'brutalist', name: 'Brutalist', description: 'High contrast editorial style', category: 'minimal', variants: ['light', 'dark'] },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Built-in Themes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                onUpdate({ currentTheme: theme.id, currentVariant: theme.variants[0] });
                applyTheme(theme.id, theme.variants[0]);
              }}
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-left',
                settings.currentTheme === theme.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border-strong'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-text">{theme.name}</h4>
                <span className="badge badge-primary text-xs">{theme.category}</span>
              </div>
              <p className="text-body-sm text-text-muted">{theme.description}</p>
              <div className="flex gap-1 mt-2">
                {theme.variants.map((variant) => (
                  <span
                    key={variant}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded',
                      settings.currentTheme === theme.id && settings.currentVariant === variant
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-muted'
                    )}
                  >
                    {variant}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {settings.customThemes.length > 0 && (
        <div>
          <h3 className="text-heading-md font-semibold text-text mb-4">Custom Themes</h3>
          <div className="space-y-3">
            {settings.customThemes.map((theme) => (
              <div key={theme.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
                <div>
                  <h4 className="font-medium text-text">{theme.name}</h4>
                  <p className="text-body-sm text-text-muted">Based on {theme.baseTheme}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onUpdate({ currentTheme: 'custom', currentVariant: theme.id });
                      applyTheme('custom', theme.id);
                    }}
                    className="btn-secondary text-body-sm"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => removeCustomTheme(theme.id)}
                    className="btn-icon p-1.5 text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Create Custom Theme</h3>
        <button className="btn-secondary w-full">
          <Plus className="w-4 h-4 mr-2" /> Create New Theme
        </button>
        <p className="text-body-sm text-text-muted mt-2 text-center">Custom theme builder coming soon</p>
      </div>
    </div>
  );
}

function WallpapersSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').WallpaperSettings;
  onUpdate: (updates: Partial<import('../../types').WallpaperSettings>) => Promise<void>;
}) {
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const builtInWallpapers = [
    { id: 'nebula-gradient', name: 'Nebula Gradient', preview: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a2e 50%, #16213e 100%)', category: 'gradients' },
    { id: 'sunset-gradient', name: 'Sunset', preview: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)', category: 'gradients' },
    { id: 'ocean-gradient', name: 'Ocean', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', category: 'gradients' },
    { id: 'forest-gradient', name: 'Forest', preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', category: 'gradients' },
    { id: 'fire-gradient', name: 'Fire', preview: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', category: 'gradients' },
    { id: 'violet-gradient', name: 'Violet Dream', preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', category: 'gradients' },
    { id: 'midnight-gradient', name: 'Midnight', preview: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)', category: 'gradients' },
    { id: 'aurora-gradient', name: 'Aurora', preview: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)', category: 'gradients' },
    { id: 'rose-gradient', name: 'Rose Gold', preview: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', category: 'gradients' },
    { id: 'cyber-gradient', name: 'Cyberpunk', preview: 'linear-gradient(135deg, #ff00cc 0%, #333399 100%)', category: 'gradients' },
    { id: 'warm-gradient', name: 'Warm Embrace', preview: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)', category: 'gradients' },
    { id: 'cool-gradient', name: 'Cool Breeze', preview: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', category: 'gradients' },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles(e.dataTransfer.files);
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFiles(e.target.files);
      handleFileUpload(e.target.files);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      
      try {
        const id = await storageService.saveWallpaper(`upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, file);
        const url = await storageService.getWallpaperUrl(id);
        if (url) {
          const newWallpaper = {
            id,
            name: file.name,
            preview: url,
            thumbnail: url,
            category: 'uploads',
            type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
          };
          onUpdate({ galleryImages: [...settings.galleryImages, newWallpaper] });
        }
      } catch (error) {
        console.error('Failed to upload wallpaper:', error);
      }
    }
    setUploadFiles(null);
  };

  const handleWallpaperSelect = async (wallpaper: { id: string; preview: string; name: string }) => {
    const workspaceStore = useWorkspaceStore.getState();
    const activeWorkspaceId = workspaceStore.activeWorkspaceId;
    if (activeWorkspaceId) {
      const wallpaperConfig: import('../../types').WallpaperConfig = {
        type: 'image' as const,
        source: wallpaper.id.startsWith('upload-') ? 'upload' as const : 'gallery' as const,
        value: wallpaper.preview,
        brightness: settings.defaultBrightness,
        blur: settings.defaultBlur,
        overlay: settings.defaultOverlay,
        position: settings.defaultPosition,
        autoRotate: false,
        rotationInterval: settings.rotationInterval,
      };
      await workspaceStore.updateWorkspace(activeWorkspaceId, { wallpaper: wallpaperConfig });
      useSettingsStore.getState().applyTheme(
        useSettingsStore.getState().settings.themes.currentTheme,
        useSettingsStore.getState().settings.themes.currentVariant
      );
    }
  };

  const handleDeleteWallpaper = async (wallpaperId: string) => {
    if (!wallpaperId.startsWith('upload-')) return;
    
    await storageService.deleteWallpaper(wallpaperId);
    onUpdate({ galleryImages: settings.galleryImages.filter((w) => w.id !== wallpaperId) });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Gallery</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {builtInWallpapers.map((wp) => (
            <button
              key={wp.id}
              onClick={() => handleWallpaperSelect({ id: wp.id, preview: wp.preview, name: wp.name })}
              className="relative aspect-video rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group"
            >
              <div className="absolute inset-0" style={{ background: wp.preview }} />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-white text-body-xs truncate bg-black/50 px-2 py-1 rounded">
                {wp.name}
              </div>
            </button>
          ))}
          {settings.galleryImages.filter((w) => w.category === 'uploads').map((wp) => (
            <div key={wp.id} className="relative aspect-video rounded-xl overflow-hidden border-2 border-border group">
              {wp.type === 'video' ? (
                <video className="absolute inset-0 w-full h-full object-cover" src={wp.preview} muted loop playsInline />
              ) : (
                <img className="absolute inset-0 w-full h-full object-cover" src={wp.preview} alt={wp.name} />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleWallpaperSelect(wp); }} className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteWallpaper(wp.id); }} className="p-2 bg-red-500/20 backdrop-blur rounded-full text-red-300 hover:bg-red-500/30">
                  <Trash2Icon className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-white text-body-xs truncate bg-black/50 px-2 py-1 rounded">
                {wp.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Upload</h3>
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Image className="w-12 h-12 mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted mb-4">Drag & drop or click to upload images/videos</p>
          <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
            <Upload className="w-4 h-4 mr-2" /> Choose Files
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoRotate"
              checked={settings.autoRotate}
              onChange={(e) => onUpdate({ autoRotate: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="autoRotate" className="text-body-md text-text">Auto-rotate wallpaper</label>
          </div>
          {settings.autoRotate && (
            <div>
              <label className="label">Rotation Interval: {settings.rotationInterval / 60000} min</label>
              <input
                type="range"
                min="1"
                max="60"
                value={settings.rotationInterval / 60000}
                onChange={(e) => onUpdate({ rotationInterval: Number(e.target.value) * 60000 })}
                className="w-full accent-primary"
              />
            </div>
          )}
          <div>
            <label className="label">Default Brightness: {Math.round(settings.defaultBrightness * 100)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.defaultBrightness * 100}
              onChange={(e) => onUpdate({ defaultBrightness: Number(e.target.value) / 100 })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="label">Default Blur: {settings.defaultBlur}px</label>
            <input
              type="range"
              min="0"
              max="40"
              value={settings.defaultBlur}
              onChange={(e) => onUpdate({ defaultBlur: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="label">Default Overlay: {Math.round(settings.defaultOverlay * 100)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.defaultOverlay * 100}
              onChange={(e) => onUpdate({ defaultOverlay: Number(e.target.value) / 100 })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="label">Default Position</label>
            <select
              value={settings.defaultPosition}
              onChange={(e) => onUpdate({ defaultPosition: e.target.value as import('../../types').WallpaperConfig['position'] })}
              className="input"
            >
              <option value="center">Center</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').LayoutSettings;
  onUpdate: (updates: Partial<import('../../types').LayoutSettings>) => Promise<void>;
}) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Grid Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Widget Spacing: {settings.widgetSpacing}px</label>
            <input
              type="range"
              min="0"
              max="32"
              value={settings.widgetSpacing}
              onChange={(e) => onUpdate({ widgetSpacing: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="label">Grid Columns: {settings.gridColumns}</label>
            <input
              type="range"
              min="4"
              max="24"
              value={settings.gridColumns}
              onChange={(e) => onUpdate({ gridColumns: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="label">Row Height: {settings.gridRowHeight}px</label>
            <input
              type="range"
              min="40"
              max="120"
              value={settings.gridRowHeight}
              onChange={(e) => onUpdate({ gridRowHeight: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Dashboard Alignment</h3>
        <div className="flex gap-2">
          {['left', 'center', 'stretch'].map((align) => (
            <button
              key={align}
              onClick={() => onUpdate({ dashboardAlignment: align as any })}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg border transition-all',
                settings.dashboardAlignment === align
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface hover:bg-surface-hover border-border text-text'
              )}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').SearchSettings;
  onUpdate: (updates: Partial<import('../../types').SearchSettings>) => Promise<void>;
}) {
  const engines = [
    { id: 'google', name: 'Google', icon: '🔍' },
    { id: 'bing', name: 'Bing', icon: '🔍' },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆' },
    { id: 'brave', name: 'Brave Search', icon: '🦁' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Default Search Engine</h3>
        <div className="space-y-2">
          {engines.map((engine) => (
            <button
              key={engine.id}
              onClick={() => onUpdate({ defaultEngine: engine.id })}
              className={cn(
                'w-full px-4 py-3 flex items-center gap-3 text-left rounded-lg border transition-all',
                settings.defaultEngine === engine.id
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface hover:bg-surface-hover border-border text-text'
              )}
            >
              <span className="text-2xl">{engine.icon}</span>
              <span className="font-medium">{engine.name}</span>
              {settings.defaultEngine === engine.id && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Clock Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Style</label>
            <div className="flex gap-2">
              {['digital', 'analog'].map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdate({ clockStyle: style as 'digital' | 'analog' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.clockStyle === style
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Time Format</label>
            <div className="flex gap-2">
              {['12h', '24h'].map((format) => (
                <button
                  key={format}
                  onClick={() => onUpdate({ timeFormat: format as '12h' | '24h' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.timeFormat === format
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showSeconds"
              checked={settings.showSeconds}
              onChange={(e) => onUpdate({ showSeconds: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="showSeconds" className="text-body-md text-text">Show seconds</label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Time Zones</h3>
        <p className="text-body-sm text-text-muted mb-4">Additional time zones coming soon</p>
        <button className="btn-secondary">
          <Plus className="w-4 h-4 mr-2" /> Add Time Zone
        </button>
      </div>
    </div>
  );
}

function HiddenSection({
  settings,
  onUpdate,
  hiddenWidgets,
}: {
  settings: import('../../types').HiddenSettings;
  onUpdate: (updates: Partial<import('../../types').HiddenSettings>) => Promise<void>;
  hiddenWidgets: Set<string>;
}) {
  const allWidgets = getRegisteredWidgets();
  const categories = getWidgetCategories();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Hidden Widgets</h3>
        <p className="text-body-sm text-text-muted mb-4">Toggle widget visibility</p>
        <div className="space-y-2">
          {categories.map((cat) => {
            const widgets = allWidgets.filter((w) => w.category === cat);
            return (
              <div key={cat} className="bg-surface border border-border rounded-xl p-4">
                <h4 className="font-medium text-text mb-3 capitalize">{cat}</h4>
                <div className="space-y-2">
                  {widgets.map((widget) => {
                    const isHidden = settings.hiddenWidgets.includes(widget.type);
                    return (
                      <label key={widget.type} className="flex items-center justify-between cursor-pointer">
                        <span className="text-body-md text-text">{widget.name}</span>
                        <input
                          type="checkbox"
                          checked={!isHidden}
                          onChange={(e) => {
                            const newHidden = e.target.checked
                              ? settings.hiddenWidgets.filter((id) => id !== widget.type)
                              : [...settings.hiddenWidgets, widget.type];
                            onUpdate({ hiddenWidgets: newHidden });
                          }}
                          className="w-5 h-5 accent-primary"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Hidden Collections</h3>
        <p className="text-body-sm text-text-muted">Collection visibility managed per workspace</p>
      </div>
    </div>
  );
}

function ShortcutsSection({
  settings,
  onUpdate,
}: {
  settings: import('../../types').ShortcutSettings;
  onUpdate: (updates: Partial<import('../../types').ShortcutSettings>) => Promise<void>;
}) {
  const shortcuts = [
    { id: 'search', name: 'Open Search', default: 'Ctrl+K', description: 'Focus the search widget' },
    { id: 'edit', name: 'Toggle Edit Mode', default: 'Ctrl+E', description: 'Enter/exit dashboard editing mode' },
    { id: 'workspace', name: 'Workspace Switcher', default: 'Ctrl+Shift+W', description: 'Open workspace switcher' },
    { id: 'settings', name: 'Open Settings', default: 'Ctrl+,', description: 'Open settings drawer' },
    { id: 'addWidget', name: 'Add Widget', default: 'Ctrl+Shift+A', description: 'Open add widget modal' },
    { id: 'commandPalette', name: 'Command Palette', default: 'Ctrl+Shift+P', description: 'Open command palette' },
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturedKeys, setCapturedKeys] = useState<string>('');

  const handleKeyDown = (e: React.KeyboardEvent, shortcutId: string) => {
    e.preventDefault();
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    if (e.key && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
      parts.push(e.key.toUpperCase());
    }
    const combo = parts.join('+');
    setCapturedKeys(combo);
  };

  const handleKeyUp = (e: React.KeyboardEvent, shortcutId: string) => {
    e.preventDefault();
    if (capturedKeys) {
      const newShortcuts = { ...settings.shortcuts, [shortcutId]: capturedKeys };
      onUpdate({ shortcuts: newShortcuts });
      setEditingId(null);
      setCapturedKeys('');
    }
  };

  const startEditing = (shortcutId: string) => {
    setEditingId(shortcutId);
    setCapturedKeys('');
  };

  const resetShortcut = (shortcutId: string) => {
    const defaultShortcut = shortcuts.find((s) => s.id === shortcutId)?.default;
    if (defaultShortcut) {
      const newShortcuts = { ...settings.shortcuts };
      delete newShortcuts[shortcutId];
      onUpdate({ shortcuts: newShortcuts });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-heading-md font-semibold text-text mb-4">Keyboard Shortcuts</h3>
      <p className="text-body-sm text-text-muted mb-4">
        Click a shortcut to record a new key combination. Press Escape to cancel.
      </p>
      <div className="space-y-3">
        {shortcuts.map((shortcut) => {
          const isEditing = editingId === shortcut.id;
          const currentShortcut = settings.shortcuts[shortcut.id] || shortcut.default;
          return (
            <div
              key={shortcut.id}
              className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl transition-all"
              onClick={() => !isEditing && startEditing(shortcut.id)}
              onKeyDown={(e) => isEditing && handleKeyDown(e, shortcut.id)}
              onKeyUp={(e) => isEditing && handleKeyUp(e, shortcut.id)}
              tabIndex={isEditing ? 0 : -1}
            >
              <div className="flex-1">
                <h4 className="font-medium text-text">{shortcut.name}</h4>
                <p className="text-body-sm text-text-muted">{shortcut.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <kbd
                  className={cn(
                    'px-3 py-1.5 bg-surface-elevated border border-border rounded text-body-sm font-mono text-text transition-all',
                    isEditing && 'bg-primary/20 border-primary animate-pulse'
                  )}
                >
                  {isEditing ? (capturedKeys || 'Press keys...') : currentShortcut}
                </kbd>
                {isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                      setCapturedKeys('');
                    }}
                    className="text-text-muted hover:text-text p-1"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {!isEditing && currentShortcut !== shortcut.default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetShortcut(shortcut.id);
                    }}
                    className="text-text-muted hover:text-text p-1"
                    aria-label="Reset to default"
                  >
                    <RotateCcw className="w-4 h-4" />
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

function DataSection({
  settings,
  onUpdate,
  exportSettings,
  importSettings,
  resetSettings,
}: {
  settings: import('../../types').DataSettings;
  onUpdate: (updates: Partial<import('../../types').DataSettings>) => Promise<void>;
  exportSettings: () => import('../../types').GlobalSettings;
  importSettings: (settings: import('../../types').GlobalSettings) => Promise<void>;
  resetSettings: () => Promise<void>;
}) {
  const workspaceStore = useWorkspaceStore.getState();
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExportSettings = () => {
    const data = exportSettings();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nebula-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWorkspace = () => {
    const activeWorkspaceId = workspaceStore.activeWorkspaceId;
    if (!activeWorkspaceId) return;
    workspaceStore.exportWorkspace(activeWorkspaceId).then((ws) => {
      const blob = new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nebula-workspace-${ws.name}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleExportAllWorkspaces = () => {
    const data = {
      workspaces: workspaceStore.workspaces,
      activeWorkspaceId: workspaceStore.activeWorkspaceId,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nebula-all-workspaces-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateBackup = () => {
    const data = {
      settings: exportSettings(),
      workspaces: workspaceStore.workspaces,
      activeWorkspaceId: workspaceStore.activeWorkspaceId,
      tasks: null,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nebula-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File, type: 'settings' | 'workspace' | 'backup') => {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (type === 'settings') {
        await importSettings(data);
      } else if (type === 'workspace') {
        await workspaceStore.importWorkspace(data);
      } else if (type === 'backup') {
        if (data.settings) await importSettings(data.settings);
        if (data.workspaces) {
          for (const ws of data.workspaces) {
            await workspaceStore.importWorkspace(ws);
          }
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import: invalid file format');
    }
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImportFile(file, 'settings');
    };
    input.click();
  };

  const handleImportWorkspace = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImportFile(file, 'workspace');
    };
    input.click();
  };

  const handleRestoreBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImportFile(file, 'backup');
    };
    input.click();
  };

  const handleResetWorkspace = async () => {
    if (!confirm('Reset current workspace? This cannot be undone.')) return;
    const activeWorkspaceId = workspaceStore.activeWorkspaceId;
    if (activeWorkspaceId) {
      await workspaceStore.deleteWorkspace(activeWorkspaceId);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Clear ALL local data? This cannot be undone and will remove all workspaces, settings, and tasks.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    await resetSettings();
    const { workspaces } = workspaceStore;
    for (const ws of workspaces) {
      await workspaceStore.deleteWorkspace(ws.id);
    }
    // Reset will create a default workspace
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Export Data</h3>
        <div className="space-y-3">
          <button onClick={handleExportSettings} className="btn-secondary w-full justify-start">
            <Download className="w-4 h-4 mr-2" /> Export Settings (JSON)
          </button>
          <button onClick={handleExportWorkspace} className="btn-secondary w-full justify-start">
            <Download className="w-4 h-4 mr-2" /> Export Current Workspace (JSON)
          </button>
          <button onClick={handleExportAllWorkspaces} className="btn-secondary w-full justify-start">
            <Download className="w-4 h-4 mr-2" /> Export All Workspaces (JSON)
          </button>
          <button onClick={handleCreateBackup} className="btn-secondary w-full justify-start">
            <Cloud className="w-4 h-4 mr-2" /> Create Full Backup
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Import Data</h3>
        <div className="space-y-3">
          <button onClick={handleImportSettings} className="btn-secondary w-full justify-start">
            <Upload className="w-4 h-4 mr-2" /> Import Settings (JSON)
          </button>
          <button onClick={handleImportWorkspace} className="btn-secondary w-full justify-start">
            <Upload className="w-4 h-4 mr-2" /> Import Workspace (JSON)
          </button>
          <button onClick={handleRestoreBackup} className="btn-secondary w-full justify-start">
            <RotateCcw className="w-4 h-4 mr-2" /> Restore from Backup
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <button onClick={handleResetWorkspace} className="btn-secondary w-full justify-start text-warning hover:bg-warning/10">
            <Trash2 className="w-4 h-4 mr-2" /> Reset Current Workspace
          </button>
          <button onClick={handleClearAllData} className="btn-secondary w-full justify-start text-error hover:bg-error/10">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All Local Data
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-heading-md font-semibold text-text mb-4">Auto Backup</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoBackup"
              checked={settings.autoBackup}
              onChange={(e) => onUpdate({ autoBackup: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="autoBackup" className="text-body-md text-text">Enable automatic backups</label>
          </div>
          {settings.autoBackup && (
            <div>
              <label className="label">Backup Interval: {settings.backupInterval / 3600000}h</label>
              <input
                type="range"
                min="1"
                max="168"
                value={settings.backupInterval / 3600000}
                onChange={(e) => onUpdate({ backupInterval: Number(e.target.value) * 3600000 })}
                className="w-full accent-primary"
              />
            </div>
          )}
          {settings.autoBackup && (
            <div>
              <label className="label">Max Backups: {settings.maxBackups}</label>
              <input
                type="range"
                min="1"
                max="50"
                value={settings.maxBackups}
                onChange={(e) => onUpdate({ maxBackups: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  onUpdate: (id: string, updates: Partial<import('../../types').Workspace>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<import('../../types').Workspace>;
  onSelect: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onExport: (id: string) => Promise<import('../../types').Workspace>;
  onImport: (workspace: import('../../types').Workspace) => Promise<import('../../types').Workspace>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const icons = [
    { id: 'layout-grid', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'briefcase', label: 'Work', icon: Briefcase },
    { id: 'book-open', label: 'Study', icon: BookOpen },
    { id: 'heart', label: 'Personal', icon: Heart },
    { id: 'gamepad2', label: 'Entertainment', icon: Gamepad2 },
  ];

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = Object.fromEntries(
    icons.map((ic) => [ic.id, ic.icon])
  ) as Record<string, React.ComponentType<{ className?: string }>>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-md font-semibold text-text">Workspaces</h3>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New Workspace
        </button>
      </div>

      <div className="space-y-3">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={cn(
              'flex items-center justify-between p-4 bg-surface border border-border rounded-xl',
              ws.id === activeWorkspaceId && 'border-primary/50 bg-primary/5'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                {iconMap[ws.icon] && (() => {
                  const Icon = iconMap[ws.icon];
                  return <Icon className="w-5 h-5 text-primary" />;
                })()}
              </div>
              <div>
                <h4 className="font-medium text-text">{ws.name}</h4>
                <p className="text-body-xs text-text-muted">{ws.widgets.length} widgets · {ws.collections.length} collections</p>
              </div>
              {ws.isDefault && <span className="badge badge-primary text-xs">Default</span>}
            </div>
            <div className="flex items-center gap-2">
              {ws.id !== activeWorkspaceId && (
                <button onClick={() => onSelect(ws.id)} className="btn-secondary text-body-sm">
                  Switch
                </button>
              )}
              <button onClick={() => onDuplicate(ws.id)} className="btn-icon p-1.5 text-text-muted hover:text-text" title="Duplicate">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={() => onExport(ws.id)} className="btn-icon p-1.5 text-text-muted hover:text-text" title="Export">
                <Download className="w-4 h-4" />
              </button>
              {!ws.isDefault && (
                <button onClick={() => onSetDefault(ws.id)} className="btn-icon p-1.5 text-text-muted hover:text-text" title="Set as default">
                  <Star className="w-4 h-4" />
                </button>
              )}
              {workspaces.length > 1 && (
                <button onClick={() => onDelete(ws.id)} className="btn-icon p-1.5 text-error hover:bg-error/10" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay/80 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border rounded-xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-heading-md font-semibold text-text mb-4">Create Workspace</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newWorkspaceName.trim() && onCreate(newWorkspaceName.trim())}
                    placeholder="e.g., Development, Work, Personal"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {icons.map((ic) => (
                      <button
                        key={ic.id}
                        onClick={() => onCreate(newWorkspaceName.trim() || 'New Workspace', ic.id)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all',
                          'border-border hover:border-primary'
                        )}
                      >
                        <ic.icon className="w-6 h-6 text-text" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                  <button onClick={() => { onCreate(newWorkspaceName.trim() || 'New Workspace'); setShowCreate(false); }} className="btn-primary" disabled={!newWorkspaceName.trim()}>
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}