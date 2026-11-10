import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, ChevronRight, Check, Clock, Sun, Search as SearchIcon, Quote, CheckSquare, Folder, Link, Calendar, Timer, Target, BarChart2, BookOpen, FileText, Bell, Layers, CloudSun, History, Globe } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { getWidgetsByCategory, getWidgetCategories, getWidgetDefinition, getRegisteredWidgets } from '../../widgets';
import type { WidgetCategory } from '../../types';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<WidgetCategory, React.ComponentType<{ className?: string }>> = {
  time: Clock,
  productivity: CheckSquare,
  search: SearchIcon,
  information: Quote,
  media: Globe,
  custom: Layers,
};

const widgetIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  greeting: Sun,
  search: SearchIcon,
  quote: Quote,
  todo: CheckSquare,
  collections: Folder,
  quicklinks: Link,
  weather: CloudSun,
  calendar: Calendar,
  pomodoro: Timer,
  worldclock: Globe,
  focus: Target,
  stats: BarChart2,
  bookmarks: BookOpen,
  recent: History,
  notes: FileText,
  customtext: FileText,
  focusgoals: Target,
  countdown: Timer,
};

export function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');

  const categories = getWidgetCategories();
  const allWidgets = useMemo(() => {
    let widgets = getRegisteredWidgets();
    if (selectedCategory !== 'all') {
      widgets = widgets.filter((w) => w.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      widgets = widgets.filter((w) =>
        w.name.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query)
      );
    }
    return widgets;
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl max-h-[85vh] bg-surface-elevated border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-heading-lg font-bold text-text">Add Widget</h2>
            <button onClick={onClose} className="btn-icon p-2 text-text-muted hover:text-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 border-b border-border">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search widgets..."
                className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                autoFocus
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-4 py-2 rounded-lg text-body-sm font-medium whitespace-nowrap transition-all',
                  selectedCategory === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-surface hover:bg-surface-hover text-text'
                )}
              >
                All
              </button>
              {categories.map((cat) => {
                const CategoryIcon = categoryIcons[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-body-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                      selectedCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-surface hover:bg-surface-hover text-text'
                    )}
                  >
                    <CategoryIcon className="w-4 h-4" />
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {allWidgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-body-lg">No widgets found</p>
                <p className="text-body-sm">Try a different search or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allWidgets.map((widget) => (
                  <WidgetCard
                    key={widget.type}
                    widget={widget}
                    onAdd={() => {
                      onClose();
                    }}
                  />
                ))}
              </div>
            )}
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
  const Icon = widgetIcons[widget.type] || Layers;

  return (
    <button
      onClick={onAdd}
      className="group p-4 bg-surface border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-normal flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-3 bg-primary/20 rounded-xl text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-body-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4" />
        </span>
      </div>
      <h3 className="font-semibold text-text mb-1">{widget.name}</h3>
      <p className="text-body-sm text-text-muted flex-1">{widget.description}</p>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <span className="badge badge-primary text-xs">{widget.category}</span>
        <span className="ml-auto text-body-xs text-text-muted">
          {widget.defaultSize.w}×{widget.defaultSize.h}
        </span>
      </div>
    </button>
  );
}
