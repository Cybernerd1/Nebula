import { z } from 'zod';

export const baseWidgetSchema = z.object({
  compactMode: z.boolean().default(false),
});

export const clockWidgetSchema = baseWidgetSchema.extend({
  style: z.enum(['digital', 'analog']).default('digital'),
  format: z.enum(['12h', '24h']).default('24h'),
  showSeconds: z.boolean().default(false),
  fontSize: z.number().min(12).max(120).default(48),
  showDate: z.boolean().default(true),
  showWeekday: z.boolean().default(true),
  timeZones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    zone: z.string(),
    enabled: z.boolean(),
  })).default([]),
});

export const greetingWidgetSchema = baseWidgetSchema.extend({
  displayName: z.string().default(''),
  customGreeting: z.string().default(''),
  showTimeBasedGreeting: z.boolean().default(true),
  fontSize: z.number().min(12).max(72).default(32),
});

export const searchWidgetSchema = baseWidgetSchema.extend({
  engine: z.string().default('google'),
  showSuggestions: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  placeholder: z.string().default('Search the web...'),
  width: z.number().min(200).max(800).default(400),
  position: z.enum(['center', 'left', 'right']).default('center'),
});

export const quoteWidgetSchema = baseWidgetSchema.extend({
  source: z.enum(['api', 'custom']).default('api'),
  customQuotes: z.array(z.object({
    id: z.string(),
    text: z.string(),
    author: z.string(),
    favorite: z.boolean(),
    source: z.literal('custom'),
    createdAt: z.number(),
  })).default([]),
  autoRefresh: z.boolean().default(false),
  refreshInterval: z.number().min(60).max(86400).default(86400),
  showAuthor: z.boolean().default(true),
  fontSize: z.number().min(12).max(36).default(18),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
});

export const todoWidgetSchema = baseWidgetSchema.extend({
  showCompleted: z.boolean().default(true),
  showPriority: z.boolean().default(true),
  showDueDate: z.boolean().default(true),
  sortBy: z.enum(['order', 'priority', 'dueDate', 'createdAt']).default('order'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
  groupByPriority: z.boolean().default(false),
  maxVisible: z.number().min(0).max(50).default(0),
});

export const collectionsWidgetSchema = baseWidgetSchema.extend({
  showAll: z.boolean().default(false),
  maxVisiblePerCollection: z.number().min(1).max(20).default(6),
  showEmptyCollections: z.boolean().default(false),
  defaultExpanded: z.boolean().default(true),
  showIcons: z.boolean().default(true),
  showNames: z.boolean().default(true),
  showLinkCount: z.boolean().default(true),
});

export const quickLinksWidgetSchema = baseWidgetSchema.extend({
  showIcons: z.boolean().default(true),
  showNames: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
  iconSize: z.number().min(16).max(64).default(32),
  layout: z.enum(['grid', 'list', 'carousel']).default('grid'),
  columns: z.number().min(1).max(10).default(6),
  gap: z.number().min(0).max(32).default(12),
  borderRadius: z.number().min(0).max(16).default(8),
  showAll: z.boolean().default(false),
  maxVisible: z.number().min(0).max(50).default(0),
});

export const weatherWidgetSchema = baseWidgetSchema.extend({
  apiKey: z.string().default(''),
  location: z.string().default(''),
  units: z.enum(['metric', 'imperial']).default('metric'),
  showForecast: z.boolean().default(true),
  forecastDays: z.number().min(1).max(7).default(3),
  updateInterval: z.number().min(300).max(3600).default(1800),
});

export const pomodoroWidgetSchema = baseWidgetSchema.extend({
  workDuration: z.number().min(1).max(120).default(25),
  breakDuration: z.number().min(1).max(60).default(5),
  longBreakDuration: z.number().min(1).max(120).default(15),
  sessionsBeforeLongBreak: z.number().min(1).max(10).default(4),
  autoStartBreaks: z.boolean().default(false),
  autoStartWork: z.boolean().default(false),
  soundEnabled: z.boolean().default(true),
  notificationsEnabled: z.boolean().default(true),
});

export const worldClockWidgetSchema = baseWidgetSchema.extend({
  timeZones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    zone: z.string(),
    enabled: z.boolean(),
  })).default([]),
  format: z.enum(['12h', '24h']).default('24h'),
  showDate: z.boolean().default(true),
});

