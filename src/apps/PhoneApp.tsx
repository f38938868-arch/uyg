import React, { useEffect, useMemo, useState } from 'react';

type RecentCall = {
  id: string;
  phoneNumber: string;
  timestampMs: number;
};

const STORAGE_KEY = 'phone.recents.v1';

const loadRecents = (): RecentCall[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentCall[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const saveRecents = (recents: RecentCall[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recents));
  } catch {
    // ignore
  }
};

export const PhoneApp: React.FC = () => {
  const [inputNumber, setInputNumber] = useState<string>('');
  const [recents, setRecents] = useState<RecentCall[]>([]);

  useEffect(() => {
    setRecents(loadRecents());
  }, []);

  useEffect(() => {
    saveRecents(recents);
  }, [recents]);

  const keypad: string[] = useMemo(() => [
    '1','2','3',
    '4','5','6',
    '7','8','9',
    '*','0','#'
  ], []);

  const appendDigit = (digit: string) => {
    setInputNumber((prev) => (prev + digit).slice(0, 32));
  };

  const backspace = () => setInputNumber((prev) => prev.slice(0, -1));
  const clearAll = () => setInputNumber('');

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleString();
  };

  const placeCall = () => {
    const trimmed = inputNumber.trim();
    if (!trimmed) return;
    const entry: RecentCall = { id: Math.random().toString(36).slice(2), phoneNumber: trimmed, timestampMs: Date.now() };
    setRecents((prev) => [entry, ...prev].slice(0, 20));
    try {
      // Prefer FaceTime Audio on macOS, fallback to tel: elsewhere
      const ua = navigator.userAgent || '';
      const isMac = /Macintosh|Mac OS X/i.test(ua);
      const target = isMac
        ? `facetime-audio://${encodeURIComponent(trimmed)}`
        : `tel:${encodeURIComponent(trimmed)}`;
      window.location.href = target;
    } catch {
      // ignore
    }
  };

  const deleteRecent = (id: string) => {
    setRecents((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 22, minHeight: 28, textAlign: 'center', letterSpacing: 1 }}>{inputNumber || 'Enter number'}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <button className="win-btn" onClick={backspace} aria-label="Backspace">⌫</button>
          <button className="win-btn" onClick={clearAll} aria-label="Clear">C</button>
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {keypad.map((k) => (
            <button key={k} className="start" onClick={() => appendDigit(k)}>{k}</button>
          ))}
          <button style={{ gridColumn: 'span 3', fontWeight: 700 }} className="task" onClick={placeCall}>Call</button>
        </div>
      </div>
      <div style={{ overflow: 'auto', padding: '0 10px 10px 10px' }}>
        <div style={{ opacity: .9, marginBottom: 8 }}>Recents</div>
        {recents.length === 0 && (
          <div style={{ opacity: .7 }}>No recent calls yet</div>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {recents.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10 }}>
              <div style={{ fontWeight: 700 }}>{r.phoneNumber}</div>
              <div style={{ marginLeft: 'auto', opacity: .8, fontSize: 12 }}>{formatTime(r.timestampMs)}</div>
              <button className="win-btn" onClick={() => setInputNumber(r.phoneNumber)} aria-label="Use number">↺</button>
              <button className="win-btn close" onClick={() => deleteRecent(r.id)} aria-label="Delete">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


