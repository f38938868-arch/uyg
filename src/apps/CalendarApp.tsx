import React, { useMemo, useState } from 'react';

function getMonthMatrix(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export const CalendarApp: React.FC = () => {
  const today = new Date();
  const [offset, setOffset] = useState(0);
  const viewDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const matrix = useMemo(() => getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const isToday = (d: number | null) => d != null && today.getFullYear() === viewDate.getFullYear() && today.getMonth() === viewDate.getMonth() && today.getDate() === d;

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="win-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Prev">‹</button>
        <div style={{ fontWeight: 800 }}>{viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button className="win-btn" onClick={() => setOffset((o) => o + 1)} aria-label="Next">›</button>
        <button className="task" style={{ marginLeft: 'auto' }} onClick={() => setOffset(0)}>Today</button>
      </div>
      <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, opacity: .85 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <div key={d} style={{ textAlign: 'center' }}>{d}</div>)}
      </div>
      <div style={{ padding: '0 12px 12px 12px', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, overflow: 'auto' }}>
        {matrix.flat().map((d, i) => (
          <div key={i} style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', borderRadius: 10, height: 56, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 6, fontWeight: isToday(d) ? 800 : 500, color: isToday(d) ? '#64d3ff' : undefined }}>
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
};


