import { useState, useEffect, useMemo } from 'react';
import { cn } from '../../utils/helpers';
import { BarChart, Settings, TrendingUp, Clock, CheckCircle, Target, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WidgetProps } from '../../types';
import type { ProductivityStatsWidgetSettings } from '../schemas';

interface StatsData {
  tasksCompleted: number[];
  focusTime: number[]; // in minutes
  pomodoroCount: number[];
  streak: number;
  dates: string[];
}

const MOCK_DATA: Record<string, StatsData> = {
  day: {
    tasksCompleted: [3, 5, 2, 4, 6, 1, 0],
    focusTime: [45, 60, 30, 90, 120, 15, 0],
    pomodoroCount: [2, 3, 1, 2, 4, 0, 0],
    streak: 5,
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  week: {
    tasksCompleted: [12, 18, 15, 22, 19, 25, 10, 8, 14, 16, 20, 11],
    focusTime: [180, 240, 210, 300, 270, 360, 150, 120, 195, 225, 280, 165],
    pomodoroCount: [6, 8, 7, 10, 9, 12, 4, 3, 7, 8, 10, 5],
    streak: 12,
    dates: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
  },
  month: {
    tasksCompleted: [45, 52, 38, 61, 55, 48, 42, 58, 63, 47, 51, 44],
    focusTime: [720, 840, 660, 960, 880, 780, 720, 900, 1020, 780, 840, 720],
    pomodoroCount: [22, 26, 19, 30, 28, 24, 21, 27, 31, 23, 25, 22],
    streak: 8,
    dates: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  year: {
    tasksCompleted: [380, 420, 395, 450],
    focusTime: [6200, 7100, 6800, 7800],
    pomodoroCount: [180, 200, 190, 220],
    streak: 3,
    dates: ['Q1', 'Q2', 'Q3', 'Q4'],
  },
};

export function ProductivityStatsWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as ProductivityStatsWidgetSettings;
  const [data] = useState<StatsData>(MOCK_DATA[settings.period]);
  const [chartType, setChartType] = useState(settings.chartType);

  const stats = useMemo(() => ({
    totalTasks: data.tasksCompleted.reduce((a, b) => a + b, 0),
    totalFocusHours: Math.round(data.focusTime.reduce((a, b) => a + b, 0) / 60),
    totalPomodoros: data.pomodoroCount.reduce((a, b) => a + b, 0),
    currentStreak: data.streak,
  }), [data]);

  const getChartData = () => {
    let values: number[];
    let label = '';
    let color = 'var(--color-primary)';

    if (settings.showTasksCompleted) {
      values = data.tasksCompleted;
      label = 'Tasks Completed';
      color = 'var(--color-primary)';
    } else if (settings.showFocusTime) {
      values = data.focusTime.map(m => Math.round(m / 60));
      label = 'Focus Hours';
      color = 'var(--color-info)';
    } else if (settings.showPomodoroCount) {
      values = data.pomodoroCount;
      label = 'Pomodoros';
      color = 'var(--color-warning)';
    } else {
      values = data.tasksCompleted;
      label = 'Tasks Completed';
      color = 'var(--color-primary)';
    }

    return { values, label, color, dates: data.dates };
  };

  const { values, label, color, dates } = getChartData();
  const maxValue = Math.max(...values, 1);

  const renderBarChart = () => (
    <div className="flex items-end justify-around h-48 gap-1 px-2">
      {values.map((value, index) => (
        <motion.div
          key={index}
          initial={{ height: 0 }}
          animate={{ height: `${(value / maxValue) * 100}%` }}
          transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-1 flex-1"
        >
          <div
            className="w-full rounded-t transition-colors"
            style={{
              backgroundColor: color,
              height: `${(value / maxValue) * 100}%`,
              minHeight: value > 0 ? '4px' : '0',
            }}
          />
          <span className="text-body-xs text-text-muted">{dates[index]}</span>
        </motion.div>
      ))}
    </div>
  );

  const renderLineChart = () => {
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x}% ${y}%`;
    }).join(',');

    return (
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M${points} L${100} 100 L0 100 Z`}
            fill="url(#lineGradient)"
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {values.map((value, index) => {
            const x = (index / (values.length - 1)) * 100;
            const y = 100 - (value / maxValue) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-2 -mb-2">
          {dates.map((date, index) => (
            <span key={index} className="text-body-xs text-text-muted flex-1 text-center">{date}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderAreaChart = () => {
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x}% ${y}%`;
    }).join(',');

    const areaPoints = [
      `0 100`,
      ...points.split(' ').map(p => p.trim()),
      `100 100`,
    ].join(' ');

    return (
      <div className="relative h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#areaGradient)" />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-2 -mb-2">
          {dates.map((date, index) => (
            <span key={index} className="text-body-xs text-text-muted flex-1 text-center">{date}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('widget productivity-stats-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Productivity Stats
        </h3>
        <div className="flex items-center gap-1">
          <select
            value={settings.period}
            onChange={(e) => onConfigChange({ period: e.target.value as 'day' | 'week' | 'month' | 'year' })}
            className="input text-sm py-1 px-2 bg-surface-elevated border-border"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <select
            value={chartType}
            onChange={(e) => {
              setChartType(e.target.value as 'bar' | 'line' | 'area');
              onConfigChange({ chartType: e.target.value as 'bar' | 'line' | 'area' });
            }}
            className="input text-sm py-1 px-2 bg-surface-elevated border-border"
          >
            <option value="bar">Bars</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
          <button className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {settings.showTasksCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-surface-elevated rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-body-sm text-text-muted">Tasks</span>
              </div>
              <div className="text-2xl font-bold text-text">{stats.totalTasks}</div>
              <div className="text-body-xs text-text-muted">Total completed</div>
            </motion.div>
          )}
          {settings.showFocusTime && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-3 bg-surface-elevated rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-info" />
                <span className="text-body-sm text-text-muted">Focus</span>
              </div>
              <div className="text-2xl font-bold text-text">{stats.totalFocusHours}h</div>
              <div className="text-body-xs text-text-muted">Total hours</div>
            </motion.div>
          )}
          {settings.showPomodoroCount && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3 bg-surface-elevated rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5 text-warning" />
                <span className="text-body-sm text-text-muted">Pomodoros</span>
              </div>
              <div className="text-2xl font-bold text-text">{stats.totalPomodoros}</div>
              <div className="text-body-xs text-text-muted">Sessions</div>
            </motion.div>
          )}
          {settings.showStreak && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-3 bg-surface-elevated rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-body-sm text-text-muted">Streak</span>
              </div>
              <div className="text-2xl font-bold text-text">{stats.currentStreak}</div>
              <div className="text-body-xs text-text-muted">Days</div>
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {chartType === 'bar' && renderBarChart()}
          {chartType === 'line' && renderLineChart()}
          {chartType === 'area' && renderAreaChart()}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-body-sm text-text-muted">
            <span>{label} over {settings.period}</span>
            <span>Max: {Math.max(...values)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}