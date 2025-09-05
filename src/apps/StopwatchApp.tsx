import React, { useEffect, useRef, useState } from 'react';

export const StopwatchApp: React.FC = () => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now - elapsedMs;
      setElapsedMs(now - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running]);

  const reset = () => { setRunning(false); setElapsedMs(0); startRef.current = null; };

  const minutes = Math.floor(elapsedMs / 60000).toString().padStart(2, '0');
  const seconds = Math.floor((elapsedMs % 60000) / 1000).toString().padStart(2, '0');
  const millis = Math.floor((elapsedMs % 1000) / 10).toString().padStart(2, '0');

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%', placeItems: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: 1 }}>{minutes}:{seconds}.{millis}</div>
      <div style={{ padding: 12, display: 'flex', gap: 8 }}>
        <button className="start" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Start'}</button>
        <button className="task" onClick={reset}>Reset</button>
      </div>
    </div>
  );
};


