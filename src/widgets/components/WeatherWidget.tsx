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

// Open-Meteo WMO weather codes -> simple condition names
function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'clear';
  if (code <= 3) return 'clouds';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'clouds';
}

// Group OpenWeatherMap 3-hourly forecast entries into daily forecast items
function buildDailyForecast(list: any[] | undefined, days: number, _source: string) {
  if (!Array.isArray(list)) return [];
  const daily = new Map<string, { tempMin: number; tempMax: number; condition: string; icon: string; dt: number }>();
  list.forEach((entry: any) => {
    const date = new Date(entry.dt * 1000);
    const key = date.toISOString().slice(0, 10);
    const main = entry.weather?.[0]?.main || 'Clouds';
    const icon = entry.weather?.[0]?.icon || '03d';
    const existing = daily.get(key);
    if (!existing) {
      daily.set(key, { tempMin: entry.main?.temp_min ?? entry.main?.temp, tempMax: entry.main?.temp_max ?? entry.main?.temp, condition: main, icon, dt: entry.dt });
    } else {
      existing.tempMin = Math.min(existing.tempMin, entry.main?.temp_min ?? entry.main?.temp ?? existing.tempMin);
      existing.tempMax = Math.max(existing.tempMax, entry.main?.temp_max ?? entry.main?.temp ?? existing.tempMax);
    }
  });
  return Array.from(daily.values())
    .slice(0, days)
    .map((d) => ({
      date: new Date(d.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      tempMin: Math.round(d.tempMin),
      tempMax: Math.round(d.tempMax),
      condition: d.condition,
      icon: d.icon,
    }));
}

export function WeatherWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as unknown as WeatherWidgetSettings;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [locationDraft, setLocationDraft] = useState(settings.location || '');

  const fetchWeather = useCallback(async () => {
    if (!settings.location) {
      setError('Please enter a location');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (settings.apiKey) {
        // OpenWeatherMap path (free tier): geocoding + 3-hourly forecast endpoint
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(settings.location)}&limit=1&appid=${settings.apiKey}`
        );
        if (!geoResponse.ok) throw new Error('Location lookup failed');
        const geoData = await geoResponse.json();

        if (!geoData.length) {
          throw new Error('Location not found');
        }

        const { lat, lon, name, country } = geoData[0];

        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${settings.units}&appid=${settings.apiKey}`
        );
        if (!weatherResponse.ok) throw new Error('Weather request failed');
        const weatherData = await weatherResponse.json();

        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${settings.units}&appid=${settings.apiKey}`
        );
        const forecastData = forecastResponse.ok ? await forecastResponse.json() : null;
        const forecast = buildDailyForecast(forecastData?.list, settings.forecastDays, 'owm');

        setWeather({
          current: {
            temp: Math.round(weatherData.main.temp),
            condition: weatherData.weather[0].main,
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            windSpeed: Math.round(weatherData.wind?.speed ?? 0),
            feelsLike: Math.round(weatherData.main.feels_like),
            icon: weatherData.weather[0].icon,
          },
          forecast,
          location: `${name}, ${country}`,
        });
      } else {
        // Open-Meteo path: no API key required, works out of the box
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(settings.location)}&count=1&language=en&format=json`
        );
        if (!geoResponse.ok) throw new Error('Location lookup failed');
        const geoData = await geoResponse.json();
        const geo = geoData?.results?.[0];
        if (!geo) throw new Error('Location not found');

        const unitParam = settings.units === 'imperial' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : '';
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=${Math.max(settings.forecastDays, 3)}${unitParam}`
        );
        if (!weatherResponse.ok) throw new Error('Weather request failed');
        const data = await weatherResponse.json();

        const currentCondition = weatherCodeToCondition(data.current?.weather_code ?? 0);
        setWeather({
          current: {
            temp: Math.round(data.current.temperature_2m),
            condition: currentCondition,
            description: currentCondition,
            humidity: data.current.relative_humidity_2m ?? 0,
            windSpeed: Math.round(data.current.wind_speed_10m ?? 0),
            feelsLike: Math.round(data.current.apparent_temperature ?? data.current.temperature_2m),
            icon: currentCondition,
          },
          forecast: data.daily.time.slice(0, settings.forecastDays).map((date: string, i: number) => ({
            date: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            tempMin: Math.round(data.daily.temperature_2m_min[i]),
            tempMax: Math.round(data.daily.temperature_2m_max[i]),
            condition: weatherCodeToCondition(data.daily.weather_code[i]),
            icon: weatherCodeToCondition(data.daily.weather_code[i]),
          })),
          location: `${geo.name}, ${geo.country_code || ''}`.trim(),
        });
      }
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
    setLocationDraft(settings.location || '');
    setShowConfig((v) => !v);
  };

  const applyConfig = () => {
    onConfigChange({ ...settings, location: locationDraft.trim() || settings.location });
    setShowConfig(false);
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

      {showConfig && (
        <div className="p-4 bg-surface border-b border-border space-y-3">
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              value={locationDraft}
              onChange={(e) => setLocationDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyConfig()}
              placeholder="e.g., San Francisco, London, Tokyo"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Units</label>
            <div className="flex gap-2">
              {(['metric', 'imperial'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => onConfigChange({ ...settings, units: unit })}
                  className={cn(
                    'flex-1 py-1.5 px-3 rounded-lg border transition-all text-body-sm',
                    settings.units === unit
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface border-border text-text hover:bg-surface-hover'
                  )}
                >
                  {unit === 'metric' ? '°C' : '°F'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showForecastToggle"
              checked={settings.showForecast}
              onChange={(e) => onConfigChange({ ...settings, showForecast: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="showForecastToggle" className="text-body-sm text-text">Show forecast</label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={applyConfig} className="btn-primary text-body-sm">
              <Check className="w-3.5 h-3.5 mr-1" /> Save
            </button>
          </div>
        </div>
      )}

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
                    <div className="font-medium text-text">{weather.current.windSpeed} {settings.units === 'metric' ? 'km/h' : 'mph'}</div>
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