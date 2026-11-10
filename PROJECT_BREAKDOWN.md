# Project Breakdown: Nebula Browser Extension

## Overview
A production-quality browser extension that transforms the New Tab page into a customizable personal productivity workspace with multiple workspaces, widget system, advanced theming, and local-first storage.

---

## Phase 1: Foundation & Architecture (Week 1)

### 1.1 Project Initialization
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS with custom design tokens
- [ ] Set up ESLint, Prettier, TypeScript strict mode
- [ ] Configure path aliases (@/, @components/, @features/, etc.)
- [ ] Set up build scripts for development and production

### 1.2 Manifest V3 Configuration
- [ ] Create `public/manifest.json` with:
  - `chrome_url_overrides` for New Tab page
  - `background.service_worker` for service worker
  - `permissions`: storage, tabs, commands
  - `host_permissions`: for search suggestions (optional)
  - `icons`: 16, 32, 48, 128px
  - `commands`: keyboard shortcuts
- [ ] Configure Vite to output to `dist/` with correct manifest handling

### 1.3 Core Project Structure
```
src/
├── background/
│   └── service-worker.ts
├── newtab/
│   └── App.tsx
├── components/
│   ├── ui/           # Base UI components (Button, Input, Modal, etc.)
│   ├── layout/       # Layout components (Header, Footer, Grid, etc.)
│   ├── widgets/      # Widget wrapper components
│   ├── modals/       # Modal components
│   ├── settings/     # Settings panel components
│   └── workspace/    # Workspace-specific components
├── features/
│   ├── dashboard/
│   ├── workspaces/
│   ├── collections/
│   ├── tasks/
│   ├── wallpapers/
│   ├── themes/
│   ├── search/
│   └── storage/
├── widgets/
│   ├── registry.ts
│   ├── definitions/
│   ├── components/
│   └── schemas/
├── themes/
│   ├── registry.ts
│   ├── nebula/
│   ├── paper/
│   ├── terminal/
│   ├── glass/
│   ├── retro/
│   └── brutalist/
├── stores/
│   ├── workspace.store.ts
│   ├── dashboard.store.ts
│   ├── settings.store.ts
│   └── task.store.ts
├── services/
│   ├── storage/
│   ├── browser/
│   └── import-export/
├── hooks/
├── types/
├── utils/
└── styles/
public/
├── manifest.json
└── icons/
```

### 1.4 Core Type Definitions
- [ ] Widget types, configurations, registry types
- [ ] Workspace types
- [ ] Theme types and design tokens
- [ ] Settings types
- [ ] Storage types
- [ ] Collection and shortcut types
- [ ] Task types

---

## Phase 2: Core Infrastructure (Week 1-2)

### 2.1 Storage Abstraction Layer
- [ ] `StorageService` class with:
  - `chrome.storage.local` wrapper
  - `chrome.storage.sync` wrapper
  - IndexedDB wrapper for large assets
  - Auto-save with debouncing
  - Versioned schema with migration support
  - Error handling and fallbacks

### 2.2 Zustand Stores
- [ ] `workspaceStore` - Current workspace, workspace list, CRUD operations
- [ ] `dashboardStore` - Widget layouts, edit mode, widget visibility
- [ ] `settingsStore` - Global settings, theme, appearance
- [ ] `taskStore` - Tasks with CRUD, filtering, persistence

### 2.3 Theme Engine (6 Themes)
- [ ] Centralized CSS variable system (`:root` and `[data-theme="..."]`)
- [ ] Theme registry with metadata
- [ ] Theme application logic (document.documentElement attributes)
- [ ] **NEBULA**: Deep navy/purple, cyan/violet accents, glows, gradients
- [ ] **PAPER**: Warm ivory/cream, elegant typography, newspaper layout
- [ ] **TERMINAL**: Deep black, green/amber, monospace, scanlines
- [ ] **GLASS**: Glassmorphism, blur, translucent cards, light/dark variants
- [ ] **RETRO**: Warm brown/orange/beige, pixel details, vintage typography
- [ ] **BRUTALIST**: High contrast, bold typography, sharp geometry
- [ ] Per-workspace theme selection
- [ ] Dark/Light/AMOLED variants where applicable

