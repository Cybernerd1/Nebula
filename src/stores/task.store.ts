import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, TaskPriority } from '../types';
import { generateId } from '../utils/helpers';
import { useWorkspaceStore } from './workspace.store';

interface TaskState {
  tasks: Task[];
  filter: 'all' | 'active' | 'completed';
  sortBy: 'order' | 'priority' | 'dueDate' | 'createdAt';
  sortDirection: 'asc' | 'desc';

  initialize: (workspaceId: string) => Promise<void>;
  addTask: (title: string, options?: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  clearCompleted: () => Promise<void>;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  setSort: (sortBy: 'order' | 'priority' | 'dueDate' | 'createdAt', direction?: 'asc' | 'desc') => void;
  getFilteredTasks: () => Task[];
  getTaskStats: () => { total: number; completed: number; active: number };
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filter: 'all',
      sortBy: 'order',
      sortDirection: 'asc',

      initialize: async (workspaceId) => {
        const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === workspaceId);
        if (workspace) {
          set({ tasks: workspace.tasks });
        }
      },

      addTask: async (title, options = {}) => {
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        if (!activeWorkspaceId) throw new Error('No active workspace');

        const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
        if (!workspace) throw new Error('Workspace not found');

        const maxOrder = Math.max(0, ...workspace.tasks.map((t) => t.order));
        
        const task: Task = {
          id: generateId('task'),
          title,
          completed: false,
          priority: options.priority || 'medium',
          dueDate: options.dueDate,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          order: maxOrder + 1,
        };

        const updatedTasks = [...workspace.tasks, task];
        
        useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, { tasks: updatedTasks });
        set({ tasks: updatedTasks });
        
        return task;
      },

      updateTask: async (id, updates) => {
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        if (!activeWorkspaceId) return;

        const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
        if (!workspace) return;

        const updatedTasks = workspace.tasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt: Date.now() } : task
        );

        useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, { tasks: updatedTasks });
        set({ tasks: updatedTasks });
      },

      deleteTask: async (id) => {
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        if (!activeWorkspaceId) return;

        const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
        if (!workspace) return;

        const updatedTasks = workspace.tasks.filter((task) => task.id !== id);

        useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, { tasks: updatedTasks });
        set({ tasks: updatedTasks });
      },

      toggleTask: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (task) {
          await get().updateTask(id, { completed: !task.completed });
        }
      },

      reorderTasks: async (taskIds) => {
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        if (!activeWorkspaceId) return;

        const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
        if (!workspace) return;

        const taskMap = new Map(workspace.tasks.map((t) => [t.id, t]));
        const updatedTasks = taskIds.map((id, index) => ({
          ...taskMap.get(id)!,
          order: index,
        }));

        useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, { tasks: updatedTasks });
        set({ tasks: updatedTasks });
      },

      clearCompleted: async () => {
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        if (!activeWorkspaceId) return;

        const workspace = useWorkspaceStore.getState().workspaces.find((ws) => ws.id === activeWorkspaceId);
        if (!workspace) return;

        const updatedTasks = workspace.tasks.filter((task) => !task.completed);

        useWorkspaceStore.getState().updateWorkspace(activeWorkspaceId, { tasks: updatedTasks });
        set({ tasks: updatedTasks });
      },

      setFilter: (filter) => set({ filter }),

      setSort: (sortBy, direction = 'asc') => set({ sortBy, sortDirection: direction }),

      getFilteredTasks: () => {
        const { tasks, filter, sortBy, sortDirection } = get();
        
        let filtered = tasks.filter((task) => {
          if (filter === 'active') return !task.completed;
          if (filter === 'completed') return task.completed;
          return true;
        });

        filtered.sort((a, b) => {
          let aVal: string | number = '';
          let bVal: string | number = '';

          if (sortBy === 'priority') {
            aVal = PRIORITY_ORDER[a.priority];
            bVal = PRIORITY_ORDER[b.priority];
          } else {
            aVal = a[sortBy] as string | number;
            bVal = b[sortBy] as string | number;
          }

          if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });

        return filtered;
      },

      getTaskStats: () => {
        const { tasks } = get();
        return {
          total: tasks.length,
          completed: tasks.filter((t) => t.completed).length,
          active: tasks.filter((t) => !t.completed).length,
        };
      },
    }),
    {
      name: 'task-store',
      storage: createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: () => ({}),
    }
  )
);