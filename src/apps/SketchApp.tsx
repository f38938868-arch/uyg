import React, { useEffect, useRef, useState } from 'react';

export const SketchApp: React.FC = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const pos = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(6);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr; c.height = r.height * dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize(); const ro = new ResizeObserver(resize); ro.observe(c);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const toXY = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      drawing.current = true;
      pos.current = toXY(e);
      (e.target as any).setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drawing.current || !pos.current) return;
      const p = toXY(e);
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pos.current.x, pos.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      pos.current = p;
    };
    const up = (e: PointerEvent) => {
      (e.target as any).releasePointerCapture?.(e.pointerId);
      drawing.current = false; pos.current = null;
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [color, size]);
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, padding: 10, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input type="range" min={1} max={30} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <button className="win-btn" onClick={() => { const c = ref.current; const ctx = c?.getContext('2d'); if (c && ctx) ctx.clearRect(0,0,c.width,c.height); }}>Clear</button>
      </div>
      <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};