---

## Phase 3: Widget System (Week 2-3)

### 3.1 Widget Registry Architecture
- [ ] `WidgetRegistry` class for registration and discovery
- [ ] Base `WidgetDefinition` interface
- [ ] Widget configuration schemas (Zod or JSON Schema)
- [ ] Default widget metadata (size, min/max, category)

### 3.2 Core Widgets Implementation
1. **Clock** - Digital/analog, 12/24hr, seconds, timezones
2. **Date** - Current date, weekday, format options
3. **Greeting** - Time-based, customizable name/message
4. **Web Search** - Multi-engine, suggestions, keyboard shortcut
5. **Daily Quote** - Random, refresh, favorites, custom quotes
6. **Todo List** - Add/complete/edit/delete, priority, due dates
7. **Collections** - Category management, shortcuts, expand/collapse
8. **Quick Links** - Favicon, custom names, drag reorder, new tab option
9. **Weather** - Setup state, API integration placeholder
10. **Calendar** - Setup state, integration placeholder
11. **Pomodoro Timer** - Work/break cycles, persistence
12. **World Clock** - Multiple timezones
13. **Focus Timer** - Custom duration, sessions
14. **Productivity Stats** - Local metrics
15. **Bookmarks** - Browser bookmarks integration
16. **Recent Sites** - History integration (local only)
17. **Notes** - Rich text, persistence
18. **Custom Text** - Markdown support
19. **Daily Focus Goals** - Goal setting, tracking
20. **Countdown Timer** - Target date, formats

### 3.3 Widget Components
- [ ] Base `WidgetWrapper` with edit controls
- [ ] Widget settings modals
- [ ] Loading, empty, error states
- [ ] Responsive sizing

---

## Phase 4: Dashboard & Interactions (Week 3)

### 4.1 Drag, Drop & Resize
- [ ] `react-grid-layout` integration
- [ ] Grid configuration (columns, row height, breakpoints)
- [ ] Widget drag handles
- [ ] Resize handles (corners/edges)
- [ ] Grid alignment visualization
- [ ] Overlap prevention
- [ ] Responsive layouts (desktop/tablet/mobile)

### 4.2 Dashboard Editing Mode
- [ ] Customize mode toggle
- [ ] Widget boundary highlights
- [ ] Management controls (settings, hide, delete)
- [ ] Add Widget modal with searchable categories
- [ ] Add Collection button
- [ ] Done Editing persistence
- [ ] Prevent accidental drag on interactive elements

### 4.3 Main Dashboard Components
- [ ] Header (logo, workspace switcher, customize, settings, more menu)
- [ ] Clock widget
- [ ] Greeting widget
- [ ] Search widget
- [ ] Daily Quote widget
- [ ] Quick Shortcuts / Collections
- [ ] Today's Tasks widget
- [ ] Footer/Status bar

---

## Phase 5: Workspaces (Week 3-4)

### 5.1 Workspace Management
- [ ] Workspace CRUD (create, rename, duplicate, delete)
- [ ] Workspace switcher dropdown
- [ ] Set default workspace
- [ ] Workspace-specific data isolation
- [ ] Instant switching without reload

### 5.2 Workspace Persistence
- [ ] Per-workspace widget layouts
- [ ] Per-workspace widget configurations
- [ ] Per-workspace collections/shortcuts
- [ ] Per-workspace theme selection
- [ ] Per-workspace wallpaper
- [ ] Export/Import individual workspaces
- [ ] Backup/restore all workspaces

---

## Phase 6: Wallpapers & Settings (Week 4)

### 6.1 Wallpaper System
- [ ] IndexedDB storage for images/videos
- [ ] Built-in gallery with previews
- [ ] Local upload (drag-drop, file picker)
- [ ] Gradient backgrounds
- [ ] Random selection
- [ ] Brightness, blur, overlay controls
- [ ] Card transparency/blur
- [ ] Background positioning
- [ ] Auto-rotation with interval
- [ ] Video support (muted, loop, playsinline)
- [ ] Reduced motion respect

