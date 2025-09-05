import React, { useEffect, useRef, useState } from 'react';

export const PaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [size, setSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const pos = useRef<{ x: number; y: number } | null>(null);

  const start = (x: number, y: number) => {
    pos.current = { x, y };
    setDrawing(true);
  };
  const move = (x: number, y: number) => {
    if (!drawing || !pos.current) return;
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!ctx) return;
    ctx.strokeStyle = color; ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(pos.current.x, pos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    pos.current = { x, y };
  };
  const end = () => { setDrawing(false); pos.current = null; };

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, padding: 10, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <button className="win-btn" onClick={() => {
          const c = canvasRef.current; const ctx = c?.getContext('2d'); if (!c || !ctx) return;
          ctx.clearRect(0, 0, c.width, c.height);
        }}>Clear</button>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
          onPointerDown={(e) => { (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId); start(e.nativeEvent.offsetX, e.nativeEvent.offsetY); }}
          onPointerMove={(e) => move(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onPointerUp={(e) => { (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId); end(); }}
        />
      </div>
    </div>
  );
};


