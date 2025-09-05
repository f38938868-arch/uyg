const React = globalThis.React;

export default function Flappy() {
  const canvasRef = React.useRef(null);
  const [score, setScore] = React.useState(0);
  React.useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    let birdY = canvas.height / 2; let vel = 0; const g = 0.35; const jump = -6;
    let pipes = []; let tickN = 0; let alive = true; let lastScore = 0;
    function addPipe() {
      const gap = 110; const top = Math.random() * (canvas.height - gap - 60) + 30; const x = canvas.width + 20;
      pipes.push({ x, top, gap });
    }
    function loop() {
      if (!alive) return;
      tickN++; if (tickN % 110 === 0) addPipe();
      vel += g; birdY += vel;
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      // draw bird
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(60, birdY, 10, 0, Math.PI * 2); ctx.fill();
      // draw pipes
      ctx.fillStyle = '#22c55e';
      pipes.forEach((p) => {
        p.x -= 2.0;
        ctx.fillRect(p.x, 0, 30, p.top);
        ctx.fillRect(p.x, p.top + p.gap, 30, canvas.height - (p.top + p.gap));
        if (p.x + 30 < 60 && !p.counted) { p.counted = true; lastScore++; setScore(lastScore); }
        if (60 + 10 > p.x && 60 - 10 < p.x + 30) {
          if (birdY - 10 < p.top || birdY + 10 > p.top + p.gap) alive = false;
        }
      });
      pipes = pipes.filter((p) => p.x > -40);
      if (birdY > canvas.height - 10 || birdY < 10) alive = false;
      if (alive) requestAnimationFrame(loop);
      else {
        ctx.fillStyle = '#fca5a5'; ctx.font = '16px sans-serif'; ctx.fillText('Game Over - click to restart', 60, canvas.height / 2);
      }
    }
    const click = () => { if (!alive) { // reset
      birdY = canvas.height / 2; vel = 0; pipes = []; alive = true; lastScore = 0; setScore(0); requestAnimationFrame(loop);
    } else { vel = jump; } };
    canvas.addEventListener('click', click);
    requestAnimationFrame(loop);
    return () => { alive = false; canvas.removeEventListener('click', click); };
  }, []);
  return React.createElement('div', { style: { padding: 8, display: 'grid', gap: 8 } },
    React.createElement('div', { style: { fontWeight: 800 } }, `Score: ${score}`),
    React.createElement('canvas', { ref: canvasRef, width: 300, height: 360, style: { width: '100%', background: '#0b1220', borderRadius: 8 } })
  );
}

