import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Settings, EyeOff, Trash2, ChevronDown, X, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { DEFAULT_SEARCH_ENGINES } from '../../utils/helpers';
import type { WidgetProps, SearchWidgetSettings } from '../../types';

export function SearchWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showEngineSelector, setShowEngineSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const settings = config.settings as SearchWidgetSettings;
  const engine = DEFAULT_SEARCH_ENGINES.find((e) => e.id === settings.engine) || DEFAULT_SEARCH_ENGINES[0];

  const fetchSuggestions = useCallback(async (value: string) => {
    if (!settings.showSuggestions || value.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const url = engine.suggestionUrl?.replace('{query}', encodeURIComponent(value));
      if (!url) return;

      const response = await fetch(url);
      if (!response.ok) return;

      let data: unknown;
      if (engine.id === 'google' || engine.id === 'brave') {
        data = await response.json();
        const suggestions = (data as string[][])[1]?.slice(0, 5) || [];
        setSuggestions(suggestions);
      } else if (engine.id === 'duckduckgo') {
        data = await response.json();
        const suggestions = (data as { results?: { phrase: string }[] }).results?.slice(0, 5).map((r) => r.phrase) || [];
        setSuggestions(suggestions);
      } else if (engine.id === 'bing') {
        const text = await response.text();
        const match = text.match(/\((.*)\)/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          setSuggestions(parsed[1]?.slice(0, 5) || []);
        }
      }
    } catch {
      setSuggestions([]);
    }
  }, [engine, settings.showSuggestions]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const url = engine.url.replace('{query}', encodeURIComponent(query.trim()));
    if (settings.openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        setQuery(suggestions[selectedIndex]);
        handleSubmit(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSettingsChange = (newSettings: Partial<SearchWidgetSettings>) => {
    onConfigChange({ ...settings, ...newSettings });
  };

  if (isPreview) {
    return (
      <form onSubmit={handleSubmit} className="p-6 bg-surface-elevated border border-border rounded-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder={settings.placeholder}
            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            disabled
          />
        </div>
      </form>
    );
  }

  return (
    <div
      className={cn(
        'relative h-full w-full bg-surface-elevated border border-border rounded-xl p-6 transition-all duration-normal',
        'hover:shadow-lg hover:border-border-strong',
        isEditing && 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
      )}
    >
      {isEditing && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); setShowEngineSelector(!showEngineSelector); }}
            className="btn-icon p-1.5"
            title="Change Engine"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            className="btn-icon p-1.5 text-warning"
            title="Hide Widget"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="btn-icon p-1.5 text-error"
            title="Remove Widget"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="h-full flex flex-col items-center justify-center">
        <div className={cn('relative w-full', settings.width && `max-w-[${settings.width}px]`)} style={{ width: '100%' }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder={settings.placeholder}
              className="w-full pl-12 pr-16 py-4 bg-surface border border-border rounded-xl text-text placeholder:text-text-muted text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowEngineSelector(!showEngineSelector)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-text transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden z-50"
                role="listbox"
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'px-4 py-3 text-text cursor-pointer transition-colors',
                      index === selectedIndex && 'bg-primary/20 text-primary'
                    )}
                    role="option"
                    aria-selected={index === selectedIndex}
                  >
                    <span className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
                      <span>{suggestion}</span>
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showEngineSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-2 w-56 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden z-50"
              >
                {DEFAULT_SEARCH_ENGINES.map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => {
                      handleSettingsChange({ engine: eng.id });
                      setShowEngineSelector(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                      settings.engine === eng.id && 'bg-primary/20 text-primary'
                    )}
                  >
                    <span className="text-2xl">{eng.icon}</span>
                    <span className="font-medium">{eng.name}</span>
                    {settings.engine === eng.id && <span className="ml-auto text-primary">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-4 text-body-sm text-text-muted">
          <span>Press <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-text">Ctrl+K</kbd> to focus</span>
          {engine.suggestionUrl && settings.showSuggestions && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              Suggestions enabled
            </span>
          )}
        </div>
      </form>

      <SearchSettingsPanel
        config={config}
        settings={settings}
        onChange={handleSettingsChange}
        isOpen={isEditing}
      />
    </div>
  );
}

function SearchSettingsPanel({
  config,
  settings,
  onChange,
  isOpen,
}: {
  config: import('../../types').WidgetConfig;
  settings: SearchWidgetSettings;
  onChange: (settings: Partial<SearchWidgetSettings>) => void;
  isOpen: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-overlay/80 backdrop-blur-sm rounded-xl z-10 p-6 flex items-center justify-center animate-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface-elevated border border-border rounded-xl p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading-md font-semibold text-text">Search Settings</h3>
          <button
            onClick={() => onChange({ ...settings })}
            className="btn-icon p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Default Search Engine</label>
            <div className="space-y-2">
              {DEFAULT_SEARCH_ENGINES.map((eng) => (
                <button
                  key={eng.id}
                  onClick={() => onChange({ engine: eng.id })}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3 text-left rounded-lg border transition-all',
                    settings.engine === eng.id
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  <span className="text-2xl">{eng.icon}</span>
                  <span className="font-medium">{eng.name}</span>
                  {settings.engine === eng.id && <span className="ml-auto text-primary">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showSuggestions"
              checked={settings.showSuggestions}
              onChange={(e) => onChange({ showSuggestions: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="showSuggestions" className="text-body-md text-text">Show search suggestions</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="openInNewTab"
              checked={settings.openInNewTab}
              onChange={(e) => onChange({ openInNewTab: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="openInNewTab" className="text-body-md text-text">Open results in new tab</label>
          </div>

          <div>
            <label className="label">Placeholder Text</label>
            <input
              type="text"
              value={settings.placeholder}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Width: {settings.width}px</label>
            <input
              type="range"
              min="200"
              max="800"
              step="50"
              value={settings.width}
              onChange={(e) => onChange({ width: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="label">Position</label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => onChange({ position: pos as 'left' | 'center' | 'right' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.position === pos
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
