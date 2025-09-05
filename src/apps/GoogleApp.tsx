import React, { useEffect, useRef, useState } from 'react';

export const GoogleApp: React.FC = () => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const load = (url: string) => {
    const frame = iframeRef.current;
    if (!frame) return;
    setStatus('Loading Google…');
    setError(null);
    frame.src = `/proxy?url=${encodeURIComponent(url)}`;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setStatus('Trying fallback…');
      frame.src = `https://r.jina.ai/http/${url}`;
      timeoutRef.current = window.setTimeout(() => {
        setStatus('');
        setError('Could not load Google inside the window.');
      }, 3500);
    }, 3500);
  };

  useEffect(() => {
    // Try Google with iframe-friendly flag
    load('https://www.google.com/webhp?igu=1');
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, []);

  const onSearch = () => {
    if (!q.trim()) return;
    load(`https://www.google.com/search?igu=1&q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="web-app" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: 10, alignItems: 'center' }}>
        <input
          className="web-url"
          placeholder="Search Google"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
        />
        <button className="win-btn" onClick={onSearch} aria-label="Search">🔎</button>
        <a className="win-btn" href="https://www.google.com" target="_blank" rel="noopener noreferrer" aria-label="Open in new tab" title="Open in new tab">↗</a>
      </div>
      <div style={{ padding: '0 12px 8px 12px', opacity: .85 }}>{status}</div>
      {error && <div style={{ padding: '0 12px 8px 12px', color: '#fca5a5' }}>{error}</div>}
      <iframe
        ref={iframeRef}
        className="web-frame"
        title="Google"
        referrerPolicy="no-referrer"
        sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-modals"
        onLoad={() => { setStatus(''); if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }}
        onError={() => { setStatus(''); setError('Load error'); }}
      />
    </div>
  );
};


