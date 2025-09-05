export const manifest = {
  key: 'tic-tac-toe',
  title: 'Tic Tac Toe',
  icon: '❌',
  initialSize: { width: 320, height: 380 },
  load: async () => {
    const code = await fetch('/apps/tic-tac-toe.mjs', { cache: 'no-store' }).then(r => r.text());
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const mod = await import(url);
    URL.revokeObjectURL(url);
    return mod;
  },
};
export default manifest;