### 6.2 Settings Panel
- [ ] Appearance (dark/light/amoled, accent, transparency, blur, radius, typography)
- [ ] Themes (gallery, preview, custom themes)
- [ ] Wallpapers (gallery, upload, settings)
- [ ] Layout (spacing, grid, alignment, default sizes)
- [ ] Search & Time (engine, clock style, format, timezones)
- [ ] Hidden Elements (restore widgets, collections)
- [ ] Keyboard Shortcuts (display, configure)
- [ ] Your Data (export, import, reset, clear)

---

## Phase 7: Polish & Integration (Week 4-5)

### 7.1 Keyboard Shortcuts
- [ ] `Ctrl/Cmd + K` - Open search
- [ ] `Ctrl/Cmd + E` - Enter edit mode
- [ ] `Ctrl/Cmd + Shift + W` - Workspace switcher
- [ ] `Escape` - Close modal/panel
- [ ] `Enter` - Execute search
- [ ] Chrome Commands API registration

### 7.2 Import/Export
- [ ] JSON export (single workspace / all workspaces)
- [ ] JSON import with validation
- [ ] Backup versioning
- [ ] Corrupt backup handling
- [ ] Migration support

### 7.3 Background Service Worker
- [ ] Extension lifecycle events
- [ ] Command handling
- [ ] Storage sync (if needed)
- [ ] Context menus (optional)

### 7.4 Extension Assets
- [ ] Icons (16, 32, 48, 128px)
- [ ] Screenshots for store
- [ ] Promotional assets

---

## Phase 8: Testing & Release (Week 5)

### 8.1 Testing Checklist
- [ ] Extension builds without errors
- [ ] Installs in Chrome (developer mode)
- [ ] Works as New Tab override
- [ ] Works in Microsoft Edge
- [ ] All 6 themes functional and persistent
- [ ] Widget add/remove/configure works
- [ ] Drag and resize functional
- [ ] Multiple workspaces independent
- [ ] Workspace switching preserves state
- [ ] Shortcuts CRUD works
- [ ] Collections functional
- [ ] Tasks persist
- [ ] Wallpaper uploads persist
- [ ] Import/Export works
- [ ] Settings persist
- [ ] Keyboard shortcuts work
- [ ] No critical console errors
- [ ] Responsive at different screen sizes
- [ ] Works offline for local features

### 8.2 Documentation
- [ ] README.md
- [ ] Architecture documentation
- [ ] Feature documentation
- [ ] Permissions explanation
- [ ] Installation instructions
- [ ] Build commands
- [ ] Testing results summary

---

## Technology Stack Summary

| Category | Technology |
|----------|------------|
| Build | Vite 5+ |
| Framework | React 18+ |
| Language | TypeScript 5+ (strict) |
| Styling | Tailwind CSS 3+ |
| State | Zustand 4+ |
| Animation | Framer Motion 11+ |
| Icons | Lucide React |
| Grid Layout | react-grid-layout 1.4+ |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| Validation | Zod 3+ |
| Storage | chrome.storage + IndexedDB (idb) |

---

## Key Architecture Decisions

1. **Feature-based modular architecture** - Each feature self-contained
2. **Registry pattern** - Widgets and themes extensible without core changes
3. **Storage abstraction** - Chrome APIs behind service layer
4. **CSS Variables for theming** - No theme-specific CSS in components
5. **Zustand for state** - Simple, performant, TypeScript-friendly
6. **Local-first** - No backend, all data in browser storage
7. **Manifest V3** - Service worker, modern APIs only

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Storage quota exceeded | Implement quota monitoring, cleanup utilities |
| Theme CSS conflicts | Strict CSS variable scoping, no global leaks |
| Widget performance | Lazy loading, memoization, virtualization |
| Manifest V3 limitations | Service worker for background, minimal permissions |
| Cross-browser differences | Browser API abstraction layer |

---

## Success Criteria

- ✅ Production-ready extension installable in Chrome/Edge
- ✅ All 6 themes visually distinct and functional
- ✅ Widget system extensible (registry-based)
- ✅ Workspaces fully isolated and switchable
- ✅ Drag/resize smooth and bug-free
- ✅ Settings comprehensive and persistent
- ✅ Import/Export reliable with validation
- ✅ Keyboard shortcuts registered and working
- ✅ Zero critical bugs, clean console
- ✅ Works offline (except search/weather)