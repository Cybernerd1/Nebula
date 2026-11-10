# Widget Development Guide

This guide covers creating custom widgets for the Nebula extension.

## Quick Start

### 1. Define the Schema

Add to `src/widgets/schemas/index.ts`:

```typescript
export const myWidgetSchema = baseWidgetSchema.extend({
  // Your settings here
  title: z.string().default('My Widget'),
  count: z.number().min(0).max(100).default(5),
  enabled: z.boolean().default(true),
});

export type MyWidgetSettings = z.infer<typeof myWidgetSchema>;
```

The `baseWidgetSchema` automatically includes `compactMode: boolean`.

### 2. Create the Definition

Create `src/widgets/definitions/my-widget.ts`:

```typescript
import type { WidgetDefinition } from '../../types';
import { MyIcon } from 'lucide-react';
import { MyWidget } from '../components/MyWidget';
import { myWidgetSchema, type MyWidgetSettings } from '../schemas';

export const myWidgetDefinition: WidgetDefinition = {
  id: 'myWidget',
  type: 'myWidget',           // Unique identifier
  name: 'My Widget',          // Display name
  description: 'What this widget does',
  category: 'productivity',   // time | productivity | search | information | media | custom
  icon: 'MyIcon',             // Lucide icon name (string)
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 8, h: 6 },
  defaultSettings: {
    title: 'My Widget',
    count: 5,
    enabled: true,
    compactMode: false,
  } satisfies MyWidgetSettings,
  settingsSchema: myWidgetSchema,
  component: MyWidget,        // React component
  canDuplicate: true,         // Allow multiple instances
  canResize: true,            // Allow resizing
  canConfigure: true,         // Show settings button
};
```

### 3. Create the Component

Create `src/widgets/components/MyWidget.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { cn } from '../../utils/helpers';
import { MyIcon, Settings } from 'lucide-react';
import type { WidgetProps } from '../../types';
import type { MyWidgetSettings } from '../schemas';

export function MyWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as MyWidgetSettings;
  const [data, setData] = useState<string>('');

  // Component logic here
  
  return (
    <div className={cn('widget my-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <MyIcon className="w-5 h-5" />
          {settings.title}
        </h3>
        {config.canConfigure && (
          <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 p-4">
        {/* Widget content */}
      </div>
    </div>
  );
}
```

### 4. Register the Widget

Add to `src/widgets/index.ts`:

```typescript
import { myWidgetDefinition } from './definitions/my-widget';

export function initializeWidgetRegistry(): void {
  // ... existing registrations
  registerWidget(myWidgetDefinition);
}
```

## Widget Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `time` | Clocks, calendars, time zones | Clock, Date, World Clock |
| `productivity` | Task management, focus tools | Todo, Pomodoro, Notes |
| `search` | Web search, commands | Search |
| `information` | Weather, quotes, stats | Weather, Quote, Stats |
| `media` | Images, video, audio | (future) |
| `custom` | User-created content | Custom Text |

## Settings Schema Patterns

### Common Patterns

```typescript
// String with default
title: z.string().default('Default Title'),

// Number with range
count: z.number().min(0).max(100).default(10),

// Boolean
enabled: z.boolean().default(true),

// Enum
mode: z.enum(['light', 'dark', 'auto']).default('auto'),

// Array of objects
items: z.array(z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
})).default([]),

// Optional string
apiKey: z.string().default(''),
```

### Base Schema

All widgets inherit from `baseWidgetSchema` which provides:
- `compactMode: z.boolean().default(false)`

## Component Best Practices

### 1. Use the Widget Wrapper Classes

```tsx
<div className={cn('widget my-widget h-full flex flex-col', settings.compactMode && 'compact')}>
  <div className="widget-header flex items-center justify-between p-4">
    {/* Header with title and actions */}
  </div>
  <div className="flex-1 p-4 overflow-auto">
    {/* Main content */}
  </div>
</div>
```

### 2. Handle Configuration

```tsx
const handleSettingChange = (key: string, value: unknown) => {
  onConfigChange({ [key]: value });
};
```

### 3. Use CSS Variables for Theming

```tsx
<div style={{ 
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
}}>
```

### 4. Respect compactMode

```tsx
{!settings.compactMode && (
  <div className="detailed-view">...</div>
)}

{settings.compactMode && (
  <div className="compact-view">...</div>
)}
```

### 5. Handle Editing State

```tsx
// The parent passes isEditing prop
// Use for showing drag handles, edit buttons, etc.
// But widget content should work regardless
```

## Async Data Fetching

```typescript
const [data, setData] = useState<Data | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const response = await fetch('https://api.example.com/data');
    const json = await response.json();
    setData(json);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load');
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, settings.refreshInterval * 1000);
  return () => clearInterval(interval);
}, [fetchData, settings.refreshInterval]);
```

## Icon Usage

Use Lucide React icons (already in dependencies):

```typescript
import { 
  Clock, Calendar, Sun, Moon,  // Time
  CheckSquare, Target, Flag,   // Productivity
  Search, Globe,               // Search
  CloudSun, Quote, BarChart,   // Information
  // ... many more
} from 'lucide-react';

// In component:
<Clock className="w-5 h-5" />
```

## Styling Guidelines

### Colors
- `var(--color-text)` - Primary text
- `var(--color-text-muted)` - Secondary text
- `var(--color-surface)` - Card background
- `var(--color-surface-elevated)` - Elevated cards
- `var(--color-border)` - Borders
- `var(--color-primary)` - Primary accent
- `var(--color-success)` - Success/green
- `var(--color-warning)` - Warning/yellow
- `var(--color-error)` - Error/red
- `var(--color-info)` - Info/blue

### Spacing
- Use Tailwind spacing scale: `p-4`, `gap-2`, `mb-3`, etc.
- Widget header: `p-4`
- Widget content: `p-4`

### Typography
- `text-heading-xl` - Large headings
- `text-heading-lg` - Section headings
- `text-body-md` - Body text
- `text-body-sm` - Small text
- `text-body-xs` - Tiny text
- `font-mono` - Monospace (for numbers, code)

## Testing Your Widget

1. Run `npm run dev`
2. Open the extension in Chrome
3. Click "+" to add widget
4. Find your widget in the category
5. Test: resize, configure, duplicate, remove

## Publishing

Widgets are bundled with the extension. To share a widget:
1. Fork the repository
2. Add your widget
3. Submit a PR

## Example: Complete Minimal Widget

```typescript
// schemas/index.ts
export const helloWidgetSchema = baseWidgetSchema.extend({
  name: z.string().default('World'),
});
export type HelloWidgetSettings = z.infer<typeof helloWidgetSchema>;

// definitions/hello-widget.ts
export const helloWidgetDefinition: WidgetDefinition = {
  id: 'hello',
  type: 'hello',
  name: 'Hello',
  description: 'Says hello',
  category: 'custom',
  icon: 'Smile',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 4 },
  defaultSettings: { name: 'World', compactMode: false } satisfies HelloWidgetSettings,
  settingsSchema: helloWidgetSchema,
  component: HelloWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};

// components/HelloWidget.tsx
export function HelloWidget({ config, onConfigChange }: WidgetProps) {
  const settings = config.settings as HelloWidgetSettings;
  
  return (
    <div className="widget hello-widget h-full flex flex-col items-center justify-center text-center p-4">
      <div className="widget-header flex items-center justify-between p-4 w-full">
        <h3 className="font-semibold text-text">Hello</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <span className="text-2xl font-light">Hello, {settings.name}!</span>
      </div>
    </div>
  );
}
```