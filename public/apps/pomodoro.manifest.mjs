export const manifest = {
  key: 'pomodoro',
  title: 'Pomodoro',
  icon: '🍅',
  initialSize: { width: 320, height: 360 },
  load: async () => {
    const code = await fetch('/apps/pomodoro.mjs', { cache: 'no-store' }).then(r => r.text());
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const mod = await import(url);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return mod;
  },
};
export default manifest;

