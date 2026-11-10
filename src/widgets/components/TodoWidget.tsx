import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, MoreVertical, Settings, EyeOff, Trash2, Flag, Calendar, X, GripVertical, ChevronDown, ChevronUp, CheckSquare, Edit2 } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { formatDate } from '../../utils/helpers';
import type { WidgetProps, TodoWidgetSettings, Task, TaskPriority } from '../../types';
import { useTaskStore } from '../../stores/task.store';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-error',
  urgent: 'text-error',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function TodoWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const settings = config.settings as TodoWidgetSettings;

  const { tasks, filter, sortBy, sortDirection, getFilteredTasks, addTask, updateTask, deleteTask, toggleTask, reorderTasks, clearCompleted, setFilter, setSort, getTaskStats } = useTaskStore();

  const filteredTasks = getFilteredTasks();
  const stats = getTaskStats();
  const displayTasks = settings.maxVisible > 0 ? filteredTasks.slice(0, settings.maxVisible) : filteredTasks;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addTask(newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const handleToggleTask = async (task: Task) => {
    await toggleTask(task.id);
  };

  const handleDeleteTask = async (task: Task) => {
    await deleteTask(task.id);
  };

  const handlePriorityChange = async (task: Task, priority: TaskPriority) => {
    await updateTask(task.id, { priority });
  };

  const handleDueDateChange = async (task: Task, date: string) => {
    await updateTask(task.id, { dueDate: date ? new Date(date).getTime() : undefined });
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleSaveEdit = async () => {
    if (editingTaskId && editingTaskTitle.trim()) {
      await updateTask(editingTaskId, { title: editingTaskTitle.trim() });
    }
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleReorder = async (taskIds: string[]) => {
    await reorderTasks(taskIds);
  };

  const handleClearCompleted = async () => {
    await clearCompleted();
  };

  const handleSettingsChange = (newSettings: Partial<TodoWidgetSettings>) => {
    onConfigChange({ ...settings, ...newSettings });
  };

  const handleFilterChange = (newFilter: 'all' | 'active' | 'completed') => {
    setFilter(newFilter);
  };

  const handleSortChange = (newSortBy: 'order' | 'priority' | 'dueDate' | 'createdAt') => {
    setSort(newSortBy, sortBy === newSortBy && sortDirection === 'asc' ? 'desc' : 'asc');
  };

  if (isPreview) {
    return (
      <div className="p-6 bg-surface-elevated border border-border rounded-xl">
        <div className="space-y-3">
          {['Buy groceries', 'Finish project proposal', 'Call dentist', 'Read 30 minutes'].map((title, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
              <input type="checkbox" className="w-4 h-4 accent-primary" />
              <span className="text-text flex-1">{title}</span>
              <span className="text-warning">●</span>
            </div>
          ))}
          <div className="text-center text-text-muted text-sm mt-2">+ 2 more tasks</div>
        </div>
      </div>
    );
  }

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
          <CheckSquare className="w-5 h-5 text-primary" />
          Today's Tasks
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-body-sm text-text-muted">{stats.completed}/{stats.total}</span>
          {stats.active > 0 && (
            <button onClick={handleClearCompleted} className="btn-ghost text-body-xs text-error hover:text-error">
              Clear completed
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleAddTask} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 input"
            disabled={isPreview}
          />
          <button type="submit" className="btn-primary" disabled={!newTaskTitle.trim() || isPreview}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto min-h-0">
        {displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted py-8">
            <CheckSquare className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-body-md">No tasks yet</p>
            <p className="text-body-sm">Add your first task above</p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.ul
              layout
              className="space-y-2"
              role="list"
            >
              {displayTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  isEditing={editingTaskId === task.id}
                  editingTitle={editingTaskTitle}
                  onEditTitle={setEditingTaskTitle}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onPriorityChange={handlePriorityChange}
                  onDueDateChange={handleDueDateChange}
                  settings={settings}
                  isPreview={isPreview}
                />
              ))}
            </motion.ul>
          </AnimatePresence>
        )}

        {settings.maxVisible > 0 && filteredTasks.length > settings.maxVisible && (
          <div className="mt-4 text-center">
            <button className="btn-ghost text-body-sm" onClick={() => handleSettingsChange({ maxVisible: 0 })}>
              Show {filteredTasks.length - settings.maxVisible} more tasks
            </button>
          </div>
        )}
      </div>

      <TodoSettingsPanel
        config={config}
        settings={settings}
        onChange={handleSettingsChange}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        filter={filter}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />
    </div>
  );
}

