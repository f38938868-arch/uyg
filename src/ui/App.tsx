import React, { useState } from 'react';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { WindowManager, WindowDescriptor } from './WindowManager';
import { appsCatalog } from '../apps/catalog';
import { TopBar } from './TopBar';

export const App: React.FC = () => {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [windows, setWindows] = useState<WindowDescriptor[]>([]);
  const [focusId, setFocusId] = useState<string | undefined>(undefined);
  const [wallpaperClass, setWallpaperClass] = useState<string>(() => {
    try { return localStorage.getItem('wallpaper.style.v1') || 'wallpaper-azure'; } catch { return 'wallpaper-azure'; }
  });
  const [customUrl, setCustomUrl] = useState<string>(() => {
    try { return localStorage.getItem('wallpaper.custom.url') || ''; } catch { return ''; }
  });

  React.useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      if (typeof key === 'string') setWallpaperClass(key);
    };
    const imgHandler = (e: Event) => {
      const url = (e as CustomEvent<string>).detail;
      if (typeof url === 'string') setCustomUrl(url);
    };
    window.addEventListener('wallpaper:change', handler as EventListener);
    window.addEventListener('wallpaper:setImage', imgHandler as EventListener);
    return () => {
      window.removeEventListener('wallpaper:change', handler as EventListener);
      window.removeEventListener('wallpaper:setImage', imgHandler as EventListener);
    };
  }, []);

  // Allow external requests to launch apps by key (from App Store or others)
  React.useEffect(() => {
    const handler = async (e: Event) => {
      const key = (e as CustomEvent<{ key: string }>).detail?.key;
      if (!key) return;
      // Try static catalog first
      const staticApp = appsCatalog.find((a) => a.key === key);
      if (staticApp) {
        setWindows((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            title: staticApp.title,
            icon: staticApp.icon,
            content: staticApp.content,
            initialSize: staticApp.initialSize,
          },
        ]);
        return;
      }
      // Dynamic installed apps
      try {
        const raw = localStorage.getItem('appstore.installed.v1');
        const installed = raw ? (JSON.parse(raw) as any[]) : [];
        const entry = installed.find((it) => (it.key ?? it.manifest?.key) === key);
        if (!entry) return;
        const title: string = entry.title ?? entry.manifest?.title ?? 'App';
        const icon: string = entry.icon ?? entry.manifest?.icon ?? '🧩';
        const initialSize = entry.initialSize ?? entry.manifest?.initialSize;
        const manifestUrl: string | undefined = entry.manifestUrl;
        const node = React.createElement(
          React.lazy(async () => {
            if (!manifestUrl) {
              const mod = await (entry.manifest?.load?.() ?? Promise.resolve({ default: () => React.createElement('div', null, 'Invalid manifest') }));
              return 'default' in mod ? (mod as any) : { default: mod };
            }
            const code =
              entry.inlineManifestCode ??
              (await fetch(
                /^https?:\/\//i.test(manifestUrl) ? manifestUrl : `${location.origin}${manifestUrl.startsWith('/') ? '' : '/'}${manifestUrl}`,
                { cache: 'no-store' }
              ).then((r) => r.text()));
            const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
            const manMod: any = await import(/* @vite-ignore */ url);
            setTimeout(() => URL.revokeObjectURL(url), 0);
            const manifest = manMod?.default ?? manMod?.manifest ?? manMod;
            const compOrModule = await manifest.load();
            return 'default' in compOrModule ? compOrModule : { default: compOrModule };
          })
        );
        setWindows((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            title,
            icon,
            content: node,
            initialSize,
          },
        ]);
      } catch {}
    };
    window.addEventListener('app:launch', handler as EventListener);
    return () => window.removeEventListener('app:launch', handler as EventListener);
  }, []);

  return (
    <div className="os-root">
      <div className={`wallpaper ${wallpaperClass}`} style={wallpaperClass === 'wallpaper-custom' && customUrl ? { backgroundImage: `url(${customUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
      <TopBar />
      {/* Embedded Apps menu in center */}
      {!isStartOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: windows.every(w => w.minimized) || windows.length === 0 ? 'auto' : 'none' }}>
          <StartMenu open={true} onLaunch={(app) => {
              setWindows((prev) => [
                ...prev,
                {
                  id: Math.random().toString(36).slice(2),
                  title: app.title,
                  icon: app.icon,
                  content: app.content,
                  initialSize: app.initialSize,
                },
              ]);
            }} onClose={() => {}} variant="embedded" />
        </div>
      )}
      <WindowManager windows={windows} setWindows={setWindows} focusRequestId={focusId} />
      <StartMenu
        open={isStartOpen}
        onLaunch={(app) => {
          setWindows((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).slice(2),
              title: app.title,
              icon: app.icon,
              content: app.content,
              initialSize: app.initialSize,
            },
          ]);
          setIsStartOpen(false);
        }}
        onClose={() => setIsStartOpen(false)}
        variant="overlay"
      />
      <Taskbar
        onStart={() => setIsStartOpen((v) => !v)}
        windows={windows}
        onFocus={(id) => {
          // Request focus/unminimize
          setFocusId(id);
          setWindows((prev) => prev.map((w) => ({ ...w, minimized: w.id === id ? false : w.minimized, focused: w.id === id })));
          // Clear the request after a tick
          setTimeout(() => setFocusId(undefined), 0);
        }}
      />
    </div>
  );
};

// HomeWidgets removed per request


