import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, EyeOff, Trash2, ChevronDown, X } from 'lucide-react';
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
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const engineMenuRef = useRef<HTMLDivElement>(null);
  const settings = config.settings as SearchWidgetSettings;
  const engine =
    DEFAULT_SEARCH_ENGINES.find((e) => e.id === settings.engine) ||
    DEFAULT_SEARCH_ENGINES[0];

  /* Close engine menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (engineMenuRef.current && !engineMenuRef.current.contains(e.target as Node)) {
        setShowEngineMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(
    async (val: string) => {
      if (!settings.showSuggestions || val.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const url = engine.suggestionUrl?.replace('{query}', encodeURIComponent(val));
        if (!url) return;
        const res = await fetch(url);
        if (!res.ok) return;
        if (engine.id === 'google' || engine.id === 'brave') {
          const data = (await res.json()) as string[][];
          setSuggestions(data[1]?.slice(0, 6) ?? []);
        } else if (engine.id === 'duckduckgo') {
          const data = (await res.json()) as { results?: { phrase: string }[] };
          setSuggestions(data.results?.slice(0, 6).map((r) => r.phrase) ?? []);
        } else if (engine.id === 'bing') {
          const text = await res.text();
          const match = text.match(/\((.*)\)/);
          if (match) setSuggestions((JSON.parse(match[1]) as string[][])[1]?.slice(0, 6) ?? []);
        }
      } catch {
        setSuggestions([]);
      }
    },
    [engine, settings.showSuggestions],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  const navigate = (q: string) => {
    const url = engine.url.replace('{query}', encodeURIComponent(q.trim()));
    if (settings.openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigate(suggestions[selectedIndex]);
    } else {
      navigate(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((p) => Math.max(p - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const changeEngine = (id: string) => {
    onConfigChange({ ...settings, engine: id });
    setShowEngineMenu(false);
  };

  /* Preview */
  if (isPreview) {
    return (
      <div className="widget-card" style={{ justifyContent: 'center' }}>
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
          <div
            style={{
              height: '40px',
              paddingLeft: '2.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
            }}
          >
            {settings.placeholder || 'Search…'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('widget-card', isEditing && 'is-editing')}>
      {/* Edit toolbar */}
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            gap: '0.125rem',
            opacity: 0,
            transition: 'opacity 150ms ease',
          }}
          className="group-hover-opacity"
        >
          <button onClick={(e) => { e.stopPropagation(); onHide(); }} className="btn-icon" title="Hide" style={{ color: 'var(--color-warning)' }}>
            <EyeOff style={{ width: '14px', height: '14px' }} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="btn-icon" title="Remove" style={{ color: 'var(--color-error)' }}>
            <Trash2 style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {/* Search form — centred vertically */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          minHeight: 0,
        }}
      >
        {/* Input row */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
          {/* Search icon */}
          <Search
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            aria-hidden
          />

          <input
            ref={inputRef}
            data-nebula-search-input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
            onKeyDown={handleKeyDown}
            placeholder={settings.placeholder || 'Search…'}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '2.75rem',
              paddingRight: '3.5rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '0.9375rem',
              outline: 'none',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onFocusCapture={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'var(--color-primary)';
              (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--color-primary-muted)';
            }}
            onBlurCapture={(e) => {
              (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)';
              (e.target as HTMLInputElement).style.boxShadow = 'none';
            }}
          />

          {/* Engine selector button */}
          <div ref={engineMenuRef} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
            <button
              type="button"
              onClick={() => setShowEngineMenu((v) => !v)}
              style={{
                height: '32px',
                padding: '0 0.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
              aria-label="Select search engine"
              aria-expanded={showEngineMenu}
              aria-haspopup="listbox"
            >
              <span>{engine.icon}</span>
              <ChevronDown style={{ width: '12px', height: '12px' }} aria-hidden />
            </button>

            {/* Engine dropdown */}
            <AnimatePresence>
              {showEngineMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    minWidth: '160px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden',
                    zIndex: 60,
                  }}
                  role="listbox"
                  aria-label="Search engines"
                >
                  {DEFAULT_SEARCH_ENGINES.map((eng) => (
                    <button
                      key={eng.id}
                      role="option"
                      aria-selected={settings.engine === eng.id}
                      onClick={() => changeEngine(eng.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        backgroundColor:
                          settings.engine === eng.id
                            ? 'var(--color-primary-muted)'
                            : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color:
                          settings.engine === eng.id
                            ? 'var(--color-primary)'
                            : 'var(--color-text)',
                        textAlign: 'left',
                        transition: 'background-color 100ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (settings.engine !== eng.id)
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            'var(--color-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (settings.engine !== eng.id)
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{eng.icon}</span>
                      <span style={{ flex: 1 }}>{eng.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.13 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                  zIndex: 50,
                  listStyle: 'none',
                  margin: 0,
                  padding: '0.25rem',
                }}
                role="listbox"
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s}
                    role="option"
                    aria-selected={i === selectedIndex}
                    onClick={() => navigate(s)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.4375rem 0.625rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      backgroundColor:
                        i === selectedIndex
                          ? 'var(--color-primary-muted)'
                          : 'transparent',
                      color:
                        i === selectedIndex
                          ? 'var(--color-primary)'
                          : 'var(--color-text)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <Search style={{ width: '13px', height: '13px', flexShrink: 0, color: 'var(--color-text-muted)' }} aria-hidden />
                    {s}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard hint */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            <kbd>Ctrl+K</kbd> to focus
          </span>
          {engine.suggestionUrl && settings.showSuggestions && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span
                style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}
              />
              Suggestions on
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