function TaskItem({
  task,
  index,
  isEditing,
  editingTitle,
  onEditTitle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  onPriorityChange,
  onDueDateChange,
  settings,
  isPreview,
}: {
  task: Task;
  index: number;
  isEditing: boolean;
  editingTitle: string;
  onEditTitle: (title: string) => void;
  onStartEdit: (task: Task) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onPriorityChange: (task: Task, priority: TaskPriority) => void;
  onDueDateChange: (task: Task, date: string) => void;
  settings: TodoWidgetSettings;
  isPreview: boolean;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSaveEdit();
    if (e.key === 'Escape') onCancelEdit();
  };

  return (
    <motion.li
      layout
      className={cn(
        'group relative bg-surface border border-border rounded-lg overflow-hidden transition-all',
        task.completed && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task)}
          className="w-5 h-5 accent-primary flex-shrink-0 mt-0.5"
          disabled={isPreview}
        />

        {isEditing ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onSaveEdit}
            autoFocus
            className="flex-1 input bg-transparent border-none p-0 text-text focus-visible:ring-0"
          />
        ) : (
          <span
            onDoubleClick={() => onStartEdit(task)}
            className={cn(
              'flex-1 text-text break-words cursor-text transition-colors',
              task.completed && 'line-through text-text-muted'
            )}
          >
            {task.title}
          </span>
        )}

        {settings.showPriority && (
          <select
            value={task.priority}
            onChange={(e) => onPriorityChange(task, e.target.value as TaskPriority)}
            className={cn(
              'px-2 py-1 text-body-xs rounded border border-border bg-surface text-text',
              PRIORITY_COLORS[task.priority]
            )}
            disabled={isPreview}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        )}

        {settings.showDueDate && task.dueDate && (
          <span className="px-2 py-1 text-body-xs text-text-muted bg-surface/50 rounded">
            <Calendar className="w-3 h-3 inline mr-1" />
            {formatDate(new Date(task.dueDate), { month: 'short', day: 'numeric' })}
          </span>
        )}

        {!isPreview && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onStartEdit(task)}
              className="btn-icon p-1.5 text-text-muted hover:text-text"
              aria-label="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="btn-icon p-1.5 text-error hover:bg-error/10"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.li>
  );
}

function TodoSettingsPanel({
  config,
  settings,
  onChange,
  isOpen,
  onClose,
  filter,
  onFilterChange,
  sortBy,
  sortDirection,
  onSortChange,
}: {
  config: import('../../types').WidgetConfig;
  settings: TodoWidgetSettings;
  onChange: (settings: Partial<TodoWidgetSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
  filter: 'all' | 'active' | 'completed';
  onFilterChange: (filter: 'all' | 'active' | 'completed') => void;
  sortBy: 'order' | 'priority' | 'dueDate' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: 'order' | 'priority' | 'dueDate' | 'createdAt') => void;
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
          <h3 className="text-heading-md font-semibold text-text">Task Settings</h3>
          <button onClick={onClose} className="btn-icon p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Filter</label>
            <div className="flex gap-2">
              {['all', 'active', 'completed'].map((f) => (
                <button
                  key={f}
                  onClick={() => onFilterChange(f as 'all' | 'active' | 'completed')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    filter === f
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Sort By</label>
            <div className="flex gap-2">
              {['order', 'priority', 'dueDate', 'createdAt'].map((s) => (
                <button
                  key={s}
                  onClick={() => onSortChange(s as 'order' | 'priority' | 'dueDate' | 'createdAt')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    sortBy === s
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {s === 'order' ? 'Manual' : s === 'priority' ? 'Priority' : s === 'dueDate' ? 'Due Date' : 'Created'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCompleted}
                onChange={(e) => onChange({ showCompleted: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show completed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showPriority}
                onChange={(e) => onChange({ showPriority: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show priority</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showDueDate}
                onChange={(e) => onChange({ showDueDate: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-body-sm text-text">Show due date</span>
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
