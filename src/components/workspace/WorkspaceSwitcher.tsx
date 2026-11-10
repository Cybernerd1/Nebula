import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, LayoutDashboard, Code, Briefcase, BookOpen, Heart, Gamepad2, Trash2, Copy, Download, Settings, Check } from 'lucide-react';
import { cn } from '../../utils/helpers';
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

  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    'layout-grid': LayoutDashboard,
    'code': Code,
    'briefcase': Briefcase,
    'book-open': BookOpen,
    'heart': Heart,
    'gamepad2': Gamepad2,
  };

  if (!isOpen) return null;

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
                <button
                  key={ws.id}
                  onClick={() => onSelect(ws.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left',
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
                  {ws.id === activeWorkspaceId && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6 border-t border-border">
            <button
              onClick={() => setShowCreate(true)}
              className="btn-secondary w-full justify-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Create New Workspace
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}