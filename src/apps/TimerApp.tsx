import React, { useEffect, useRef, useState } from 'react';

export const TimerApp: React.FC = () => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [running, setRunning] = useState(false);
  const endRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const totalMs = (minutes * 60 + seconds) * 1000;

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    if (endRef.current == null) endRef.current = start + totalMs;
    const tick = (now: number) => {
      const ms = Math.max(0, (endRef.current as number) - now);
      setRemaining(Math.ceil(ms / 1000));
      if (ms > 0) rafRef.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, totalMs]);

  useEffect(() => { if (!running) setRemaining(Math.max(0, Math.floor(totalMs / 1000))); }, [minutes, seconds, running, totalMs]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = Math.floor(remaining % 60).toString().padStart(2, '0');

  const reset = () => { setRunning(false); endRef.current = null; setRemaining(Math.max(0, Math.floor(totalMs / 1000))); };

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
      <div style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <label>Min<input className="web-url" type="number" min={0} value={minutes} onChange={(e) => setMinutes(Math.max(0, Number(e.target.value)))} style={{ width: 80, marginLeft: 6 }} /></label>
        <label>Sec<input className="web-url" type="number" min={0} max={59} value={seconds} onChange={(e) => setSeconds(Math.min(59, Math.max(0, Number(e.target.value))))} style={{ width: 80, marginLeft: 6 }} /></label>
      </div>
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 800 }}>{mm}:{ss}</div>
      </div>
      <div style={{ padding: 10, display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button className="start" onClick={() => { endRef.current = null; setRunning(true); }}>Start</button>
        <button className="task" onClick={() => setRunning(false)}>Pause</button>
        <button className="win-btn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
};


