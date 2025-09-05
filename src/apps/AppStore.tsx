import React, { useEffect, useState } from 'react';
import { Registry, AppManifest, InstalledApp } from './registry';

export const AppStore: React.FC = () => {
  const [url, setUrl] = useState('');
  const [installed, setInstalled] = useState<InstalledApp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [catalogUrl, setCatalogUrl] = useState('/catalog/apps.json');
  const [catalog, setCatalog] = useState<Array<{ manifestUrl: string; title?: string; icon?: string }>>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const refresh = () => setInstalled(Registry.list());
  useEffect(() => { refresh(); }, []);

  const installFromUrl = async (override?: string) => {
    const raw = (override ?? url).trim(); if (!raw) return;
    const safeUrl = /^https?:\/\//i.test(raw) ? raw : `${location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
    try {
      setError(null);
      // Fetch and import via blob URL to avoid Vite public import restriction
      const res = await fetch(safeUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const code = await res.text();
      const blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      const mod: any = await import(/* @vite-ignore */ blobUrl);
      const manifest: AppManifest = (mod?.default ?? mod?.manifest ?? mod) as AppManifest;
      if (!manifest || !manifest.key || !manifest.title || !manifest.icon || !manifest.load) throw new Error('Invalid manifest');
      await Registry.installFromManifest(manifest, safeUrl, { inlineManifestCode: code });
      window.dispatchEvent(new Event('appstore:updated'));
      URL.revokeObjectURL(blobUrl);
      setUrl('');
      refresh();
    } catch (e: any) {
      setError(e?.message || 'Install failed');
    }
  };

  const installFromFile = async (file: File) => {
    try {
      setError(null);
      const raw = await file.text();
      const preprocessed = (() => {
        let txt = raw;
        // Strip React imports and map React to global
        txt = txt.replace(/\n\s*import\s+React[^\n]*\n/g, '\n');
        txt = txt.replace(/\n\s*import\s+\{[^}]*\}\s+from\s+['\"]react['\"];?\s*\n/g, '\n');
        if (!/globalThis\.React/.test(txt)) {
          txt = `const React = globalThis.React;\n` + txt;
        }
        return txt;
      })();

      // Try to import as-is (may be a manifest module)
      const blobUrl = URL.createObjectURL(new Blob([preprocessed], { type: 'text/javascript' }));
      let mod: any;
      try { mod = await import(/* @vite-ignore */ blobUrl); } finally { URL.revokeObjectURL(blobUrl); }

      const maybe = mod?.default ?? mod?.manifest ?? mod;
      const isManifestObject = maybe && typeof maybe === 'object' && 'load' in maybe && 'key' in maybe && 'title' in maybe && 'icon' in maybe;

      if (isManifestObject) {
        const manifest = maybe as AppManifest;
        await Registry.installFromManifest(manifest, `file://${file.name}`, { inlineManifestCode: preprocessed });
        window.dispatchEvent(new Event('appstore:updated'));
        refresh();
        return;
      }

      // Otherwise, treat it as a component module → generate inline manifest code that bundles the component
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const key = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my-app';
      const title = baseName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      const componentLiteral = JSON.stringify(preprocessed);
      const manifestCode = `export default {\n  key: ${JSON.stringify(key)},\n  title: ${JSON.stringify(title)},\n  icon: '🧩',\n  initialSize: { width: 360, height: 420 },\n  load: async () => {\n    const url = URL.createObjectURL(new Blob([${componentLiteral}], { type: 'text/javascript' }));\n    const mod = await import(url);\n    URL.revokeObjectURL(url);\n    return { default: mod.default || mod };\n  }\n};`;

      const mfBlob = URL.createObjectURL(new Blob([manifestCode], { type: 'text/javascript' }));
      let mfMod: any;
      try { mfMod = await import(/* @vite-ignore */ mfBlob); } finally { URL.revokeObjectURL(mfBlob); }
      const manifest: AppManifest = (mfMod?.default ?? mfMod?.manifest ?? mfMod) as AppManifest;
      await Registry.installFromManifest(manifest, `file://${file.name}`, { inlineManifestCode: manifestCode });
      window.dispatchEvent(new Event('appstore:updated'));
      refresh();
    } catch (e: any) {
      setError(e?.message || 'Install from file failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchCatalog = async () => {
    try {
      setError(null);
      const res = await fetch(catalogUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Array<{ manifestUrl: string; title?: string; icon?: string }>;
      if (!Array.isArray(data)) throw new Error('Invalid catalog');
      setCatalog(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load catalog');
      setCatalog([]);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto auto 1fr', gap: 8, height: '100%' }}>
      <div style={{ padding: 14, fontWeight: 800, fontSize: 18 }}>App Store</div>
      <div style={{ padding: '0 12px', display: 'flex', gap: 8 }}>
        <input className="web-url" style={{ borderRadius: 12 }} placeholder="Search or enter manifest URL" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') installFromUrl(); }} />
        <button className="start" onClick={() => installFromUrl()}>GET</button>
        <input ref={fileInputRef} type="file" accept=".mjs,.js" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) installFromFile(f); }} />
        <button className="task" onClick={() => fileInputRef.current?.click()}>Install from File</button>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) installFromFile(f); }}
        style={{ margin: '0 12px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 12, textAlign: 'center', background: isDragging ? 'rgba(255,255,255,0.08)' : 'transparent' }}
      >
        Drop a .mjs/.js file here to install instantly
      </div>
      <div style={{ padding: '0 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="web-url" style={{ borderRadius: 12 }} placeholder="Catalog URL" value={catalogUrl} onChange={(e) => setCatalogUrl(e.target.value)} />
        <button className="task" onClick={fetchCatalog}>Load</button>
      </div>
      {error && <div style={{ padding: '0 12px', color: '#fca5a5' }}>Error: {error}</div>}
      <div style={{ padding: 12, overflow: 'auto', display: 'grid', gap: 16 }}>
        {catalog.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ opacity: .85 }}>Featured</div>
            {catalog.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', fontSize: 22 }}>{item.icon ?? '🧩'}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title ?? item.manifestUrl}</div>
                  <div style={{ opacity: .7, fontSize: 12 }}>From manifest</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <button className="start" onClick={() => installFromUrl(item.manifestUrl)}>GET</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ opacity: .85 }}>Installed</div>
          {installed.map((app) => (
            <div key={app.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', fontSize: 22 }}>{app.icon}</div>
              <div style={{ fontWeight: 700 }}>{app.title}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="start" onClick={() => window.dispatchEvent(new CustomEvent('app:launch', { detail: { key: app.key } }))}>Open</button>
                <a className="task" href={app.manifestUrl} target="_blank" rel="noopener noreferrer">Manifest</a>
                <button className="win-btn close" onClick={() => { Registry.uninstall(app.key); refresh(); }}>Remove</button>
              </div>
            </div>
          ))}
          {installed.length === 0 && <div style={{ opacity: .7 }}>No apps installed yet</div>}
        </div>
      </div>
    </div>
  );
};


