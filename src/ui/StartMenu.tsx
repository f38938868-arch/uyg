import React from 'react';
import { appsCatalog, LaunchableApp as CatalogApp } from '../apps/catalog';

export type LaunchableApp = CatalogApp;

type Props = {
  open: boolean;
  onClose: () => void;
  onLaunch: (app: LaunchableApp) => void;
  variant?: 'overlay' | 'embedded';
};

export const StartMenu: React.FC<Props> = ({ open, onClose, onLaunch, variant = 'overlay' }) => {
  const ensureHttpUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener('storage', onChange);
    window.addEventListener('appstore:updated', onChange as EventListener);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('appstore:updated', onChange as EventListener);
    };
  }, []);

  // Cached Blob URL helper to avoid premature revocation and repeated imports
  const getCachedBlobUrl = (key: string, code: string): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    g.__nebulaBlobCache = g.__nebulaBlobCache || new Map<string, { url: string; timeout: any }>();
    const cache: Map<string, { url: string; timeout: any }> = g.__nebulaBlobCache;
    const existing = cache.get(key);
    if (existing) {
      clearTimeout(existing.timeout);
      existing.timeout = setTimeout(() => { URL.revokeObjectURL(existing.url); cache.delete(key); }, 60000);
      return existing.url;
    }
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    const timeout = setTimeout(() => { URL.revokeObjectURL(url); cache.delete(key); }, 60000);
    cache.set(key, { url, timeout });
    return url;
  };

  const apps: LaunchableApp[] = (() => {
    try {
      const raw = localStorage.getItem('appstore.installed.v1');
      const installed = raw ? JSON.parse(raw) as any[] : [];
      const dynamic = installed.map((entry) => {
        const key: string = entry.key ?? entry.manifest?.key;
        const title: string = entry.title ?? entry.manifest?.title ?? 'App';
        const icon: string = entry.icon ?? entry.manifest?.icon ?? '🧩';
        const initialSize = entry.initialSize ?? entry.manifest?.initialSize;
        const manifestUrl: string | undefined = entry.manifestUrl;
        const lazyNode = React.createElement(React.lazy(async () => {
          if (!manifestUrl) {
            const mod = await (entry.manifest?.load?.() ?? Promise.resolve({ default: () => React.createElement('div', null, 'Invalid manifest') }));
            return 'default' in mod ? mod as any : { default: mod };
          }
          const code = entry.inlineManifestCode ?? await fetch(
            /^https?:\/\//i.test(manifestUrl) ? manifestUrl : `${location.origin}${manifestUrl.startsWith('/') ? '' : '/'}${manifestUrl}`,
            { cache: 'no-store' }
          ).then((r) => r.text());
          const blobKey = `${key}:manifest`;
          const blobUrl = getCachedBlobUrl(blobKey, code);
          const manMod: any = await import(/* @vite-ignore */ blobUrl);
          const manifest = manMod?.default ?? manMod?.manifest ?? manMod;
          const compOrModule = await manifest.load();
          return 'default' in compOrModule ? compOrModule : { default: compOrModule };
        })) as any;
        return { key, title, icon, initialSize, content: lazyNode } as LaunchableApp;
      });
      return [...appsCatalog, ...dynamic];
    } catch {
      return appsCatalog;
    }
  })();

  if (variant === 'embedded') {
    return (
      <div className="embedded-grid">
        {apps.map((app) => (
          <button key={app.key} className="start-app" onClick={() => onLaunch(app)}>
            <span className="start-app-icon">{app.icon}</span>
            <span className="start-app-title">{app.title}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`start-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="start-menu" onClick={(e) => e.stopPropagation()}>
        <div className="start-grid">
          {apps.map((app) => (
            <button key={app.key} className="start-app" onClick={() => onLaunch(app)}>
              <span className="start-app-icon">{app.icon}</span>
              <span className="start-app-title">{app.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


