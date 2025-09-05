import React, { useEffect, useMemo, useRef, useState } from 'react';

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

type CurrentWeather = {
  temperature_2m: number;
  wind_speed_10m: number;
  weather_code: number;
};

type DailyWeather = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
};

const STORAGE_KEY = 'weather.lastCity.v1';

const wmoCode: Record<number, { text: string; emoji: string }> = {
  0: { text: 'Clear', emoji: '☀️' },
  1: { text: 'Mainly clear', emoji: '🌤️' },
  2: { text: 'Partly cloudy', emoji: '⛅' },
  3: { text: 'Overcast', emoji: '☁️' },
  45: { text: 'Fog', emoji: '🌫️' },
  48: { text: 'Depositing rime fog', emoji: '🌫️' },
  51: { text: 'Drizzle', emoji: '🌦️' },
  53: { text: 'Drizzle', emoji: '🌦️' },
  55: { text: 'Drizzle', emoji: '🌦️' },
  56: { text: 'Freezing drizzle', emoji: '🌧️' },
  57: { text: 'Freezing drizzle', emoji: '🌧️' },
  61: { text: 'Rain', emoji: '🌧️' },
  63: { text: 'Rain', emoji: '🌧️' },
  65: { text: 'Rain', emoji: '🌧️' },
  66: { text: 'Freezing rain', emoji: '🌧️' },
  67: { text: 'Freezing rain', emoji: '🌧️' },
  71: { text: 'Snow', emoji: '🌨️' },
  73: { text: 'Snow', emoji: '🌨️' },
  75: { text: 'Snow', emoji: '🌨️' },
  77: { text: 'Snow grains', emoji: '🌨️' },
  80: { text: 'Rain showers', emoji: '🌦️' },
  81: { text: 'Rain showers', emoji: '🌦️' },
  82: { text: 'Rain showers', emoji: '🌦️' },
  85: { text: 'Snow showers', emoji: '🌨️' },
  86: { text: 'Snow showers', emoji: '🌨️' },
  95: { text: 'Thunderstorm', emoji: '⛈️' },
  96: { text: 'Thunderstorm', emoji: '⛈️' },
  99: { text: 'Thunderstorm', emoji: '⛈️' },
};

function describe(code: number): { text: string; emoji: string } {
  return wmoCode[code] ?? { text: 'Weather', emoji: '🌡️' };
}

export const WeatherApp: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<GeoResult | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyWeather | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GeoResult;
        setCity(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!city) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(city)); } catch {}
    void fetchWeather(city.latitude, city.longitude);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.latitude, city?.longitude]);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lon));
      url.searchParams.set('current', 'temperature_2m,wind_speed_10m,weather_code');
      url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
      url.searchParams.set('timezone', 'auto');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const cw: CurrentWeather = data.current;
      const dw: DailyWeather = data.daily;
      setCurrent(cw);
      setDaily(dw);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const searchCities = async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.searchParams.set('name', q.trim());
      url.searchParams.set('count', '5');
      url.searchParams.set('language', 'en');
      url.searchParams.set('format', 'json');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const results = (data.results ?? []) as any[];
      const mapped: GeoResult[] = results.map((r) => ({
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country,
        admin1: r.admin1,
      }));
      setSuggestions(mapped);
    } catch (e) {
      setSuggestions([]);
    }
  };

  const onQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { void searchCities(val); }, 300);
  };

  const header = useMemo(() => {
    if (!current) return null;
    const d = describe(current.weather_code);
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontSize: 42 }}>{d.emoji}</div>
        <div style={{ fontSize: 36, fontWeight: 800 }}>{Math.round(current.temperature_2m)}°</div>
        <div style={{ opacity: .9 }}>{d.text} • Wind {Math.round(current.wind_speed_10m)} km/h</div>
      </div>
    );
  }, [current]);

  return (
    <div className="web-app" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: 10, alignItems: 'center' }}>
        <input
          className="web-url"
          placeholder="Search city (e.g., London)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions[0]) setCity(suggestions[0]);
          }}
        />
        <button className="win-btn" onClick={() => { if (suggestions[0]) setCity(suggestions[0]); }} aria-label="Use first result">↵</button>
      </div>
      {suggestions.length > 0 && (
        <div style={{ padding: '0 10px 10px 10px', display: 'grid', gap: 8 }}>
          {suggestions.map((s, i) => (
            <button key={`${s.name}-${i}`} className="task" onClick={() => setCity(s)}>
              {s.name}{s.admin1 ? `, ${s.admin1}` : ''}{s.country ? `, ${s.country}` : ''}
            </button>
          ))}
        </div>
      )}
      {city && (
        <div style={{ padding: '0 12px', display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 800, letterSpacing: .2 }}>{city.name}{city.admin1 ? `, ${city.admin1}` : ''}{city.country ? `, ${city.country}` : ''}</div>
          {loading && <div style={{ opacity: .85 }}>Loading weather…</div>}
          {error && <div style={{ color: '#fca5a5' }}>Error: {error}</div>}
          {!loading && current && header}
        </div>
      )}
      {daily && (
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 8, overflow: 'auto' }}>
          {daily.time.map((t, idx) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10 }}>
              <div style={{ width: 90, opacity: .9 }}>{new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              <div style={{ fontSize: 22 }}>{describe(daily.weather_code[idx]).emoji}</div>
              <div style={{ marginLeft: 'auto' }}>{Math.round(daily.temperature_2m_min[idx])}° / {Math.round(daily.temperature_2m_max[idx])}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


