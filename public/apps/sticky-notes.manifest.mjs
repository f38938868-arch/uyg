export const manifest = {
  key: 'sticky-notes',
  title: 'Sticky Notes',
  icon: '📒',
  initialSize: { width: 360, height: 420 },
  load: async () => {
    const code = await fetch('/apps/sticky-notes.mjs', { cache: 'no-store' }).then(r => r.text());
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const mod = await import(url);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return mod;
  },
};
export default manifest;

