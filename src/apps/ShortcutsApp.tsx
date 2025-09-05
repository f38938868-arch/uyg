import React from 'react';

type Shortcut = { id: string; title: string; url: string; icon?: string };

export const ShortcutsApp: React.FC = () => {
  const [items, setItems] = React.useState<Shortcut[]>(() => {
    try { const raw = localStorage.getItem('shortcuts.external.v1'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [icon, setIcon] = React.useState('🚀');

  const save = (next: Shortcut[]) => {
    setItems(next);
    try { localStorage.setItem('shortcuts.external.v1', JSON.stringify(next)); } catch {}
  };

  const add = () => {
    const u = url.trim(); const t = title.trim(); if (!u || !t) return;
    const id = Math.random().toString(36).slice(2);
    save([...items, { id, title: t, url: u, icon }]);
    setTitle(''); setUrl('');
  };

  const open = (u: string) => {
    try {
      window.open(u, '_blank');
    } catch {}
  };

  const remove = (id: string) => save(items.filter(i => i.id !== id));

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', height: '100%' }}>
      <div style={{ padding: 10, fontWeight: 800 }}>External Shortcuts</div>
      <div style={{ padding: '0 10px', display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8 }}>
        <input className="web-url" placeholder="Title (e.g., FaceTime John)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="web-url" placeholder="URL (facetime-audio:..., tel:..., https:...)" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button className="start" onClick={add}>Add</button>
      </div>
      <div style={{ padding: 10, overflow: 'auto', display: 'grid', gap: 8 }}>
        {items.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 20 }}>{s.icon ?? '🔗'}</div>
            <div style={{ display: 'grid' }}>
              <div style={{ fontWeight: 700 }}>{s.title}</div>
              <div style={{ opacity: .7, fontSize: 12, wordBreak: 'break-all' }}>{s.url}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="start" onClick={() => open(s.url)}>Open</button>
              <button className="win-btn close" onClick={() => remove(s.id)}>Remove</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ opacity: .7 }}>No shortcuts yet. Add `facetime-audio:someone@icloud.com`, `tel:123`, `https://...`</div>}
      </div>
    </div>
  );
};


