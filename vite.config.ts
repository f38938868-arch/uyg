import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Simple dev-only proxy to load external pages via same-origin
const localProxy = (): Plugin => ({
  name: 'local-proxy',
  configureServer(server) {
    server.middlewares.use('/proxy', async (req, res) => {
      try {
        const url = new URL(req.url ?? '', 'http://localhost');
        const raw = url.searchParams.get('url');
        if (!raw) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Missing url');
          return;
        }
        const target = raw.startsWith('http') ? raw : `https://${raw}`;
        const response = await fetch(target, {
          headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9'
          }
        });
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        const base = `<base href="${target}">`;
        const html = /<head[^>]*>/i.test(text)
          ? text.replace(/<head[^>]*>/i, (m) => `${m}${base}`)
          : `<!doctype html><html><head>${base}</head><body>${text}</body></html>`;
        res.statusCode = response.status;
        res.setHeader('Content-Type', contentType.includes('html') ? 'text/html; charset=utf-8' : 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(html);
      } catch (e) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<!doctype html><html><body>Proxy error</body></html>`);
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localProxy()],
});


