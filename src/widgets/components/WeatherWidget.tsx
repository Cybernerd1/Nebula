import { useEffect, useState, useCallback } from 'react';
import { cn } from '../../utils/helpers';
import { CloudSun, CloudRain, CloudSnow, Sun, Cloud, Droplets, Wind, Thermometer, ChevronRight, RefreshCw, Settings, MapPin, AlertCircle, Check, X, Plus, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetProps } from '../../types';

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
    icon: string;
  };
  forecast: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    condition: string;
    icon: string;
  }>;
  location: string;
}

interface WeatherWidgetSettings {
  apiKey: string;
  location: string;
  units: 'metric' | 'imperial';
  showForecast: boolean;
  forecastDays: number;
  updateInterval: number;
  compactMode: boolean;
}

const CONDITION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  drizzle: CloudRain,
  thunderstorm: CloudRain,
  snow: CloudSnow,
  mist: Cloud,
  fog: Cloud,
};

function getConditionIcon(condition: string) {
  const key = condition.toLowerCase();
  for (const [k, v] of Object.entries(CONDITION_ICONS)) {
    if (key.includes(k)) return v;
  }
  return Cloud;
}

export function WeatherWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as unknown as WeatherWidgetSettings;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!settings.apiKey || !settings.location) {
      setError('Please configure API key and location');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(settings.location)}&limit=1&appid=${settings.apiKey}`
      );
      const geoData = await geoResponse.json();
      
      if (!geoData.length) {
        throw new Error('Location not found');
      }

      const { lat, lon, name, country } = geoData[0];
      
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${settings.units}&exclude=minutely,hourly,alerts&appid=${settings.apiKey}`
      );
      const weatherData = await weatherResponse.json();

      setWeather({
        current: {
          temp: Math.round(weatherData.current.temp),
          condition: weatherData.current.weather[0].main,
          description: weatherData.current.weather[0].description,
          humidity: weatherData.current.humidity,
          windSpeed: Math.round(weatherData.current.wind_speed),
          feelsLike: Math.round(weatherData.current.feels_like),
          icon: weatherData.current.weather[0].icon,
        },
        forecast: weatherData.daily.slice(0, settings.forecastDays).map((day: any) => ({
          date: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          tempMin: Math.round(day.temp.min),
          tempMax: Math.round(day.temp.max),
          condition: day.weather[0].main,
          icon: day.weather[0].icon,
        })),
        location: `${name}, ${country}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [settings.apiKey, settings.location, settings.units, settings.forecastDays]);

  useEffect(() => {
    fetchWeather();
    if (settings.updateInterval > 0) {
      const interval = setInterval(fetchWeather, settings.updateInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchWeather, settings.updateInterval]);

  const handleRefresh = () => fetchWeather();

  const handleConfigClick = () => {
    // Open config modal - handled by parent
  };

  return (
    <div className={cn('widget weather-widget h-full flex flex-col', settings.compactMode && 'compact')}>
      <div className="widget-header flex items-center justify-between p-4">
        <h3 className="font-semibold text-text">Weather</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleConfigClick} className="p-1.5 hover:bg-surface-elevated rounded-lg transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        {error && (
          <div className="flex items-center gap-2 text-warning mb-4 p-3 bg-warning/10 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-body-sm">{error}</span>
            <button onClick={handleConfigClick} className="ml-auto text-xs underline">Configure</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <div key="loading" className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : weather ? (
            <div key="weather" className="flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 text-text-muted text-body-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>{weather.location}</span>
                  </div>
                  <div className="text-4xl font-light text-text">{weather.current.temp}°{settings.units === 'metric' ? 'C' : 'F'}</div>
                  <div className="text-text-muted capitalize">{weather.current.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-body-sm text-text-muted">Feels like</div>
                  <div className="font-medium text-text">{weather.current.feelsLike}°</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 p-2 bg-surface-elevated rounded-lg">
                  <Droplets className="w-5 h-5 text-text-muted" />
                  <div>
                    <div className="text-body-xs text-text-muted">Humidity</div>
                    <div className="font-medium text-text">{weather.current.humidity}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-surface-elevated rounded-lg">
                  <Wind className="w-5 h-5 text-text-muted" />
                  <div>
                    <div className="text-body-xs text-text-muted">Wind</div>
                    <div className="font-medium text-text">{weather.current.windSpeed} {settings.units === 'metric' ? 'm/s' : 'mph'}</div>
                  </div>
                </div>
              </div>

              {settings.showForecast && weather.forecast.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium text-text mb-3">Forecast</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {weather.forecast.map((day, index) => {
                      const Icon = getConditionIcon(day.condition);
                      return (
                        <motion.div
                          key={day.date}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex-shrink-0 w-24 flex flex-col items-center gap-1 p-2 bg-surface-elevated rounded-lg"
                        >
                          <div className="text-body-xs text-text-muted">{day.date}</div>
                          <Icon className="w-8 h-8 text-primary" />
                          <div className="text-body-sm font-medium text-text">
                            {day.tempMax}° / {day.tempMin}°
                          </div>
                          <div className="text-body-xs text-text-muted capitalize">{day.condition.toLowerCase()}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface WeatherWidgetSettings {
  apiKey: string;
  location: string;
  units: 'metric' | 'imperial';
  showForecast: boolean;
  forecastDays: number;
  updateInterval: number;
}