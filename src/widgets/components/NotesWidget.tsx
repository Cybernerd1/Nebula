import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import { StickyNote, Settings, Save, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Code, Undo, Redo, Trash2, Download, AlertCircle, Check } from 'lucide-react';
import type { WidgetProps } from '../../types';
import type { NotesWidgetSettings } from '../schemas';

export function NotesWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as NotesWidgetSettings;
  const [content, setContent] = useState(settings.defaultContent);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [saved, setSaved] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(settings.defaultContent);
  }, [settings.defaultContent]);

  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(content.length);
  }, [content]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    setSaved(false);

    if (settings.autoSave) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onConfigChange({ defaultContent: newContent });
        setSaved(true);
      }, settings.saveDelay);
    }
  }, [settings.autoSave, settings.saveDelay, onConfigChange]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onConfigChange({ defaultContent: content });
      setSaved(true);
    }
  };

  const clearContent = () => {
    if (confirm('Clear all notes?')) {
      setContent('');
      onConfigChange({ defaultContent: '' });
      setSaved(true);
    }
  };

  const downloadNotes = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('widget notes-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          Notes
        </h3>
        <div className="flex items-center gap-1">
          {settings.showWordCount && (
            <span className="text-body-xs text-text-muted px-2 py-1 bg-surface-elevated rounded">
              {wordCount} words · {charCount} chars
            </span>
          )}
          <button onClick={downloadNotes} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={clearContent} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors text-error" title="Clear">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {settings.showToolbar && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-surface-elevated/50">
          <button onClick={() => executeCommand('bold')} className="p-1.5 hover:bg-surface rounded" title="Bold (Ctrl+B)">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => executeCommand('italic')} className="p-1.5 hover:bg-surface rounded" title="Italic (Ctrl+I)">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => executeCommand('underline')} className="p-1.5 hover:bg-surface rounded" title="Underline (Ctrl+U)">
            <Underline className="w-4 h-4" />
          </button>
          <button onClick={() => executeCommand('strikeThrough')} className="p-1.5 hover:bg-surface rounded" title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => executeCommand('insertUnorderedList')} className="p-1.5 hover:bg-surface rounded" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => executeCommand('insertOrderedList')} className="p-1.5 hover:bg-surface rounded" title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
          <button onClick={() => executeCommand('formatBlock', 'blockquote')} className="p-1.5 hover:bg-surface rounded" title="Quote">
            <Quote className="w-4 h-4" />
          </button>
          <button onClick={() => executeCommand('formatBlock', 'pre')} className="p-1.5 hover:bg-surface rounded" title="Code Block">
            <Code className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => executeCommand('undo')} className="p-1.5 hover:bg-surface rounded" title="Undo (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={() => executeCommand('redo')} className="p-1.5 hover:bg-surface rounded" title="Redo (Ctrl+Y)">
            <Redo className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          {!saved && (
            <span className="text-body-xs text-warning flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Unsaved
            </span>
          )}
          {saved && (
            <span className="text-body-xs text-success flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      )}

      <div
        ref={editorRef}
        className="flex-1 p-4 overflow-y-auto outline-none notes-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: `${settings.fontSize}px`,
          fontFamily: settings.fontFamily,
          lineHeight: 1.6,
        }}
        data-placeholder="Start typing your notes..."
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .notes-widget .notes-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .notes-widget .notes-editor {
          min-height: 100%;
        }
        .notes-widget .notes-editor p {
          margin: 0 0 0.5em 0;
        }
        .notes-widget .notes-editor ul,
        .notes-widget .notes-editor ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .notes-widget .notes-editor blockquote {
          border-left: 3px solid var(--color-primary);
          padding-left: 1em;
          margin: 0.5em 0;
          color: var(--color-text-muted);
          font-style: italic;
        }
        .notes-widget .notes-editor pre {
          background: var(--color-surface-elevated);
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.5em 0;
          font-family: monospace;
          font-size: 0.9em;
        }
        .notes-widget .notes-editor code {
          background: var(--color-surface-elevated);
          padding: 0.1em 0.3em;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }
      `}} />
    </div>
  );
}