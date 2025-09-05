import React, { useEffect, useRef, useState } from 'react';

type Pig = { x: number; y: number; r: number; alive: boolean };

export const AngryBirdsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dprRef = useRef<number>(1);

  // World state
  const birdRef = useRef({ x: 140, y: 260, vx: 0, vy: 0, r: 10, launched: false });
  const anchorRef = useRef({ x: 140, y: 260 });
  const groundYRef = useRef(320);
  const pigsRef = useRef<Pig[]>([]);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const scoreRef = useRef(0);
  const shotsRef = useRef(0);
  const maxShotsRef = useRef(3);
  const [level, setLevel] = useState(1);

  const pointerRef = useRef<{ dragging: boolean; id?: number }>({ dragging: false });

  const setupLevel = (lvl: number, w: number) => {
    // Reset bird
    const anchorX = Math.min(140, Math.max(100, w * 0.18));
    anchorRef.current = { x: anchorX, y: groundYRef.current - 60 };
    birdRef.current = { x: anchorRef.current.x, y: anchorRef.current.y, vx: 0, vy: 0, r: 12, launched: false };
    // Simple pig layout
    const baseX = Math.max(w * 0.58, 280);
    const gy = groundYRef.current;
    pigsRef.current = [
      { x: baseX + 0, y: gy - 16, r: 9, alive: true },
      { x: baseX + 32, y: gy - 16, r: 9, alive: true },
      { x: baseX + 16, y: gy - 36, r: 9, alive: true },
    ];
    if (lvl >= 2) {
      pigsRef.current.push({ x: baseX + 64, y: gy - 16, r: 9, alive: true });
      pigsRef.current.push({ x: baseX + 48, y: gy - 36, r: 9, alive: true });
    }
    if (lvl >= 3) {
      pigsRef.current.push({ x: baseX + 80, y: gy - 16, r: 9, alive: true });
      pigsRef.current.push({ x: baseX + 64, y: gy - 36, r: 9, alive: true });
      pigsRef.current.push({ x: baseX + 32, y: gy - 56, r: 9, alive: true });
    }
  };

  const reset = (advance = false) => {
    setShots(0);
    setScore(0);
    const c = canvasRef.current; if (!c) return;
    const w = c.clientWidth;
    if (advance) setLevel((l) => Math.min(l + 1, 3));
    const nextLevel = advance ? Math.min(level + 1, 3) : level;
    setupLevel(nextLevel, w);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      groundYRef.current = Math.floor(rect.height - 60);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setupLevel(level, rect.width);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const g = 0.7; // stronger gravity → harder arcs
    const restitution = 0.35; // less bouncy

    const step = () => {
      // Physics
      const bird = birdRef.current;
      const gy = groundYRef.current;
      if (bird.launched) {
        bird.vy += g;
        bird.x += bird.vx;
        bird.y += bird.vy;
        // Ground collision
        if (bird.y + bird.r > gy) {
          bird.y = gy - bird.r;
          bird.vy *= -restitution;
          bird.vx *= 0.98;
          if (Math.abs(bird.vy) < 0.6) bird.vy = 0;
          if (Math.abs(bird.vx) < 0.05) bird.vx = 0;
        }
        // Wall limits
        const width = canvas.clientWidth;
        if (bird.x - bird.r < 0) { bird.x = bird.r; bird.vx *= -restitution; }
        if (bird.x + bird.r > width) { bird.x = width - bird.r; bird.vx *= -restitution; }
      } else {
        // Snap to drag pos while not launched handled by pointer handlers
      }

      // Pig collisions
      pigsRef.current.forEach((p) => {
        if (!p.alive) return;
        const dx = p.x - bird.x; const dy = p.y - bird.y; const rsum = p.r + bird.r;
        if (dx*dx + dy*dy < rsum*rsum) {
          // Require sufficient impact speed to defeat a pig
          const speed = Math.hypot(bird.vx, bird.vy);
          if (speed > 3.6) {
            p.alive = false;
            setScore((s) => { const n = s + 100; scoreRef.current = n; return n; });
          }
          // bounce back a bit
          const mag = Math.max(1, Math.hypot(dx, dy));
          bird.vx += (-dx / mag) * 2;
          bird.vy += (-dy / mag) * 2;
        }
      });

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.clientWidth; const h = canvas.clientHeight;
      // Sky
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0b1020');
      grad.addColorStop(1, '#0a0f1c');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      // Ground
      ctx.fillStyle = 'rgba(100,200,120,0.3)';
      ctx.fillRect(0, gy, w, h - gy);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      // Slingshot bands
      ctx.strokeStyle = 'rgba(200,150,80,0.9)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(anchorRef.current.x - 6, anchorRef.current.y);
      ctx.lineTo(bird.x, bird.y);
      ctx.lineTo(anchorRef.current.x + 6, anchorRef.current.y);
      ctx.stroke();
      // Trajectory preview (dotted) while not launched
      if (!bird.launched) {
        const power = 0.30;
        let vx = (anchorRef.current.x - bird.x) * power;
        let vy = (anchorRef.current.y - bird.y) * power;
        let px = bird.x; let py = bird.y;
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        for (let i = 0; i < 40; i += 1) {
          // Integrate simple physics for preview
          vy += 0.7; // gravity should match g above
          px += vx; py += vy;
          if (py > gy) break;
          if (px < 0 || px > w) break;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Bird
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2); ctx.fill();
      // Pigs
      pigsRef.current.forEach((p) => {
        if (!p.alive) return;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.stroke();
      });
      // HUD
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 16);
      ctx.fillText(`Shots: ${shotsRef.current}/${maxShotsRef.current}`, 10, 32);
      ctx.fillText(`Level: ${level}`, 10, 48);

      // Win condition
      const allDead = pigsRef.current.every((p) => !p.alive);
      if (allDead) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 18px system-ui, -apple-system, Segoe UI, Roboto';
        ctx.fillText('Level Clear! Tap Reset to continue', 60, 24);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [level]);

  // Input handlers
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const bird = birdRef.current;
      // Allow rearm for another shot if available
      if (bird.launched && shotsRef.current < maxShotsRef.current) {
        bird.launched = false;
        bird.vx = 0; bird.vy = 0;
        bird.x = anchorRef.current.x; bird.y = anchorRef.current.y;
      }
      if (bird.launched) return;
      const dx = x - bird.x; const dy = y - bird.y;
      const dxa = x - anchorRef.current.x; const dya = y - anchorRef.current.y;
      const nearBird = dx*dx + dy*dy <= bird.r * bird.r * 4;
      const nearAnchor = dxa*dxa + dya*dya <= 80*80;
      if (nearBird || nearAnchor) {
        bird.x = x; bird.y = y; bird.vx = 0; bird.vy = 0;
        pointerRef.current = { dragging: true, id: e.pointerId };
        (e.target as any).setPointerCapture?.(e.pointerId);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pointerRef.current.dragging) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const bird = birdRef.current; const anchor = anchorRef.current;
      // limit drag radius
      const maxPull = 90;
      const dx = x - anchor.x; const dy = y - anchor.y;
      const dist = Math.hypot(dx, dy);
      if (dist > maxPull) {
        bird.x = anchor.x + (dx / dist) * maxPull;
        bird.y = anchor.y + (dy / dist) * maxPull;
      } else {
        bird.x = x; bird.y = y;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!pointerRef.current.dragging) return;
      pointerRef.current.dragging = false;
      const bird = birdRef.current; const anchor = anchorRef.current;
      const power = 0.30; // higher launch power for longer shots
      bird.vx = (anchor.x - bird.x) * power;
      bird.vy = (anchor.y - bird.y) * power;
      bird.launched = true;
      setShots((s) => { const n = s + 1; shotsRef.current = n; return n; });
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button className="start" onClick={() => reset(false)}>Reset</button>
        <button className="task" onClick={() => reset(true)}>Next level</button>
      </div>
    </div>
  );
};


