import React, { useRef, useState } from 'react';

const ensureHttpUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isProbablyUrl = (raw: string): boolean => {
  const s = raw.trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (s.includes(' ')) return false;
  return s.includes('.') && !s.startsWith('.');
};

const buildSearchUrl = (query: string): string => {
  return `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
};

const mapToSupported = (raw: string): string => {
  const ensured = ensureHttpUrl(raw);
  try {
    const u = new URL(ensured);
    const host = u.hostname.toLowerCase();
    // Redirect Google to DuckDuckGo HTML (embed/search friendly)
    if (host === 'google.com' || host.endsWith('.google.com')) {
      const q = u.searchParams.get('q') ?? '';
      const pathPart = u.pathname === '/' ? '' : decodeURIComponent(u.pathname.replace(/^\//, ''));
      const query = q || pathPart;
      if (!query) return 'https://html.duckduckgo.com/html/';
      return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    }
    return ensured;
  } catch {
    return ensured;
  }
};

const normalizeInput = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const looksLikeUrl = /^https?:\/\//i.test(trimmed) || /\./.test(trimmed);
  if (looksLikeUrl) return ensureHttpUrl(trimmed);
  return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(trimmed)}`;
};

const toProxyUrl = (raw: string): string => {
  const supported = mapToSupported(raw);
  // r.jina.ai expects the scheme to be included literally after /http/
  // e.g. https://r.jina.ai/http/https://example.com
  return supported ? `https://r.jina.ai/http/${supported}` : '';
};

export const WebApp: React.FC = () => {
  const [input, setInput] = useState('https://example.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ready');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const attemptRef = useRef<number>(0);

  const loadInFrame = (value: string) => {
    const frame = iframeRef.current;
    if (!frame) return;
    const ensured = mapToSupported(normalizeInput(value));
    if (!ensured) return;
    const local = `/proxy?url=${encodeURIComponent(ensured)}`;

    setError(null);
    setLoading(true);
    attemptRef.current = 0;
    setStatus('Loading via local proxy…');
    frame.srcdoc = '';
    frame.src = local;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      setError('Load timed out');
      setStatus('Timeout');
    }, 5000);
  };

  return (
    <div className="web-app">
      <div style={{ display: 'flex', gap: 8, padding: 10, alignItems: 'center' }}>
        <input
          className="web-url"
          placeholder="Search or type URL and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const target = isProbablyUrl(input) ? ensureHttpUrl(input) : buildSearchUrl(input);
              if (target) window.open(target, '_blank', 'noopener,noreferrer');
            }
          }}
        />
        <button
          className="win-btn"
          onClick={() => {
            const target = isProbablyUrl(input) ? ensureHttpUrl(input) : buildSearchUrl(input);
            if (target) window.open(target, '_blank', 'noopener,noreferrer');
          }}
          aria-label="Open in new tab"
          title="Open in new tab"
        >
          ↗
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 10px 8px 10px', flexWrap: 'wrap' }}>
        {[
          { label: 'Wikipedia', url: 'https://wikipedia.org' },
          { label: 'Hacker News', url: 'https://news.ycombinator.com' },
          { label: 'MDN', url: 'https://developer.mozilla.org' },
        ].map((l) => (
          <button key={l.label} className="task" onClick={() => window.open(ensureHttpUrl(l.url), '_blank', 'noopener,noreferrer')}>{l.label}</button>
        ))}
      </div>
      <div style={{ padding: '0 12px 8px 12px', opacity: .85 }}>{loading ? status : ' '}</div>
      {error && <div style={{ padding: '0 12px 8px 12px', color: '#fca5a5' }}>Error: {error}</div>}
      <iframe
        ref={iframeRef}
        className="web-frame"
        title="Web"
        referrerPolicy="no-referrer"
        sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-modals"
        onLoad={() => { setLoading(false); setStatus(''); if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }}
        onError={() => { setLoading(false); setError('Could not load message'); }}
        srcdoc="<!doctype html><html><body style='font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 16px; color: #e6f1ff; background: transparent;'>Pages open in your browser now. Use the URL bar above or the quick links.</body></html>"
      />
    </div>
  );
};


