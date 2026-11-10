import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Plus, Settings, EyeOff, Trash2, Edit2, X, ExternalLink, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { getFaviconUrl, validateUrl, normalizeUrl } from '../../utils/helpers';
import type { WidgetProps, QuickLinksWidgetSettings, QuickLink } from '../../types';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function QuickLinksWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkOpenInNewTab, setNewLinkOpenInNewTab] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settings = config.settings as QuickLinksWidgetSettings;

  const { activeWorkspaceId, updateWorkspace } = useWorkspaceStore();
  const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
  const links = workspace?.quickLinks || [];

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim() || !newLinkUrl.trim() || !activeWorkspaceId) return;
    if (!validateUrl(newLinkUrl)) return;

    const newLink: QuickLink = {
      id: `link-${Date.now()}`,
      name: newLinkName.trim(),
      url: normalizeUrl(newLinkUrl.trim()),
      favicon: getFaviconUrl(newLinkUrl),
      openInNewTab: newLinkOpenInNewTab,
      order: links.length,
    };

    const updatedWorkspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!updatedWorkspace) return;

    await updateWorkspace(activeWorkspaceId, {
      quickLinks: [...updatedWorkspace.quickLinks, newLink],
    });

    setNewLinkName('');
    setNewLinkUrl('');
    setNewLinkOpenInNewTab(false);
    setShowAddLink(false);
  };

  const handleRemoveLink = async (linkId: string) => {
    if (!activeWorkspaceId) return;
    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    await updateWorkspace(activeWorkspaceId, {
      quickLinks: workspace.quickLinks.filter((l) => l.id !== linkId),
    });
  };

  const handleReorderLinks = async (linkIds: string[]) => {
    if (!activeWorkspaceId) return;
    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    const reorderedLinks = linkIds.map((id) => workspace.quickLinks.find((l) => l.id === id)).filter(Boolean) as QuickLink[];
    await updateWorkspace(activeWorkspaceId, { quickLinks: reorderedLinks });
  };

  const handleSettingsChange = (newSettings: Partial<QuickLinksWidgetSettings>) => {
    onConfigChange({ ...settings, ...newSettings });
  };

  const getDisplayLinks = () => {
    if (settings.showAll) return links;
    return links.slice(0, settings.maxVisible);
  };

  if (isPreview) {
    return (
      <div className="p-6 bg-surface-elevated border border-border rounded-xl">
        <div className="flex flex-wrap gap-3">
          {['GitHub', 'Twitter', 'LinkedIn', 'Gmail', 'Calendar', 'Drive', 'Figma', 'Notion'].map((name, i) => (
            <a
              key={i}
              href="#"
              className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-text hover:bg-surface-hover hover:border-border-strong transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">{name}</span>
              <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-text transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  const displayLinks = getDisplayLinks();

  return (
    <div
      className={cn(
        'relative h-full w-full bg-surface-elevated border border-border rounded-xl p-6 transition-all duration-normal flex flex-col',
        'hover:shadow-lg hover:border-border-strong',
        isEditing && 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
      )}
    >
      {isEditing && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
            className="btn-icon p-1.5"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            className="btn-icon p-1.5 text-warning"
            title="Hide Widget"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="btn-icon p-1.5 text-error"
            title="Remove Widget"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-heading-sm font-semibold text-text flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary" />
          Quick Links
        </h3>
        <button onClick={() => setShowAddLink(true)} className="btn-primary text-body-sm">
          <Plus className="w-4 h-4 mr-1" /> Add Link
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {displayLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted py-8">
            <LinkIcon className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-body-md">No quick links yet</p>
            <p className="text-body-sm">Add your favorite websites for quick access</p>
            <button onClick={() => setShowAddLink(true)} className="btn-primary mt-4">
              <Plus className="w-4 h-4 mr-1" /> Add Link
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              layout
              className={cn(
                'flex flex-wrap gap-3',
                settings.layout === 'grid' && 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                settings.layout === 'list' && 'flex-col'
              )}
              role="list"
            >
              {displayLinks.map((link, index) => (
                <QuickLinkItem
                  key={link.id}
                  link={link}
                  index={index}
                  settings={settings}
                  onRemove={() => handleRemoveLink(link.id)}
                  onEdit={(name, url, openInNewTab) => {
                    // Handle edit
                  }}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {settings.maxVisible > 0 && links.length > settings.maxVisible && !settings.showAll && (
          <div className="mt-4 text-center">
            <button className="btn-ghost text-body-sm" onClick={() => handleSettingsChange({ showAll: true })}>
              Show {links.length - settings.maxVisible} more links
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-overlay/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md bg-surface-elevated border border-border rounded-xl p-6 shadow-xl"
            >
              <h3 className="text-heading-md font-semibold text-text mb-4">Add Quick Link</h3>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    placeholder="e.g., GitHub"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">URL</label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://github.com"
                    className="input"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLinkOpenInNewTab}
                    onChange={(e) => setNewLinkOpenInNewTab(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-body-sm text-text">Open in new tab</span>
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddLink(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={!newLinkName.trim() || !newLinkUrl.trim()}>
                    Add Link
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickLinksSettingsPanel
        config={config}
        settings={settings}
        onChange={handleSettingsChange}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

function QuickLinkItem({
  link,
  index,
  settings,
  onRemove,
  onEdit,
}: {
  link: QuickLink;
  index: number;
  settings: QuickLinksWidgetSettings;
  onRemove: () => void;
  onEdit: (name: string, url: string, openInNewTab: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(link.name);
  const [editUrl, setEditUrl] = useState(link.url);
  const [editOpenInNewTab, setEditOpenInNewTab] = useState(link.openInNewTab);

  const handleSave = () => {
    onEdit(editName, editUrl, editOpenInNewTab);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(link.name);
    setEditUrl(link.url);
    setEditOpenInNewTab(link.openInNewTab);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-surface border border-border rounded-xl" style={{ minWidth: 200 }}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="input"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <input
          type="text"
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          className="input"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editOpenInNewTab}
            onChange={(e) => setEditOpenInNewTab(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-body-sm text-text">Open in new tab</span>
        </label>
        <div className="flex gap-2">
          <button onClick={handleSave} className="btn-primary flex-1">Save</button>
          <button onClick={handleCancel} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    );
  }

  const baseClass = 'flex items-center gap-3 p-3 bg-surface border border-border rounded-xl text-text hover:bg-surface-hover hover:border-border-strong transition-all group';
  const gridClass = 'flex flex-col items-center text-center';
  const listClass = 'flex items-center';

  return (
    <motion.a
      layout
      href={link.url}
      target={link.openInNewTab ? '_blank' : '_self'}
      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
      className={cn(baseClass, settings.layout === 'grid' && gridClass, settings.layout === 'list' && listClass)}
      role="listitem"
    >
      {settings.showIcons && (
        <img
          src={link.favicon || getFaviconUrl(link.url)}
          alt=""
          className={cn('w-8 h-8 rounded-lg', settings.layout === 'grid' && 'mx-auto', settings.layout === 'list' && 'flex-shrink-0')}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      {settings.showNames && (
        <span className={cn('font-medium truncate', settings.layout === 'grid' && 'text-center w-full')}>
          {link.name}
        </span>
      )}

      {settings.layout === 'list' && (
        <ExternalLink className="w-4 h-4 text-text-muted ml-auto group-hover:text-text transition-colors" />
      )}

      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }}
            className="btn-icon p-1.5 text-text-muted hover:text-text"
            aria-label="Edit link"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
            className="btn-icon p-1.5 text-error hover:bg-error/10"
            aria-label="Delete link"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.a>
  );
}

function QuickLinksSettingsPanel({
  config,
  settings,
  onChange,
  isOpen,
  onClose,
}: {
  config: import('../../types').WidgetConfig;
  settings: QuickLinksWidgetSettings;
  onChange: (settings: Partial<QuickLinksWidgetSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-overlay/80 backdrop-blur-sm rounded-xl z-10 p-6 flex items-center justify-center animate-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface-elevated border border-border rounded-xl p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading-md font-semibold text-text">Quick Links Settings</h3>
          <button onClick={onClose} className="btn-icon p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Layout</label>
            <div className="flex gap-2">
              {['grid', 'list', 'carousel'].map((layout) => (
                <button
                  key={layout}
                  onClick={() => onChange({ layout: layout as 'grid' | 'list' | 'carousel' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.layout === layout
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showIcons}
                onChange={(e) => onChange({ showIcons: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show icons</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showNames}
                onChange={(e) => onChange({ showNames: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show names</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showAll}
                onChange={(e) => onChange({ showAll: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show all links</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => onChange({ compactMode: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Compact mode</span>
            </label>
          </div>

          <div>
            <label className="label">Max Visible: {settings.maxVisible || 'All'}</label>
            <input
              type="range"
              min="0"
              max="20"
              value={settings.maxVisible}
              onChange={(e) => onChange({ maxVisible: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
