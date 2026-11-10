import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, LayoutDashboard, Code, Briefcase, BookOpen, Heart, Gamepad2, Trash2, Copy, Check } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useWorkspaceStore } from '../../stores/workspace.store';
import type { Workspace } from '../../types';

interface WorkspaceSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelect: (id: string) => Promise<void>;
}

export function WorkspaceSwitcher({ isOpen, onClose, workspaces, activeWorkspaceId, onSelect }: WorkspaceSwitcherProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceIcon, setNewWorkspaceIcon] = useState('layout-grid');
  const { createWorkspace, deleteWorkspace, duplicateWorkspace } = useWorkspaceStore();

  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    'layout-grid': LayoutDashboard,
    'code': Code,
    'briefcase': Briefcase,
    'book-open': BookOpen,
    'heart': Heart,
    'gamepad2': Gamepad2,
  };

  const iconOptions = [
    { id: 'layout-grid', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'briefcase', label: 'Work', icon: Briefcase },
    { id: 'book-open', label: 'Study', icon: BookOpen },
    { id: 'heart', label: 'Personal', icon: Heart },
    { id: 'gamepad2', label: 'Entertainment', icon: Gamepad2 },
  ];

  if (!isOpen) return null;

  const handleCreate = () => {
    const name = newWorkspaceName.trim() || 'New Workspace';
    createWorkspace(name, newWorkspaceIcon).then((ws) => {
      return onSelect(ws.id);
    }).finally(() => {
      setNewWorkspaceName('');
      setNewWorkspaceIcon('layout-grid');
      setShowCreate(false);
      onClose();
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-surface-elevated border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-heading-lg font-bold text-text">Switch Workspace</h2>
            <button onClick={onClose} className="btn-icon p-2 text-text-muted hover:text-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {workspaces.map((ws) => {
              const Icon = icons[ws.icon] || LayoutDashboard;
              return (
                <div
                  key={ws.id}
                  onClick={() => {
                    onSelect(ws.id).then(() => onClose());
                  }}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left cursor-pointer',
                    ws.id === activeWorkspaceId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border-strong'
                  )}
                >
                  <div className={cn(
                    'p-3 rounded-xl flex-shrink-0',
                    ws.id === activeWorkspaceId ? 'bg-primary/20 text-primary' : 'bg-surface text-text'
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text truncate">{ws.name}</h3>
                    <p className="text-body-xs text-text-muted">
                      {ws.widgets.length} widgets · {ws.collections.length} collections
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        duplicateWorkspace(ws.id);
                      }}
                      className="btn-icon p-1.5 text-text-muted hover:text-text"
                      title="Duplicate workspace"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {workspaces.length > 1 && (
                      <button
                        onClick={() => {
                          deleteWorkspace(ws.id).catch(() => {});
                          if (activeWorkspaceId === ws.id && workspaces.length > 1) {
                            const other = workspaces.find((w) => w.id !== ws.id);
                            if (other) onSelect(other.id);
                          }
                        }}
                        className="btn-icon p-1.5 text-text-muted hover:text-error"
                        title="Delete workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {ws.id === activeWorkspaceId && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-border">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-secondary w-full justify-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Create New Workspace
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="e.g., Development, Work, Personal"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {iconOptions.map((ic) => (
                      <button
                        key={ic.id}
                        onClick={() => setNewWorkspaceIcon(ic.id)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all',
                          newWorkspaceIcon === ic.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary'
                        )}
                        title={ic.label}
                      >
                        <ic.icon className="w-5 h-5 text-text" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleCreate} className="btn-primary">
                    <Plus className="w-4 h-4 mr-1" /> Create
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
