import { widgetRegistry, registerWidget, getWidget } from './registry';
import { clockWidgetDefinition } from './definitions/time-widgets';
import { greetingWidgetDefinition } from './definitions/greeting-widget';
import { searchWidgetDefinition } from './definitions/search-widget';
import { quoteWidgetDefinition } from './definitions/quote-widget';
import { todoWidgetDefinition } from './definitions/todo-widget';
import { collectionsWidgetDefinition } from './definitions/collections-widget';
import { quickLinksWidgetDefinition } from './definitions/quicklinks-widget';
import { weatherWidgetDefinition } from './definitions/weather-widget';
import { pomodoroWidgetDefinition } from './definitions/pomodoro-widget';
import { worldClockWidgetDefinition } from './definitions/world-clock-widget';
import { focusTimerWidgetDefinition } from './definitions/focus-timer-widget';
import { countdownWidgetDefinition } from './definitions/countdown-widget';
import { notesWidgetDefinition } from './definitions/notes-widget';
import { customTextWidgetDefinition } from './definitions/custom-text-widget';
import { dailyFocusWidgetDefinition } from './definitions/daily-focus-widget';
import { productivityStatsWidgetDefinition } from './definitions/productivity-stats-widget';

export function initializeWidgetRegistry(): void {
  registerWidget(clockWidgetDefinition);
  registerWidget(greetingWidgetDefinition);
  registerWidget(searchWidgetDefinition);
  registerWidget(quoteWidgetDefinition);
  registerWidget(todoWidgetDefinition);
  registerWidget(collectionsWidgetDefinition);
  registerWidget(quickLinksWidgetDefinition);
  registerWidget(weatherWidgetDefinition);
  registerWidget(pomodoroWidgetDefinition);
  registerWidget(worldClockWidgetDefinition);
  registerWidget(focusTimerWidgetDefinition);
  registerWidget(countdownWidgetDefinition);
  registerWidget(notesWidgetDefinition);
  registerWidget(customTextWidgetDefinition);
  registerWidget(dailyFocusWidgetDefinition);
  registerWidget(productivityStatsWidgetDefinition);
}

export function getRegisteredWidgets() {
  return widgetRegistry.getAll();
}

export function getWidgetsByCategory(category: import('../types').WidgetCategory) {
  return widgetRegistry.getByCategory(category);
}

export function getWidgetCategories() {
  return widgetRegistry.getCategories();
}

export function getWidgetDefinition(type: string) {
  return getWidget(type);
}

export { widgetRegistry };