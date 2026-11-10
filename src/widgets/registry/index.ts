import type { WidgetDefinition, WidgetCategory } from '../../types';
import { z } from 'zod';

export interface RegisteredWidget {
  definition: WidgetDefinition;
  configSchema: z.ZodSchema;
}

class WidgetRegistry {
  private widgets: Map<string, RegisteredWidget> = new Map();
  private categories: Map<WidgetCategory, string[]> = new Map();

  register(definition: WidgetDefinition): void {
    if (this.widgets.has(definition.type)) {
      console.warn(`Widget type "${definition.type}" is already registered. Overwriting.`);
    }

    this.widgets.set(definition.type, {
      definition,
      configSchema: definition.settingsSchema,
    });

    if (!this.categories.has(definition.category)) {
      this.categories.set(definition.category, []);
    }
    this.categories.get(definition.category)!.push(definition.type);
  }

  unregister(type: string): boolean {
    const widget = this.widgets.get(type);
    if (!widget) return false;

    this.widgets.delete(type);
    const category = this.categories.get(widget.definition.category);
    if (category) {
      const index = category.indexOf(type);
      if (index !== -1) category.splice(index, 1);
    }
    return true;
  }

  get(type: string): WidgetDefinition | undefined {
    return this.widgets.get(type)?.definition;
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values()).map((w) => w.definition);
  }

  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    const types = this.categories.get(category) || [];
    return types.map((type) => this.widgets.get(type)!.definition).filter(Boolean);
  }

  getCategories(): WidgetCategory[] {
    return Array.from(this.categories.keys());
  }

  validateConfig(type: string, config: unknown): { success: boolean; data?: unknown; error?: z.ZodError } {
    const widget = this.widgets.get(type);
    if (!widget) {
      return { success: false, error: new z.ZodError([]) };
    }

    const result = widget.configSchema.safeParse(config);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, error: result.error };
  }

  getDefaultSettings(type: string): Record<string, unknown> | undefined {
    return this.widgets.get(type)?.definition.defaultSettings;
  }
}

export const widgetRegistry = new WidgetRegistry();

export function registerWidget(definition: WidgetDefinition): void {
  widgetRegistry.register(definition);
}

export function getWidget(type: string): WidgetDefinition | undefined {
  return widgetRegistry.get(type);
}

export function getAllWidgets(): WidgetDefinition[] {
  return widgetRegistry.getAll();
}

export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return widgetRegistry.getByCategory(category);
}

export function getWidgetCategories(): WidgetCategory[] {
  return widgetRegistry.getCategories();
}