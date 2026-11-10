import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Edit2, Trash2, EyeOff, Flag, X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import type { WidgetProps, TodoWidgetSettings, Task, TaskPriority } from '../../types';
import { useTaskStore } from '../../stores/task.store';

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'var(--color-text-muted)',
  medium: 'var(--color-warning)',
  high: 'var(--color-error)',
  urgent: 'var(--color-error)',
};

export function TodoWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const settings = config.settings as TodoWidgetSettings;
  const { getFilteredTasks, addTask, updateTask, deleteTask, toggleTask, clearCompleted, getTaskStats } =
    useTaskStore();

  const stats = getTaskStats();
  const tasks = getFilteredTasks();
  const displayTasks =
    settings.maxVisible > 0 ? tasks.slice(0, settings.maxVisible) : tasks;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addTask(newTitle.trim());
    setNewTitle('');
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = async () => {
    if (editingId && editingTitle.trim()) await updateTask(editingId, { title: editingTitle.trim() });
    setEditingId(null);
    setEditingTitle('');
  };

  if (isPreview) {
    return (
      <div className="widget-card" style={{ gap: '0.375rem' }}>
        <div className="widget-header">
          <span className="widget-title"><CheckSquare aria-hidden />Today's Tasks</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>2 / 4</span>
        </div>
        {['Buy groceries', 'Finish report', 'Team meeting'].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1.5px solid var(--color-border)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>{t}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('widget-card', isEditing && 'is-editing')}>
      {/* Edit toolbar */}
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            gap: '0.125rem',
          }}
        >
          <button onClick={(e) => { e.stopPropagation(); onHide(); }} className="btn-icon" title="Hide" style={{ color: 'var(--color-warning)' }}>
            <EyeOff style={{ width: '14px', height: '14px' }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="btn-icon" title="Remove" style={{ color: 'var(--color-error)' }}>
            <Trash2 style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="widget-header">
        <span className="widget-title">
          <CheckSquare aria-hidden />
          Today's Tasks
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {stats.completed}/{stats.total}
          </span>
          {stats.completed > 0 && (
            <button
              onClick={clearCompleted}
              style={{
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.125rem 0.25rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-error)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
              aria-label="Clear completed tasks"
            >
              Clear done
            </button>
          )}
        </div>
      </div>

      {/* Add task */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', flexShrink: 0 }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          className="input"
          style={{ height: '34px', flex: 1, fontSize: '0.8125rem' }}
          disabled={isPreview}
          aria-label="New task title"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || isPreview}
          className="btn btn-primary"
          style={{ height: '34px', width: '34px', padding: 0, flexShrink: 0 }}
          aria-label="Add task"
        >
          <Plus style={{ width: '15px', height: '15px' }} />
        </button>
      </form>

      {/* Task list */}
      <div
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
        className="scrollbar-thin"
      >
        {displayTasks.length === 0 ? (
          <div className="empty-state" style={{ height: '100%', minHeight: '80px' }}>
            <CheckSquare style={{ width: '28px', height: '28px' }} aria-hidden />
            <p className="empty-state-title">No tasks</p>
            <p className="empty-state-description">Add your first task above</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} role="list">
            <AnimatePresence>
              {displayTasks.map((task) => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <TaskRow
                    task={task}
                    isEditing={editingId === task.id}
                    editingTitle={editingTitle}
                    onEditTitle={setEditingTitle}
                    onStartEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => { setEditingId(null); setEditingTitle(''); }}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onPriority={(p) => updateTask(task.id, { priority: p })}
                    settings={settings}
                    interactive={!isPreview}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {settings.maxVisible > 0 && tasks.length > settings.maxVisible && (
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.75rem', height: '28px' }}
            onClick={() => onConfigChange({ ...settings, maxVisible: 0 })}
          >
            Show {tasks.length - settings.maxVisible} more
          </button>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  isEditing,
  editingTitle,
  onEditTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  onPriority,
  settings,
  interactive,
}: {
  task: Task;
  isEditing: boolean;
  editingTitle: string;
  onEditTitle: (t: string) => void;
  onStartEdit: (t: Task) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onPriority: (p: TaskPriority) => void;
  settings: TodoWidgetSettings;
  interactive: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.3125rem 0.25rem',
        borderBottom: '1px solid var(--color-border)',
        opacity: task.completed ? 0.55 : 1,
        transition: 'opacity 150ms ease',
        minHeight: '34px',
      }}
      className="group"
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggle}
        disabled={!interactive}
        className="checkbox"
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
        style={{ flexShrink: 0 }}
      />

      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => onEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          onBlur={onSaveEdit}
          autoFocus
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--color-text)',
            padding: 0,
          }}
        />
      ) : (
        <span
          onDoubleClick={() => interactive && onStartEdit(task)}
          title={interactive ? 'Double-click to edit' : undefined}
          style={{
            flex: 1,
            fontSize: '0.875rem',
            color: 'var(--color-text)',
            wordBreak: 'break-word',
            textDecoration: task.completed ? 'line-through' : 'none',
            cursor: interactive ? 'text' : 'default',
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </span>
      )}

      {/* Priority indicator */}
      {settings.showPriority && (
        <div style={{ position: 'relative' }}>
          <Flag
            style={{ width: '12px', height: '12px', color: PRIORITY_COLOR[task.priority], flexShrink: 0 }}
            aria-label={`Priority: ${task.priority}`}
          />
        </div>
      )}

      {/* Actions — appear on hover */}
      {interactive && !isEditing && (
        <div
          style={{
            display: 'flex',
            gap: '0.125rem',
            opacity: 0,
            transition: 'opacity 150ms ease',
          }}
          className="group-hover-opacity"
        >
          <button onClick={() => onStartEdit(task)} className="btn-icon" aria-label="Edit task" style={{ width: '24px', height: '24px' }}>
            <Edit2 style={{ width: '12px', height: '12px' }} />
          </button>
          <button onClick={onDelete} className="btn-icon" aria-label="Delete task" style={{ width: '24px', height: '24px', color: 'var(--color-error)' }}>
            <X style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      )}
    </div>
  );
}
