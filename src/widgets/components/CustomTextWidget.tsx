import { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/helpers';
import { Type, Settings, Download, Code, FileText, Maximize2 } from 'lucide-react';
import type { WidgetProps } from '../../types';
import type { CustomTextWidgetSettings } from '../schemas';

export function CustomTextWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as CustomTextWidgetSettings;
  const [renderedContent, setRenderedContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(settings.content);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditContent(settings.content);
    updateRenderedContent(settings.content, settings.format);
  }, [settings.content, settings.format]);

  const updateRenderedContent = (content: string, format: string) => {
    let html = content;
    
    if (format === 'markdown') {
      // Simple markdown parsing
      html = content
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      html = '<p>' + html + '</p>';
    } else if (format === 'plain') {
      html = content
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/\n/g, '<br>');
    }
    // html format passes through as-is
    
    setRenderedContent(html);
  };

  const handleSave = () => {
    onConfigChange({ content: editContent });
    updateRenderedContent(editContent, settings.format);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditContent(settings.content);
    setEditing(false);
  };

  const handleFormatChange = (format: 'plain' | 'markdown' | 'html') => {
    onConfigChange({ format });
  };

  const downloadContent = () => {
    const blob = new Blob([settings.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-text-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const containerStyle: React.CSSProperties = {
    fontSize: `${settings.fontSize}px`,
    textAlign: settings.textAlign,
    lineHeight: settings.lineHeight,
    color: settings.color || 'inherit',
    backgroundColor: settings.backgroundColor || 'transparent',
    padding: `${settings.padding}px`,
  };

  return (
    <div className={cn('widget custom-text-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <Type className="w-5 h-5" />
          Custom Text
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={downloadContent} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Edit">
            <Code className="w-4 h-4" />
          </button>
          <button onClick={() => containerRef.current?.requestFullscreen()} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto" ref={containerRef}>
        {editing ? (
          <div className="h-full flex flex-col p-4">
            <div className="flex gap-2 mb-3 p-2 bg-surface-elevated rounded-lg">
              <span className="text-body-sm text-text-muted mr-2">Format:</span>
              <select
                value={settings.format}
                onChange={(e) => handleFormatChange(e.target.value as 'plain' | 'markdown' | 'html')}
                className="input text-sm py-1 px-2"
              >
                <option value="plain">Plain Text</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 font-mono text-sm p-3 bg-surface-elevated border border-border rounded-lg resize-none outline-none"
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                fontFamily: 'inherit',
              }}
              placeholder="Enter your content..."
              spellCheck={false}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={handleCancel} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-primary">Save</button>
            </div>
          </div>
        ) : (
          <div
            className="h-full p-4"
            style={containerStyle}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        )}
      </div>
    </div>
  );
}