import { useEffect, useState } from 'react';
import { cn } from '../../utils/helpers';
import { Calendar, Settings, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import type { WidgetProps } from '../../types';

interface DateWidgetSettings {
  format: 'full' | 'short' | 'numeric';
  showWeekday: boolean;
  fontSize: number;
  compactMode: boolean;
}

export function DateWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as unknown as DateWidgetSettings;
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const updateDate = () => setCurrentDate(new Date());
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatOptions: Intl.DateTimeFormatOptions = {
    weekday: settings.showWeekday ? 'long' : undefined,
    year: 'numeric',
    month: settings.format === 'full' ? 'long' : settings.format === 'short' ? 'short' : 'numeric',
    day: 'numeric',
  };

  const formattedDate = currentDate.toLocaleDateString('en-US', formatOptions);
  const timeString = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn('widget date-widget h-full flex flex-col items-center justify-center text-center', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4 w-full">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Date
        </h3>
        <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="mb-2">
          <span className={cn(
            'font-light',
            settings.fontSize >= 32 ? 'text-4xl' : settings.fontSize >= 24 ? 'text-3xl' : 'text-2xl'
          )}>
            {formattedDate}
          </span>
        </div>
        <div className="text-body-sm text-text-muted">
          {timeString}
        </div>
      </div>
    </div>
  );
}