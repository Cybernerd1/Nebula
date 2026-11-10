import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote as QuoteIcon, RefreshCw, Heart, HeartOff, Settings, EyeOff, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { DEFAULT_QUOTES } from '../../utils/helpers';
import type { WidgetProps, QuoteWidgetSettings, Quote } from '../../types';

export function QuoteWidget({
  config,
  onConfigChange,
  onRemove,
  onHide,
  isEditing,
  isPreview = false,
}: WidgetProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [favorites, setFavorites] = useState<Quote[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const settings = config.settings as QuoteWidgetSettings;

  const loadQuote = useCallback(async () => {
    if (settings.source === 'custom' && settings.customQuotes.length > 0) {
      const randomQuote = settings.customQuotes[Math.floor(Math.random() * settings.customQuotes.length)];
      setQuote(randomQuote);
    } else {
      // Try a live quote source first (ZenQuotes is CORS-friendly);
      // fall back to the built-in quotes when offline/unavailable
      try {
        const response = await fetch('https://zenquotes.io/api/random');
        if (response.ok) {
          const data = await response.json();
          const entry = Array.isArray(data) ? data[0] : null;
          if (entry?.q) {
            setQuote({
              id: `api-${Date.now()}`,
              text: entry.q,
              author: entry.a || 'Unknown',
              favorite: false,
              source: 'api',
              createdAt: Date.now(),
            });
            return;
          }
        }
        setQuote(DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)] as Quote);
      } catch {
        setQuote(DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)] as Quote);
      }
    }
  }, [settings.source, settings.customQuotes]);

  useEffect(() => {
    loadQuote();
    if (settings.autoRefresh && settings.refreshInterval > 0) {
      const interval = setInterval(loadQuote, settings.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [loadQuote, settings.autoRefresh, settings.refreshInterval]);

  useEffect(() => {
    const stored = localStorage.getItem('nebula-favorite-quotes');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = (q: Quote) => {
    const isFav = favorites.some((f) => f.id === q.id);
    const newFavorites = isFav
      ? favorites.filter((f) => f.id !== q.id)
      : [...favorites, { ...q, favorite: true }];
    setFavorites(newFavorites);
    localStorage.setItem('nebula-favorite-quotes', JSON.stringify(newFavorites));
    if (q.id === quote?.id) {
      setQuote((prev) => prev ? { ...prev, favorite: !prev.favorite } : null);
    }
  };

  const handleSettingsChange = (newSettings: Partial<QuoteWidgetSettings>) => {
    onConfigChange({ ...settings, ...newSettings });
  };

  if (isPreview) {
    const previewQuote = DEFAULT_QUOTES[0];
    return (
      <div className="p-6 bg-surface-elevated border border-border rounded-xl">
        <div className="text-center">
          <QuoteIcon className="w-10 h-10 mx-auto mb-4 text-primary/50" />
          <blockquote className="text-text text-xl italic leading-relaxed">"The only way to do great work is to love what you do."</blockquote>
          <footer className="mt-4 text-text-muted">— Steve Jobs</footer>
        </div>
      </div>
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
            onClick={(e) => { e.stopPropagation(); setShowFavorites(!showFavorites); }}
            className="btn-icon p-1.5"
            title="Favorites"
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); loadQuote(); }}
            className="btn-icon p-1.5"
            title="Refresh Quote"
            disabled={!quote}
          >
            <RefreshCw className="w-4 h-4" />
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

      <div className="h-full flex flex-col">
        <AnimatePresence mode="wait">
          {showFavorites && favorites.length > 0 ? (
            <FavoritesView
              favorites={favorites}
              onClose={() => setShowFavorites(false)}
              onRemove={toggleFavorite}
            />
          ) : quote ? (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <QuoteIcon className="w-10 h-10 mb-4 text-primary/50" />
              <blockquote
                className="text-text italic leading-relaxed px-4"
                style={{
                  fontSize: `${settings.fontSize}px`,
                  textAlign: settings.textAlign,
                }}
              >
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              {settings.showAuthor && quote.author && (
                <footer className="mt-4 text-text-muted">
                  &mdash; {quote.author}
                </footer>
              )}
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={loadQuote}
                  className="btn-icon p-2"
                  title="New Quote"
                  aria-label="Get a new quote"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleFavorite(quote)}
                  className={cn(
                    'btn-icon p-2 transition-colors',
                    quote.favorite && 'text-warning'
                  )}
                  title={quote.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  aria-label={quote.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {quote.favorite ? <Heart className="w-5 h-5 fill-current" /> : <HeartOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`)}
                  className="btn-icon p-2"
                  title="Copy Quote"
                  aria-label="Copy quote to clipboard"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${quote.text}" — ${quote.author}`)}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="btn-icon p-2"
                  title="Share on Twitter"
                  aria-label="Share on Twitter"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center text-text-muted"
            >
              <RefreshCw className="w-10 h-10 mb-4 animate-spin text-primary" />
              <p>Loading quote...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuoteSettingsPanel
        config={config}
        settings={settings}
        onChange={handleSettingsChange}
        isOpen={isEditing}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

function FavoritesView({
  favorites,
  onClose,
  onRemove,
}: {
  favorites: Quote[];
  onClose: () => void;
  onRemove: (quote: Quote) => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <h3 className="text-heading-sm font-semibold text-text">Favorite Quotes</h3>
        <button onClick={onClose} className="btn-icon p-1.5" aria-label="Close favorites">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {favorites.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-surface border border-border rounded-lg"
          >
            <blockquote className="text-text italic">"{q.text}"</blockquote>
            {q.author && <footer className="mt-2 text-text-muted text-sm">— {q.author}</footer>}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onRemove(q)}
                className="btn-icon p-1.5 text-error hover:bg-error/10"
                aria-label="Remove from favorites"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuoteSettingsPanel({
  config,
  settings,
  onChange,
  isOpen,
  favorites,
  onToggleFavorite,
}: {
  config: import('../../types').WidgetConfig;
  settings: QuoteWidgetSettings;
  onChange: (settings: Partial<QuoteWidgetSettings>) => void;
  isOpen: boolean;
  favorites: Quote[];
  onToggleFavorite: (quote: Quote) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-overlay/80 backdrop-blur-sm rounded-xl z-10 p-6 flex items-center justify-center animate-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-surface-elevated border border-border rounded-xl p-6 shadow-xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-heading-md font-semibold text-text">Quote Settings</h3>
          <button
            onClick={() => onChange({ ...settings })}
            className="btn-icon p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="label">Quote Source</label>
            <div className="flex gap-2">
              {['api', 'custom'].map((source) => (
                <button
                  key={source}
                  onClick={() => onChange({ source: source as 'api' | 'custom' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.source === source
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {source === 'api' ? 'API (Quotable)' : 'Custom Quotes'}
                </button>
              ))}
            </div>
          </div>

          {settings.source === 'custom' && (
            <div>
              <label className="label">Custom Quotes</label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {settings.customQuotes.length === 0 ? (
                  <p className="text-text-muted text-center py-8">No custom quotes added yet</p>
                ) : (
                  settings.customQuotes.map((q) => (
                    <div key={q.id} className="p-3 bg-surface border border-border rounded-lg flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-text italic">"{q.text}"</p>
                        <p className="text-text-muted text-sm mt-1">— {q.author}</p>
                      </div>
                      <button
                        onClick={() => onChange({
                          customQuotes: settings.customQuotes.filter((cq) => cq.id !== q.id)
                        })}
                        className="btn-icon p-1.5 text-error flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  onClick={() => {
                    const newQuote = {
                      id: `custom-${Date.now()}`,
                      text: '',
                      author: '',
                      favorite: false,
                      source: 'custom' as const,
                      createdAt: Date.now(),
                    };
                    onChange({ customQuotes: [...settings.customQuotes, newQuote] });
                  }}
                  className="w-full btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Custom Quote
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showAuthor"
                checked={settings.showAuthor}
                onChange={(e) => onChange({ showAuthor: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="showAuthor" className="text-body-md text-text">Show author</label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={settings.autoRefresh}
                onChange={(e) => onChange({ autoRefresh: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="autoRefresh" className="text-body-md text-text">Auto-refresh</label>
            </div>
          </div>

          {settings.autoRefresh && (
            <div>
              <label className="label">Refresh Interval: {settings.refreshInterval / 3600}h</label>
              <input
                type="range"
                min="1"
                max="24"
                value={settings.refreshInterval / 3600}
                onChange={(e) => onChange({ refreshInterval: Number(e.target.value) * 3600 })}
                className="w-full accent-primary"
              />
            </div>
          )}

          <div>
            <label className="label">Font Size: {settings.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="36"
              value={settings.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="label">Text Alignment</label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => onChange({ textAlign: align as 'left' | 'center' | 'right' })}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border transition-all',
                    settings.textAlign === align
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface hover:bg-surface-hover border-border text-text'
                  )}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {favorites.length > 0 && (
            <div>
              <label className="label">Favorites ({favorites.length})</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {favorites.map((q) => (
                  <div key={q.id} className="p-3 bg-surface border border-border rounded-lg flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-text italic text-sm">"{q.text}"</p>
                      <p className="text-text-muted text-xs mt-1">— {q.author}</p>
                    </div>
                    <button
                      onClick={() => onToggleFavorite(q)}
                      className="btn-icon p-1.5 text-warning flex-shrink-0"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { X, Plus, ArrowUpRight } from 'lucide-react';