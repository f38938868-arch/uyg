export const manifest = {
  key: 'flappy',
  title: 'Flappy',
  icon: '🐤',
  initialSize: { width: 340, height: 420 },
  load: async () => {
    const code = await fetch('/apps/flappy.mjs', { cache: 'no-store' }).then(r => r.text());
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const mod = await import(url);
    URL.revokeObjectURL(url);
    return mod;
  },
};
export default manifest;

