import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import { Flag, Settings, Plus, Check, Trash2, RotateCcw, Bell, Flag as FlagIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetProps } from '../../types';
import type { DailyFocusWidgetSettings } from '../schemas';

interface DailyFocusGoal {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const PRIORITY_COLORS = {
  low: 'var(--color-success)',
  medium: 'var(--color-warning)',
  high: 'var(--color-error)',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function DailyFocusWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as DailyFocusWidgetSettings;
  const [goals, setGoals] = useState<DailyFocusGoal[]>(settings.goals);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    setGoals(settings.goals);
  }, [settings.goals]);

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    if (goals.length >= settings.maxGoals) return;

    const newGoal: DailyFocusGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      completed: false,
      priority: newGoalPriority,
    };

    setGoals([...goals, newGoal]);
    onConfigChange({ goals: [...goals, newGoal] });
    setNewGoalTitle('');
  };

  const toggleGoal = (id: string) => {
    const updated = goals.map(g =>
      g.id === id ? { ...g, completed: !g.completed } : g
    );
    setGoals(updated);
    onConfigChange({ goals: updated });
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    onConfigChange({ goals: updated });
  };

  const startEditing = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      setNewGoalTitle(goal.title);
      setNewGoalPriority(goal.priority);
      setEditingId(id);
    }
  };

  const saveEdit = () => {
    if (!newGoalTitle.trim()) return;
    const updated = goals.map(g =>
      g.id === editingId ? { ...g, title: newGoalTitle.trim(), priority: newGoalPriority } : g
    );
    setGoals(updated);
    onConfigChange({ goals: updated });
    setEditingId(null);
    setNewGoalTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewGoalTitle('');
  };

  const resetGoals = () => {
    if (confirm('Reset all goals for today?')) {
      setGoals([]);
      onConfigChange({ goals: [] });
    }
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progress = goals.length > 0 ? completedCount / goals.length : 0;

  return (
    <div className={cn('widget daily-focus-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <Flag className="w-5 h-5" />
          Daily Focus
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={resetGoals} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        {goals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted">
            <Flag className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-body-md mb-2">No goals set for today</p>
            <p className="text-body-sm mb-4">Add your first focus goal</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="What's your focus today?"
                className="input text-sm flex-1 max-w-xs"
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              />
              <button onClick={addGoal} className="btn-primary text-sm">Add</button>
            </div>
          </div>
        ) : (
          <>
            {settings.showProgress && goals.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm font-medium text-text">
                    Progress: {completedCount} / {goals.length}
                  </span>
                  <span className="text-body-sm text-text-muted">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    className="h-full bg-primary rounded-full"
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <AnimatePresence mode="popLayout">
                {goals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center gap-3 p-3 bg-surface-elevated rounded-lg border-l-4 transition-colors',
                      goal.completed ? 'opacity-60' : ''
                    )}
                    style={{ borderColor: PRIORITY_COLORS[goal.priority] }}
                  >
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className={cn(
                        'flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all',
                        goal.completed
                          ? 'bg-success border-success text-white'
                          : 'border-border text-text-muted hover:border-primary'
                      )}
                    >
                      {goal.completed && <Check className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'font-medium text-text truncate',
                        goal.completed && 'line-through text-text-muted'
                      )}>
                        {goal.title}
                      </div>
                      <span className={cn(
                        'text-body-xs px-2 py-0.5 rounded-full font-medium',
                        PRIORITY_COLORS[goal.priority]
                      )}>
                        {PRIORITY_LABELS[goal.priority]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {editingId === goal.id ? (
                        <>
                          <input
                            type="text"
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                            className="input text-sm flex-1 max-w-[150px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <select
                            value={newGoalPriority}
                            onChange={(e) => setNewGoalPriority(e.target.value as 'low' | 'medium' | 'high')}
                            className="input text-sm py-1 px-2"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <button onClick={saveEdit} className="p-1.5 hover:bg-surface rounded text-success" title="Save">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 hover:bg-surface rounded" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(goal.id)}
                            className="p-1.5 hover:bg-surface rounded"
                            title="Edit"
                          >
                            <FlagIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="p-1.5 hover:bg-surface rounded text-error"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {goals.length < settings.maxGoals && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-surface-elevated/50 rounded-lg border border-dashed border-border"
                >
                  <Plus className="w-5 h-5 text-text-muted flex-shrink-0" />
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="Add another goal..."
                    className="input text-sm flex-1 bg-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  />
                  <select
                    value={newGoalPriority}
                    onChange={(e) => setNewGoalPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="input text-sm py-1 px-2 w-auto"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button onClick={addGoal} className="btn-primary text-sm">Add</button>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}