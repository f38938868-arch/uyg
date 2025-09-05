import React, { useMemo, useState } from 'react';

export const CalculatorApp: React.FC = () => {
  const [expr, setExpr] = useState<string>('');
  const [error, setError] = useState<string>('');

  const append = (t: string) => {
    setExpr((s) => (s + t).slice(0, 64));
  };
  const clearAll = () => { setExpr(''); setError(''); };
  const backspace = () => { setExpr((s) => s.slice(0, -1)); };
  const evaluate = () => {
    try {
      // Safe eval: parse simple math only
      if (/[^0-9+\-*/().%\s]/.test(expr)) throw new Error('Invalid input');
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict";return (${expr || '0'})`)();
      setExpr(String(val));
      setError('');
    } catch {
      setError('Error');
    }
  };

  const buttons = useMemo(() => [
    '7','8','9','/','4','5','6','*','1','2','3','-','0','.','%','+'
  ], []);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 20, minHeight: 28, textAlign: 'right' }}>{expr || '0'}</div>
        <div style={{ height: 16, color: '#fca5a5' }}>{error}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="win-btn" onClick={backspace} aria-label="Backspace">⌫</button>
          <button className="win-btn" onClick={clearAll} aria-label="Clear">C</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 12 }}>
        {buttons.map((b) => (
          <button key={b} className="task" onClick={() => append(b)}>{b}</button>
        ))}
        <button style={{ gridColumn: 'span 4' }} className="start" onClick={evaluate}>=</button>
      </div>
    </div>
  );
};


