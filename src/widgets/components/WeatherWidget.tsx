import { useEffect, useState, useCallback } from 'react';
import { CloudSun, CloudRain, CloudSnow, Sun, Cloud, Droplets, Wind, Thermometer, RefreshCw, Settings, AlertCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import type { WidgetProps } from '../../types';

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
  };
  forecast: Array<{ date: string; tempMin: number; tempMax: number; condition: string }>;
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

const CONDITION_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties; 'aria-hidden'?: boolean }>> = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  drizzle: CloudRain,
  thunderstorm: CloudRain,
  snow: CloudSnow,
  mist: Cloud,
  fog: Cloud,
};

function conditionIcon(cond: string) {
  const key = cond.toLowerCase();
  for (const [k, v] of Object.entries(CONDITION_ICONS)) {
    if (key.includes(k)) return v;
  }
  return CloudSun;
}

function wmoToCondition(code: number): string {
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

function buildDailyForecast(list: any[] | undefined, days: number) {
  if (!Array.isArray(list)) return [];
  const daily = new Map<string, { tempMin: number; tempMax: number; condition: string; dt: number }>();
  list.forEach((e: any) => {
    const key = new Date(e.dt * 1000).toISOString().slice(0, 10);
    const cond = e.weather?.[0]?.main || 'Clouds';
    const existing = daily.get(key);
    if (!existing) {
      daily.set(key, { tempMin: e.main?.temp_min ?? e.main?.temp, tempMax: e.main?.temp_max ?? e.main?.temp, condition: cond, dt: e.dt });
    } else {
      existing.tempMin = Math.min(existing.tempMin, e.main?.temp_min ?? e.main?.temp ?? existing.tempMin);
      existing.tempMax = Math.max(existing.tempMax, e.main?.temp_max ?? e.main?.temp ?? existing.tempMax);
    }
  });
  return Array.from(daily.values()).slice(0, days).map((d) => ({
    date: new Date(d.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    tempMin: Math.round(d.tempMin),
    tempMax: Math.round(d.tempMax),
    condition: d.condition,
  }));
}

export function WeatherWidget({ config, onConfigChange, onRemove }: WidgetProps) {
  const settings = config.settings as unknown as WeatherWidgetSettings;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(!settings.location);
  const [locationDraft, setLocationDraft] = useState(settings.location || '');

  const unit = settings.units === 'imperial' ? '°F' : '°C';
  const windUnit = settings.units === 'imperial' ? 'mph' : 'km/h';

  const fetchWeather = useCallback(async () => {
    if (!settings.location) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      if (settings.apiKey) {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(settings.location)}&limit=1&appid=${settings.apiKey}`);
        if (!geoRes.ok) throw new Error('Location not found');
        const geo = await geoRes.json();
        if (!geo.length) throw new Error('Location not found');
        const { lat, lon, name, country } = geo[0];
        const [wRes, fRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${settings.units}&appid=${settings.apiKey}`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${settings.units}&appid=${settings.apiKey}`),
        ]);
        if (!wRes.ok) throw new Error('Weather request failed');
        const wd = await wRes.json();
        const fd = fRes.ok ? await fRes.json() : null;
        setWeather({
          current: { temp: Math.round(wd.main.temp), condition: wd.weather[0].main, description: wd.weather[0].description, humidity: wd.main.humidity, windSpeed: Math.round(wd.wind?.speed ?? 0), feelsLike: Math.round(wd.main.feels_like) },
          forecast: buildDailyForecast(fd?.list, settings.forecastDays),
          location: `${name}, ${country}`,
        });
      } else {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(settings.location)}&count=1`);
        if (!geoRes.ok) throw new Error('Location lookup failed');
        const geoData = await geoRes.json();
        const geo = geoData?.results?.[0];
        if (!geo) throw new Error('Location not found');
        const unitParam = settings.units === 'imperial' ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : '';
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=${Math.max(settings.forecastDays, 3)}${unitParam}`);
        if (!wRes.ok) throw new Error('Weather request failed');
        const data = await wRes.json();
        const cond = wmoToCondition(data.current?.weather_code ?? 0);
        setWeather({
          current: { temp: Math.round(data.current.temperature_2m), condition: cond, description: cond, humidity: data.current.relative_humidity_2m ?? 0, windSpeed: Math.round(data.current.wind_speed_10m ?? 0), feelsLike: Math.round(data.current.apparent_temperature ?? data.current.temperature_2m) },
          forecast: data.daily.time.slice(0, settings.forecastDays).map((date: string, i: number) => ({
            date: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            tempMin: Math.round(data.daily.temperature_2m_min[i]),
            tempMax: Math.round(data.daily.temperature_2m_max[i]),
            condition: wmoToCondition(data.daily.weather_code[i]),
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
      const id = setInterval(fetchWeather, settings.updateInterval * 1000);
      return () => clearInterval(id);
    }
  }, [fetchWeather, settings.updateInterval]);

  const applyConfig = () => {
    onConfigChange({ ...settings, location: locationDraft.trim() || settings.location });
    setShowConfig(false);
  };

  const CondIcon = weather ? conditionIcon(weather.current.condition) : CloudSun;

  return (
    <div className={cn('widget-card', 'weather-widget')} style={{ gap: '0' }}>
      {/* Header */}
      <div className="widget-header">
        <span className="widget-title">
          <CloudSun aria-hidden />
          Weather
        </span>
        <div className="widget-actions">
          <button onClick={fetchWeather} className="btn-icon" title="Refresh" aria-label="Refresh weather">
            <RefreshCw style={{ width: '13px', height: '13px' }} />
          </button>
          <button onClick={() => { setLocationDraft(settings.location || ''); setShowConfig((v) => !v); }} className="btn-icon" title="Configure" aria-label="Configure weather widget">
            <Settings style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      </div>

      {/* Config panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <div
              style={{
                padding: '0.625rem',
                marginBottom: '0.5rem',
                backgroundColor: 'var(--color-surface-secondary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <input
                type="text"
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyConfig()}
                placeholder="City, e.g. London"
                className="input"
                style={{ height: '34px', fontSize: '0.8125rem' }}
                autoFocus
                aria-label="Location"
              />
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {(['metric', 'imperial'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => onConfigChange({ ...settings, units: u })}
                      style={{
                        height: '28px',
                        padding: '0 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${settings.units === u ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: settings.units === u ? 'var(--color-primary-muted)' : 'transparent',
                        color: settings.units === u ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {u === 'metric' ? '°C' : '°F'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => setShowConfig(false)} className="btn-icon" aria-label="Cancel"><X style={{ width: '13px', height: '13px' }} /></button>
                  <button onClick={applyConfig} className="btn btn-primary btn-sm" style={{ height: '28px', padding: '0 0.625rem', fontSize: '0.75rem' }}>
                    <Check style={{ width: '12px', height: '12px' }} />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="scrollbar-thin">
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>
            <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => { setLocationDraft(settings.location || ''); setShowConfig(true); }} style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Fix</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0' }}>
              <div className="spinner" aria-label="Loading weather" />
            </motion.div>
          ) : weather ? (
            <motion.div key="weather" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Current conditions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <CondIcon style={{ width: '32px', height: '32px', color: 'var(--color-primary)', flexShrink: 0 }} aria-hidden />
                  <div>
                    <div className="tabular-nums" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.1 }}>
                      {weather.current.temp}{unit}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{weather.current.description}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)' }}>{weather.location}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Feels {weather.current.feelsLike}{unit}</div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {[
                  { Icon: Droplets, val: `${weather.current.humidity}%`, label: 'Humidity' },
                  { Icon: Wind, val: `${weather.current.windSpeed} ${windUnit}`, label: 'Wind' },
                ].map(({ Icon, val, label }) => (
                  <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-secondary)' }}>
                    <Icon style={{ width: '12px', height: '12px', color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden />
                    <div>
                      <div className="tabular-nums" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)' }}>{val}</div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Forecast */}
              {settings.showForecast && weather.forecast.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1875rem' }}>
                  {weather.forecast.map((day) => {
                    const FIcon = conditionIcon(day.condition);
                    return (
                      <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                        <FIcon style={{ width: '14px', height: '14px', color: 'var(--color-text-secondary)', flexShrink: 0 }} aria-hidden />
                        <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{day.date}</span>
                        <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{day.tempMin}°</span>
                        <span className="tabular-nums" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text)' }}>{day.tempMax}°</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : !error ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <CloudSun style={{ width: '28px', height: '28px' }} aria-hidden />
              <p className="empty-state-title">No location set</p>
              <button onClick={() => setShowConfig(true)} className="btn btn-secondary btn-sm" style={{ marginTop: '0.25rem' }}>
                Configure
              </button>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
