import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Plus, ChevronDown, ChevronUp, Settings, EyeOff, Trash2, Edit2, Link as LinkIcon, X, GripVertical, MoreVertical } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { getFaviconUrl, validateUrl, normalizeUrl } from '../../utils/helpers';
import type { WidgetProps, CollectionsWidgetSettings, Collection, QuickLink } from '../../types';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function CollectionsWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const settings = config.settings as CollectionsWidgetSettings;

  const { activeWorkspaceId, updateWorkspace } = useWorkspaceStore();
  const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
  const collections = workspace?.collections || [];
  const hiddenCollections = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId)?.collections
    .filter((c) => !c.visible)
    .map((c) => c.id) || [];

  const visibleCollections = collections.filter((c) => !hiddenCollections.includes(c.id));

  const handleToggleCollection = (collectionId: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim() || !activeWorkspaceId) return;
    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    const newCollection: Collection = {
      id: `collection-${Date.now()}`,
      name: newCollectionName.trim(),
      icon: 'folder',
      color: '#06b6d4',
      links: [],
      expanded: true,
      visible: true,
      order: workspace.collections.length,
      showAll: false,
      maxVisible: 6,
    };

    await updateWorkspace(activeWorkspaceId, {
      collections: [...workspace.collections, newCollection],
    });
    setNewCollectionName('');
    setShowAddCollection(false);
  };

  const handleAddLink = async (collectionId: string, name: string, url: string) => {
    if (!name.trim() || !url.trim() || !activeWorkspaceId) return;
    if (!validateUrl(url)) return;

    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    const newLink: QuickLink = {
      id: `link-${Date.now()}`,
      name: name.trim(),
      url: normalizeUrl(url.trim()),
      favicon: getFaviconUrl(url),
      openInNewTab: false,
      order: 0,
    };

    const updatedCollections = workspace.collections.map((c) =>
      c.id === collectionId ? { ...c, links: [...c.links, newLink] } : c
    );

    await updateWorkspace(activeWorkspaceId, { collections: updatedCollections });
  };

  const handleRemoveLink = async (collectionId: string, linkId: string) => {
    if (!activeWorkspaceId) return;
    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    const updatedCollections = workspace.collections.map((c) =>
      c.id === collectionId ? { ...c, links: c.links.filter((l) => l.id !== linkId) } : c
    );

    await updateWorkspace(activeWorkspaceId, { collections: updatedCollections });
  };

  const handleRemoveCollection = async (collectionId: string) => {
    if (!activeWorkspaceId) return;
    const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
    if (!workspace) return;

    const updatedCollections = workspace.collections.filter((c) => c.id !== collectionId);
    await updateWorkspace(activeWorkspaceId, { collections: updatedCollections });
  };

  const handleSettingsChange = (newSettings: Partial<CollectionsWidgetSettings>) => {
    onConfigChange({ ...settings, ...newSettings });
  };

  const getDisplayLinks = (collection: Collection) => {
    if (settings.showAll || collection.showAll) return collection.links;
    return collection.links.slice(0, settings.maxVisiblePerCollection);
  };

  if (isPreview) {
    return (
      <div className="p-6 bg-surface-elevated border border-border rounded-xl">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Folder className="w-5 h-5 text-primary" />
              <span className="font-semibold text-text">Development</span>
              <span className="text-body-xs text-text-muted">8 links</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['GitHub', 'Vercel', 'npm', 'MDN', 'Stack Overflow', 'TypeScript'].map((name) => (
                <a key={name} href="#" className="px-3 py-1.5 bg-surface border border-border rounded-lg text-body-sm text-text hover:bg-surface-hover transition-colors">
                  {name}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Folder className="w-5 h-5 text-warning" />
              <span className="font-semibold text-text">Productivity</span>
              <span className="text-body-xs text-text-muted">4 links</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Notion', 'Linear', 'Figma', 'GitHub Projects'].map((name) => (
                <a key={name} href="#" className="px-3 py-1.5 bg-surface border border-border rounded-lg text-body-sm text-text hover:bg-surface-hover transition-colors">
                  {name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent, collectionId: string, linkName: string, linkUrl: string) => {
    if (e.key === 'Enter') {
      handleAddLink(collectionId, linkName, linkUrl);
    }
  };

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
          <Folder className="w-5 h-5 text-primary" />
          Collections
        </h3>
        <button onClick={() => setShowAddCollection(true)} className="btn-primary text-body-sm">
          <Plus className="w-4 h-4 mr-1" /> Add Collection
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {visibleCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted py-8">
            <Folder className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-body-md">No collections yet</p>
            <p className="text-body-sm">Create your first collection to organize links</p>
            <button onClick={() => setShowAddCollection(true)} className="btn-primary mt-4">
              <Plus className="w-4 h-4 mr-1" /> Create Collection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isExpanded={expandedCollections.has(collection.id) || collection.expanded}
                onToggle={() => handleToggleCollection(collection.id)}
                onAddLink={handleAddLink}
                onRemoveLink={handleRemoveLink}
                onRemoveCollection={handleRemoveCollection}
                getDisplayLinks={getDisplayLinks}
                settings={settings}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddCollection && (
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
              <h3 className="text-heading-md font-semibold text-text mb-4">Create Collection</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Collection Name</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCollection()}
                    placeholder="e.g., Development, Work, Personal"
                    className="input"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddCollection(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleAddCollection} className="btn-primary" disabled={!newCollectionName.trim()}>
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CollectionsSettingsPanel
        config={config}
        settings={settings}
        onChange={handleSettingsChange}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

function CollectionItem({
  collection,
  isExpanded,
  onToggle,
  onAddLink,
  onRemoveLink,
  onRemoveCollection,
  getDisplayLinks,
  settings,
}: {
  collection: Collection;
  isExpanded: boolean;
  onToggle: () => void;
  onAddLink: (collectionId: string, name: string, url: string) => void;
  onRemoveLink: (collectionId: string, linkId: string) => void;
  onRemoveCollection: (collectionId: string) => void;
  getDisplayLinks: (collection: Collection) => QuickLink[];
  settings: CollectionsWidgetSettings;
}) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const displayLinks = getDisplayLinks(collection);
  const hasMoreLinks = collection.links.length > displayLinks.length;

  const handleSubmitLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;
    onAddLink(collection.id, newLinkName, newLinkUrl);
    setNewLinkName('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-text">{collection.name}</h4>
            {settings.showLinkCount && (
              <span className="text-body-xs text-text-muted">{collection.links.length} link{collection.links.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
          <button
            onClick={(e) => { e.stopPropagation(); setShowAddLink(true); }}
            className="btn-icon p-1.5 text-text-muted hover:text-text"
            aria-label="Add link"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveCollection(collection.id); }}
            className="btn-icon p-1.5 text-error hover:bg-error/10"
            aria-label="Delete collection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border p-4"
          >
            {displayLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {displayLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target={link.openInNewTab ? '_blank' : '_self'}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-body-sm text-text hover:bg-surface-hover transition-colors"
                  >
                    {settings.showIcons && (
                      <img
                        src={link.favicon || getFaviconUrl(link.url)}
                        alt=""
                        className="w-4 h-4 rounded"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    {settings.showNames && <span className="truncate max-w-[150px]">{link.name}</span>}
                    <LinkIcon className="w-3 h-3 text-text-muted" />
                  </a>
                ))}
              </div>
            )}

            {hasMoreLinks && !settings.showAll && !collection.showAll && (
              <button
                onClick={() => {
                  // Toggle showAll for this collection
                }}
                className="btn-ghost text-body-sm w-full"
              >
                Show {collection.links.length - displayLinks.length} more links
              </button>
            )}

            <form onSubmit={handleSubmitLink} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 input"
                />
                <input
                  type="text"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="URL"
                  className="flex-1 input"
                />
                <button type="submit" className="btn-primary">
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLink(false)}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CollectionsSettingsPanel({
  config,
  settings,
  onChange,
  isOpen,
  onClose,
}: {
  config: import('../../types').WidgetConfig;
  settings: CollectionsWidgetSettings;
  onChange: (settings: Partial<CollectionsWidgetSettings>) => void;
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
          <h3 className="text-heading-md font-semibold text-text">Collections Settings</h3>
          <button onClick={onClose} className="btn-icon p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
                checked={settings.showEmptyCollections}
                onChange={(e) => onChange({ showEmptyCollections: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show empty collections</span>
            </label>
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
                checked={settings.showLinkCount}
                onChange={(e) => onChange({ showLinkCount: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show link count</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultExpanded}
                onChange={(e) => onChange({ defaultExpanded: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Expanded by default</span>
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
            <label className="label">Max Links Per Collection: {settings.maxVisiblePerCollection}</label>
            <input
              type="range"
              min="1"
              max="20"
              value={settings.maxVisiblePerCollection}
              onChange={(e) => onChange({ maxVisiblePerCollection: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
