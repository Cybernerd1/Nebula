# Nebula - Personal Productivity New Tab Extension

A production-quality browser extension (Manifest V3) that transforms the New Tab page into a customizable personal productivity workspace with multiple workspaces, widget system, advanced theming, drag-and-drop layout, and local-first storage.

## Features

- **Multiple Workspaces**: Create and switch between different dashboard layouts (Work, Personal, Study, etc.)
- **Widget System**: 20 built-in widgets including Clock, Weather, Pomodoro, Todo, Notes, and more
- **6 Themes**: Nebula, Paper, Terminal, Glass, Retro, Brutalist — each with unique visual identity
- **Drag-and-Drop Layout**: Responsive grid layout with react-grid-layout
- **Wallpapers**: Built-in gradients, image uploads to IndexedDB, video support
- **Keyboard Shortcuts**: Customizable shortcuts for all major actions
- **Import/Export**: Full backup and restore of settings and workspaces
- **Local-First Storage**: chrome.storage.local + IndexedDB (no backend required)
- **TypeScript**: Strict typing throughout with Zod schema validation

## Installation

### Development

```bash
# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

### Chrome/Edge Installation

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

## Architecture

```
src/
├── background/          # Service worker (Manifest V3)
├── components/          # React components
│   ├── modals/         # Modal dialogs (AddWidget, etc.)
│   ├── settings/       # Settings drawer sections
│   └── workspace/      # Workspace switcher
├── newtab/             # Main new tab page entry
├── services/           # Storage abstraction layer
├── stores/             # Zustand state stores
├── types/              # TypeScript definitions
├── utils/              # Helper functions
└── widgets/            # Widget system
    ├── components/     # Widget React components
    ├── definitions/    # Widget definitions & metadata
    ├── registry/       # Widget registry
    └── schemas/        # Zod validation schemas
```

### State Management

- **workspace.store.ts**: Workspaces, widgets, layouts, wallpapers
- **dashboard.store.ts**: Active layout, widget registry sync
- **settings.store.ts**: Global settings (themes, appearance, shortcuts, data)
- **task.store.ts**: Task management (shared across workspaces)

### Storage

- `chrome.storage.local`: Settings, workspaces, tasks
- `IndexedDB` (via idb): Wallpaper images, large blobs

## Widget Development

### Creating a New Widget

1. **Define schema** in `src/widgets/schemas/index.ts`:
```typescript
export const myWidgetSchema = baseWidgetSchema.extend({
  mySetting: z.string().default('default'),
});
export type MyWidgetSettings = z.infer<typeof myWidgetSchema>;
```

2. **Create definition** in `src/widgets/definitions/my-widget.ts`:
```typescript
export const myWidgetDefinition: WidgetDefinition = {
  id: 'myWidget',
  type: 'myWidget',
  name: 'My Widget',
  description: 'Description',
  category: 'productivity',
  icon: 'IconName',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 8, h: 6 },
  defaultSettings: { mySetting: 'default', compactMode: false } satisfies MyWidgetSettings,
  settingsSchema: myWidgetSchema,
  component: MyWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};
```

3. **Create component** in `src/widgets/components/MyWidget.tsx`:
```typescript
export function MyWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as MyWidgetSettings;
  // Component implementation
}
```

4. **Register** in `src/widgets/index.ts`:
```typescript
import { myWidgetDefinition } from './definitions/my-widget';
registerWidget(myWidgetDefinition);
```

### Widget Props

All widgets receive:
```typescript
interface WidgetProps {
  config: WidgetConfig;                    // Widget instance config
  onConfigChange: (settings: Partial<Settings>) => void;
  onRemove: () => void;
  onHide?: () => void;
  isEditing?: boolean;
  isPreview?: boolean;
}
```

## Theming

Themes are defined in `src/styles/index.css` using CSS custom properties and Tailwind v4's `@theme` directive.

### Adding a Custom Theme

1. Add theme tokens in `src/styles/index.css`:
```css
@theme {
  --color-theme-custom-bg: #yourcolor;
  --color-theme-custom-surface: #yourcolor;
  /* ... */
}
```

2. Register in settings store or via Settings UI.

## Keyboard Shortcuts

Default shortcuts (customizable in Settings → Shortcuts):

| Action | Default |
|--------|---------|
| Open Search | `Ctrl+K` |
| Toggle Edit Mode | `Ctrl+E` |
| Workspace Switcher | `Ctrl+Shift+W` |
| Open Settings | `Ctrl+,` |
| Add Widget | `Ctrl+Shift+A` |
| Command Palette | `Ctrl+Shift+P` |

## Data Management

### Export Options
- **Settings Only**: JSON with all global settings
- **Current Workspace**: Single workspace with widgets/layout
- **All Workspaces**: All workspaces + active ID
- **Full Backup**: Settings + workspaces + metadata

### Import
Drag and drop JSON files or use the import buttons. Validation via Zod schemas.

## Scripts

```bash
npm run dev          # Development server with HMR
npm run build        # Production build (TypeScript + Vite)
npm run preview      # Preview production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check only
```

## Browser Support

- Chrome 88+ (Manifest V3)
- Edge 88+ (Manifest V3)
- Firefox: Not yet supported (different extension API)

## License

MIT