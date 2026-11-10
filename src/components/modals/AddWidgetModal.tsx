import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Plus, Clock, Sun, Search as SearchIcon, Quote,
  CheckSquare, Folder, Link, Timer, Target, BarChart2, FileText,
  Layers, CloudSun, Globe, Calendar,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { getWidgetCategories, getRegisteredWidgets } from '../../widgets';
import { useDashboardStore } from '../../stores/dashboard.store';
import type { WidgetCategory } from '../../types';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<WidgetCategory | 'all', string> = {
  all: 'All',
  time: 'Time',
  productivity: 'Productivity',
  search: 'Search',
  information: 'Info',
  media: 'Media',
  custom: 'Custom',
};

const WIDGET_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties; 'aria-hidden'?: boolean }>> = {
  clock: Clock,
  date: Calendar,
  greeting: Sun,
  search: SearchIcon,
  quote: Quote,
  todo: CheckSquare,
  collections: Folder,
  quicklinks: Link,
  weather: CloudSun,
  pomodoro: Timer,
  worldClock: Globe,
  focusTimer: Timer,
  countdown: Timer,
  notes: FileText,
  customText: FileText,
  dailyFocus: Target,
  productivityStats: BarChart2,
};

export function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');
  const { addWidget } = useDashboardStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const categories = getWidgetCategories();

  /* Auto-focus search on open */
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* Escape closes */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, onClose]);

  /* Reset state on close */
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  const filteredWidgets = useMemo(() => {
    let list = getRegisteredWidgets();
    if (selectedCategory !== 'all') {
      list = list.filter((w) => w.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="add-widget-backdrop"
        className="modal-backdrop"
        style={{ zIndex: 200, alignItems: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Add widget"
      >
        <motion.div
          ref={panelRef}
          className="modal-panel"
          style={{ width: '100%', maxWidth: '680px' }}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">Add Widget</h2>
            <button
              onClick={onClose}
              className="btn-icon"
              aria-label="Close"
              style={{ marginLeft: 'auto' }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* Search + filter */}
          <div
            style={{
              padding: '0.875rem 1.5rem 0.75rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            {/* Search input */}
            <div style={{ position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  color: 'var(--color-text-muted)',
                  pointerEvents: 'none',
                }}
                aria-hidden
              />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search widgets…"
                className="input"
                style={{ paddingLeft: '2.25rem', height: '36px' }}
                aria-label="Search widgets"
              />
            </div>

            {/* Category tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                overflowX: 'auto',
                paddingBottom: '2px',
              }}
              className="no-scrollbar"
              role="tablist"
              aria-label="Widget categories"
            >
              {(['all', ...categories] as (WidgetCategory | 'all')[]).map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    height: '28px',
                    padding: '0 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms ease',
                    backgroundColor:
                      selectedCategory === cat
                        ? 'var(--color-primary)'
                        : 'var(--color-surface-secondary)',
                    color:
                      selectedCategory === cat
                        ? '#ffffff'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>
          </div>

          {/* Widget grid */}
          <div
            className="modal-body scrollbar-thin"
            style={{ maxHeight: '420px', padding: '1rem 1.5rem' }}
          >
            {filteredWidgets.length === 0 ? (
              <div className="empty-state" style={{ height: '200px' }}>
                <Search style={{ width: '32px', height: '32px' }} aria-hidden />
                <p className="empty-state-title">No widgets found</p>
                <p className="empty-state-description">Try a different search or category</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {filteredWidgets.map((widget) => (
                  <WidgetCard
                    key={widget.type}
                    widget={widget}
                    onAdd={() => {
                      addWidget(widget.type);
                      onClose();
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div
            style={{
              padding: '0.625rem 1.5rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''}
            </span>
            <span>Click a widget to add it to your workspace</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function WidgetCard({
  widget,
  onAdd,
}: {
  widget: import('../../types').WidgetDefinition;
  onAdd: () => void;
}) {
  const Icon = WIDGET_ICONS[widget.type] || Layers;

  return (
    <button
      onClick={onAdd}
      title={`Add ${widget.name}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 150ms ease',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--color-primary)';
        el.style.backgroundColor = 'var(--color-primary-muted)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--color-border)';
        el.style.backgroundColor = 'var(--color-surface)';
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-primary-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon
          style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }}
          aria-hidden
        />
      </div>

      {/* Name + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '0.1875rem',
            lineHeight: 1.3,
          }}
        >
          {widget.name}
        </div>
        <div
          className="truncate-2"
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
          }}
        >
          {widget.description}
        </div>
      </div>

      {/* Category badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 'auto',
        }}
      >
        <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
          {widget.category}
        </span>
        <span
          style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}
          aria-label={`Default size ${widget.defaultSize.w} by ${widget.defaultSize.h}`}
        >
          {widget.defaultSize.w}×{widget.defaultSize.h}
        </span>
      </div>
    </button>
  );
}
