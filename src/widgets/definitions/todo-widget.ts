import type { WidgetDefinition } from '../../types';
import { z } from 'zod';
import { CheckSquare } from 'lucide-react';
import { TodoWidget } from '../components/TodoWidget';
import { todoWidgetSchema, type TodoWidgetSettings } from '../schemas';

export const todoWidgetDefinition: WidgetDefinition = {
  id: 'todo',
  type: 'todo',
  name: 'Today\'s Tasks',
  description: 'Manage daily tasks with priorities and due dates',
  category: 'productivity',
  icon: 'CheckSquare',
  defaultSize: { w: 4, h: 6 },
  minSize: { w: 3, h: 4 },
  maxSize: { w: 8, h: 12 },
  defaultSettings: {
    showCompleted: true,
    showPriority: true,
    showDueDate: true,
    sortBy: 'order',
    sortDirection: 'asc',
    groupByPriority: false,
    compactMode: false,
    maxVisible: 0,
  } satisfies TodoWidgetSettings,
  settingsSchema: todoWidgetSchema,
  component: TodoWidget,
  canDuplicate: false,
  canResize: true,
  canConfigure: true,
};