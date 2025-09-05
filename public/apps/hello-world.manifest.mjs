export const manifest = {
  key: 'hello-world',
  title: 'Hello World',
  icon: '👋',
  initialSize: { width: 320, height: 220 },
  load: async () => {
    const code = await fetch('/apps/hello-world.mjs', { cache: 'no-store' }).then(r => r.text());
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const mod = await import(url);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return mod;
  },
};
export default manifest;

