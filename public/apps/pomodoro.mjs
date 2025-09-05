const React = globalThis.React;

export default function Pomodoro() {
  const [seconds, setSeconds] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    // @ts-ignore
    timerRef.current = id;
    return () => clearInterval(id);
  }, [running]);
  React.useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return React.createElement('div', { style: { padding: 12, display: 'grid', gap: 10, placeItems: 'center' } },
    React.createElement('div', { style: { fontSize: 48, fontWeight: 800 } }, `${mm}:${ss}`),
    React.createElement('div', { style: { display: 'flex', gap: 8 } },
      React.createElement('button', { className: 'start', onClick: () => setRunning((r) => !r) }, running ? 'Pause' : 'Start'),
      React.createElement('button', { className: 'task', onClick: () => { setRunning(false); setSeconds(25 * 60); } }, 'Reset')
    )
  );
}

