const React = globalThis.React;

export default function Snake() {
  const canvasRef = React.useRef(null);
  const [score, setScore] = React.useState(0);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 16; const cols = Math.floor(canvas.width / size); const rows = Math.floor(canvas.height / size);
    let snake = [{ x: 5, y: 5 }];
    let dir = { x: 1, y: 0 };
    let food = spawn();
    let running = true;
    function spawn() {
      return { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    }
    function tick() {
      if (!running) return;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0) head.x = cols - 1; if (head.x >= cols) head.x = 0;
      if (head.y < 0) head.y = rows - 1; if (head.y >= rows) head.y = 0;
      if (snake.some(s => s.x === head.x && s.y === head.y)) { running = false; return; }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) { setScore((s) => s + 1); food = spawn(); }
      else snake.pop();
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#38bdf8'; snake.forEach(s => ctx.fillRect(s.x * size, s.y * size, size - 2, size - 2));
      ctx.fillStyle = '#f97316'; ctx.fillRect(food.x * size, food.y * size, size - 2, size - 2);
      setTimeout(tick, 80);
    }
    const key = (e) => {
      if (e.key === 'ArrowUp' && dir.y !== 1) dir = { x: 0, y: -1 };
      else if (e.key === 'ArrowDown' && dir.y !== -1) dir = { x: 0, y: 1 };
      else if (e.key === 'ArrowLeft' && dir.x !== 1) dir = { x: -1, y: 0 };
      else if (e.key === 'ArrowRight' && dir.x !== -1) dir = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', key);
    tick();
    return () => { running = false; window.removeEventListener('keydown', key); };
  }, []);
  return React.createElement('div', { style: { padding: 8, display: 'grid', gap: 8 } },
    React.createElement('div', { style: { fontWeight: 800 } }, `Score: ${score}`),
    React.createElement('canvas', { ref: canvasRef, width: 300, height: 300, style: { width: '100%', background: '#0b1220', borderRadius: 8 } })
  );
}

