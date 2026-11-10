import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, LayoutDashboard, Code, Briefcase, BookOpen, Heart,
  Gamepad2, Trash2, Copy, Check,
} from 'lucide-react';
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

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties; 'aria-hidden'?: boolean }>> = {
  'layout-grid': LayoutDashboard,
  code: Code,
  briefcase: Briefcase,
  'book-open': BookOpen,
  heart: Heart,
  gamepad2: Gamepad2,
};

const ICON_OPTIONS = [
  { id: 'layout-grid', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'code',         label: 'Code',      Icon: Code },
  { id: 'briefcase',    label: 'Work',      Icon: Briefcase },
  { id: 'book-open',    label: 'Study',     Icon: BookOpen },
  { id: 'heart',        label: 'Personal',  Icon: Heart },
  { id: 'gamepad2',     label: 'Gaming',    Icon: Gamepad2 },
];

export function WorkspaceSwitcher({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelect,
}: WorkspaceSwitcherProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('layout-grid');
  const { createWorkspace, deleteWorkspace, duplicateWorkspace } = useWorkspaceStore();
  const nameInputRef = useRef<HTMLInputElement>(null);

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setShowCreate(false);
      setNewName('');
      setNewIcon('layout-grid');
    }
  }, [isOpen]);

  /* Focus name input when create form opens */
  useEffect(() => {
    if (showCreate) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [showCreate]);

  if (!isOpen) return null;

  const handleCreate = () => {
    const name = newName.trim() || 'New Workspace';
    createWorkspace(name, newIcon).then((ws) => {
      return onSelect(ws.id);
    }).finally(() => {
      setNewName('');
      setNewIcon('layout-grid');
      setShowCreate(false);
      onClose();
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="ws-switcher-backdrop"
        className="modal-backdrop"
        style={{ zIndex: 200, alignItems: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Switch workspace"
      >
        <motion.div
          className="modal-panel"
          style={{ width: '100%', maxWidth: '420px' }}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">Switch Workspace</h2>
            <button
              onClick={onClose}
              className="btn-icon"
              aria-label="Close"
              style={{ marginLeft: 'auto' }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Workspace list */}
          <div
            className="scrollbar-thin"
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '0.5rem',
            }}
            role="listbox"
            aria-label="Workspaces"
          >
            {workspaces.map((ws) => {
              const Icon = ICON_MAP[ws.icon] || LayoutDashboard;
              const isActive = ws.id === activeWorkspaceId;
              return (
                <WorkspaceRow
                  key={ws.id}
                  workspace={ws}
                  isActive={isActive}
                  Icon={Icon}
                  canDelete={workspaces.length > 1}
                  onSelect={() => onSelect(ws.id).then(() => onClose())}
                  onDuplicate={() => duplicateWorkspace(ws.id)}
                  onDelete={() => {
                    deleteWorkspace(ws.id).catch(() => {});
                    if (isActive && workspaces.length > 1) {
                      const other = workspaces.find((w) => w.id !== ws.id);
                      if (other) onSelect(other.id);
                    }
                  }}
                />
              );
            })}
          </div>

          {/* Create form or button */}
          <div
            style={{
              padding: '0.75rem',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <AnimatePresence mode="wait">
              {!showCreate ? (
                <motion.button
                  key="create-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCreate(true)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  New Workspace
                </motion.button>
              ) : (
                <motion.div
                  key="create-form"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}
                >
                  {/* Name */}
                  <div>
                    <label className="label" htmlFor="new-workspace-name">Name</label>
                    <input
                      ref={nameInputRef}
                      id="new-workspace-name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate();
                        if (e.key === 'Escape') setShowCreate(false);
                      }}
                      placeholder="e.g., Development, Personal"
                      className="input"
                      style={{ height: '36px' }}
                    />
                  </div>

                  {/* Icon picker */}
                  <div>
                    <label className="label">Icon</label>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {ICON_OPTIONS.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          onClick={() => setNewIcon(id)}
                          aria-label={label}
                          aria-pressed={newIcon === id}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${newIcon === id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            backgroundColor:
                              newIcon === id
                                ? 'var(--color-primary-muted)'
                                : 'var(--color-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <Icon
                            style={{
                              width: '14px',
                              height: '14px',
                              color:
                                newIcon === id
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text-secondary)',
                            }}
                            aria-hidden
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowCreate(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button onClick={handleCreate} className="btn btn-primary btn-sm">
                      <Plus style={{ width: '13px', height: '13px' }} />
                      Create
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* Individual workspace row */
function WorkspaceRow({
  workspace,
  isActive,
  Icon,
  canDelete,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  workspace: Workspace;
  isActive: boolean;
  Icon: React.ComponentType<{ style?: React.CSSProperties; 'aria-hidden'?: boolean }>;
  canDelete: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="option"
      aria-selected={isActive}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem 0.625rem',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'background-color 150ms ease',
        backgroundColor: isActive ? 'var(--color-primary-muted)' : 'transparent',
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.backgroundColor =
            'var(--color-surface-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: isActive
            ? 'var(--color-primary-muted)'
            : 'var(--color-surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon
          style={{
            width: '14px',
            height: '14px',
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
          aria-hidden
        />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {workspace.name}
        </div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.3,
          }}
        >
          {workspace.widgets.length} widget{workspace.widgets.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Active check */}
      {isActive && (
        <Check
          style={{ width: '14px', height: '14px', color: 'var(--color-primary)', flexShrink: 0 }}
          aria-hidden
        />
      )}

      {/* Actions — stop propagation so they don't trigger row click */}
      <div
        style={{ display: 'flex', gap: '0.125rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDuplicate}
          className="btn-icon"
          aria-label={`Duplicate ${workspace.name}`}
          title="Duplicate"
          style={{ width: '26px', height: '26px' }}
        >
          <Copy style={{ width: '12px', height: '12px' }} />
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="btn-icon"
            aria-label={`Delete ${workspace.name}`}
            title="Delete"
            style={{ width: '26px', height: '26px', color: 'var(--color-error)' }}
          >
            <Trash2 style={{ width: '12px', height: '12px' }} />
          </button>
        )}
      </div>
    </div>
  );
}
