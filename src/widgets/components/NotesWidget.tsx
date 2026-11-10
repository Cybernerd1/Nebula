import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import {
  StickyNote, Download, Trash2, Bold, Italic, Underline,
  Strikethrough, List, ListOrdered, Undo, Redo, AlertCircle, Check,
} from 'lucide-react';
import type { WidgetProps } from '../../types';
import type { NotesWidgetSettings } from '../schemas';

export function NotesWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as NotesWidgetSettings;
  const [content, setContent] = useState(settings.defaultContent ?? '');
  const [saved, setSaved] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Sync content from settings on external change */
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== settings.defaultContent) {
      editorRef.current.innerHTML = settings.defaultContent ?? '';
      setContent(settings.defaultContent ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCharCount(editorRef.current?.innerText.length ?? 0);
  }, [content]);

  const saveContent = useCallback((html: string) => {
    onConfigChange({ defaultContent: html });
    setSaved(true);
  }, [onConfigChange]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    setContent(html);
    setSaved(false);
    if (settings.autoSave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveContent(html), settings.saveDelay ?? 1500);
    }
  }, [settings.autoSave, settings.saveDelay, saveContent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (editorRef.current) saveContent(editorRef.current.innerHTML);
    }
  };

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const clear = () => {
    if (!confirm('Clear all notes?')) return;
    if (editorRef.current) editorRef.current.innerHTML = '';
    setContent('');
    saveContent('');
  };

  const download = () => {
    const text = editorRef.current?.innerText ?? '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ToolBtn = ({
    onClick,
    title,
    children,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      aria-label={title}
      style={{
        width: '26px',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'background-color 100ms ease, color 100ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-hover)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
      }}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('widget-card', 'notes-widget')} style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="widget-header"
        style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}
      >
        <span className="widget-title">
          <StickyNote aria-hidden />
          Notes
        </span>
        <div className="widget-actions">
          {settings.showWordCount && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              {charCount}c
            </span>
          )}
          {!saved && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <AlertCircle style={{ width: '10px', height: '10px' }} aria-hidden />
              Unsaved
            </span>
          )}
          {saved && content && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Check style={{ width: '10px', height: '10px' }} aria-hidden />
              Saved
            </span>
          )}
          <button onClick={download} className="btn-icon" aria-label="Download notes" title="Download as text">
            <Download style={{ width: '13px', height: '13px' }} />
          </button>
          <button onClick={clear} className="btn-icon" aria-label="Clear notes" title="Clear all notes" style={{ color: 'var(--color-error)' }}>
            <Trash2 style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      </div>

      {/* Formatting toolbar */}
      {settings.showToolbar && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1px',
            padding: '0.25rem 0.5rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-secondary)',
            flexShrink: 0,
          }}
          role="toolbar"
          aria-label="Text formatting"
        >
          <ToolBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)">
            <Bold style={{ width: '12px', height: '12px' }} />
          </ToolBtn>
          <ToolBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)">
            <Italic style={{ width: '12px', height: '12px' }} />
          </ToolBtn>
          <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)">
            <Underline style={{ width: '12px', height: '12px' }} />
          </ToolBtn>
          <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough">
            <Strikethrough style={{ width: '12px', height: '12px' }} />
          </ToolBtn>

          <div style={{ width: '1px', backgroundColor: 'var(--color-border)', margin: '0 2px', alignSelf: 'stretch' }} aria-hidden />

          <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">
            <List style={{ width: '12px', height: '12px' }} />
          </ToolBtn>
          <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list">
            <ListOrdered style={{ width: '12px', height: '12px' }} />
          </ToolBtn>

          <div style={{ width: '1px', backgroundColor: 'var(--color-border)', margin: '0 2px', alignSelf: 'stretch' }} aria-hidden />

          <ToolBtn onClick={() => exec('undo')} title="Undo (Ctrl+Z)">
            <Undo style={{ width: '12px', height: '12px' }} />
          </ToolBtn>
          <ToolBtn onClick={() => exec('redo')} title="Redo (Ctrl+Y)">
            <Redo style={{ width: '12px', height: '12px' }} />
          </ToolBtn>

          {!settings.autoSave && (
            <>
              <div style={{ flex: 1 }} aria-hidden />
              <ToolBtn onClick={() => editorRef.current && saveContent(editorRef.current.innerHTML)} title="Save (Ctrl+S)">
                <Check style={{ width: '12px', height: '12px' }} />
              </ToolBtn>
            </>
          )}
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          padding: '0.75rem',
          overflowY: 'auto',
          outline: 'none',
          fontSize: `${settings.fontSize ?? 14}px`,
          fontFamily: settings.fontFamily || 'var(--font-sans)',
          lineHeight: 1.65,
          color: 'var(--color-text)',
          minHeight: 0,
        }}
        className="scrollbar-thin notes-editor"
        role="textbox"
        aria-label="Notes editor"
        aria-multiline="true"
        data-placeholder="Start typing…"
      />

      {/* Scoped styles for the editor */}
      <style>{`
        .notes-editor:empty::before {
          content: attr(data-placeholder);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .notes-editor p { margin: 0 0 0.4em; }
        .notes-editor ul, .notes-editor ol { margin: 0.4em 0; padding-left: 1.5em; }
        .notes-editor blockquote {
          border-left: 2px solid var(--color-primary);
          padding-left: 0.75em;
          margin: 0.4em 0;
          color: var(--color-text-muted);
          font-style: italic;
        }
        .notes-editor pre, .notes-editor code {
          background: var(--color-surface-secondary);
          padding: 0.1em 0.3em;
          border-radius: var(--radius-xs);
          font-family: var(--font-mono);
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
}