export const focusTimerWidgetSchema = baseWidgetSchema.extend({
  defaultDuration: z.number().min(1).max(480).default(30),
  presetDurations: z.array(z.number()).default([5, 10, 15, 20, 25, 30, 45, 60]),
  soundEnabled: z.boolean().default(true),
  notificationsEnabled: z.boolean().default(true),
  autoStart: z.boolean().default(false),
});

export const countdownWidgetSchema = baseWidgetSchema.extend({
  targetDate: z.number().default(0),
  targetTime: z.string().default(''),
  title: z.string().default('Countdown'),
  showDays: z.boolean().default(true),
  showHours: z.boolean().default(true),
  showMinutes: z.boolean().default(true),
  showSeconds: z.boolean().default(true),
  onComplete: z.enum(['stop', 'repeat', 'hide']).default('stop'),
});

export const notesWidgetSchema = baseWidgetSchema.extend({
  defaultContent: z.string().default(''),
  autoSave: z.boolean().default(true),
  saveDelay: z.number().min(100).max(5000).default(1000),
  showToolbar: z.boolean().default(true),
  showWordCount: z.boolean().default(false),
  fontSize: z.number().min(12).max(24).default(14),
  fontFamily: z.string().default('inherit'),
});

export const customTextWidgetSchema = baseWidgetSchema.extend({
  content: z.string().default(''),
  format: z.enum(['plain', 'markdown', 'html']).default('markdown'),
  fontSize: z.number().min(12).max(48).default(16),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  lineHeight: z.number().min(1).max(3).default(1.6),
  color: z.string().default(''),
  backgroundColor: z.string().default(''),
  padding: z.number().min(0).max(32).default(16),
});

export const dailyFocusWidgetSchema = baseWidgetSchema.extend({
  goals: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
  })).default([]),
  maxGoals: z.number().min(1).max(10).default(3),
  showProgress: z.boolean().default(true),
  resetTime: z.string().default('00:00'),
  notificationsEnabled: z.boolean().default(true),
});

export const productivityStatsWidgetSchema = baseWidgetSchema.extend({
  showTasksCompleted: z.boolean().default(true),
  showFocusTime: z.boolean().default(true),
  showPomodoroCount: z.boolean().default(true),
  showStreak: z.boolean().default(true),
  period: z.enum(['day', 'week', 'month', 'year']).default('week'),
  chartType: z.enum(['bar', 'line', 'area']).default('bar'),
});

export type ClockWidgetSettings = z.infer<typeof clockWidgetSchema>;
export type GreetingWidgetSettings = z.infer<typeof greetingWidgetSchema>;
export type SearchWidgetSettings = z.infer<typeof searchWidgetSchema>;
export type QuoteWidgetSettings = z.infer<typeof quoteWidgetSchema>;
export type TodoWidgetSettings = z.infer<typeof todoWidgetSchema>;
export type CollectionsWidgetSettings = z.infer<typeof collectionsWidgetSchema>;
export type QuickLinksWidgetSettings = z.infer<typeof quickLinksWidgetSchema>;
export type WeatherWidgetSettings = z.infer<typeof weatherWidgetSchema>;
export type PomodoroWidgetSettings = z.infer<typeof pomodoroWidgetSchema>;
export type WorldClockWidgetSettings = z.infer<typeof worldClockWidgetSchema>;
export type FocusTimerWidgetSettings = z.infer<typeof focusTimerWidgetSchema>;
export type CountdownWidgetSettings = z.infer<typeof countdownWidgetSchema>;
export type NotesWidgetSettings = z.infer<typeof notesWidgetSchema>;
export type CustomTextWidgetSettings = z.infer<typeof customTextWidgetSchema>;
export type DailyFocusWidgetSettings = z.infer<typeof dailyFocusWidgetSchema>;
export type ProductivityStatsWidgetSettings = z.infer<typeof productivityStatsWidgetSchema>;