import type { WidgetDefinition, WidgetSize } from '../../types';
import { z } from 'zod';
import { CloudSun } from 'lucide-react';
import { WeatherWidget } from '../components/WeatherWidget';
import { weatherWidgetSchema, type WeatherWidgetSettings } from '../schemas';

export const weatherWidgetDefinition: WidgetDefinition = {
  id: 'weather',
  type: 'weather',
  name: 'Weather',
  description: 'Current weather and forecast for your location',
  category: 'information',
  icon: 'CloudSun',
  defaultSize: { w: 5, h: 4 },
  minSize: { w: 4, h: 3 },
  maxSize: { w: 8, h: 6 },
  defaultSettings: {
    apiKey: '',
    location: '',
    units: 'metric',
    showForecast: true,
    forecastDays: 3,
    updateInterval: 1800,
    compactMode: false,
  } satisfies WeatherWidgetSettings,
  settingsSchema: weatherWidgetSchema,
  component: WeatherWidget,
  canDuplicate: true,
  canResize: true,
  canConfigure: true,
};