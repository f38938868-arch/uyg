import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'wallpaper.style.v1';

type Option = { key: string; title: string; preview: string };

const OPTIONS: Option[] = [
  { key: 'wallpaper-azure', title: 'Azure Glow', preview: '🟦' },
  { key: 'wallpaper-sunset', title: 'Sunset', preview: '🌇' },
  { key: 'wallpaper-forest', title: 'Forest', preview: '🌲' },
  { key: 'wallpaper-nebula', title: 'Nebula', preview: '🪐' },
  { key: 'wallpaper-solid', title: 'Solid Blue', preview: '🔵' },
];

export const SettingsApp: React.FC = () => {
  const [selected, setSelected] = useState<string>('wallpaper-azure');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelected(saved);
    } catch {}
  }, []);

  const apply = (key: string) => {
    setSelected(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
    window.dispatchEvent(new CustomEvent('wallpaper:change', { detail: key }));
  };

  return (
    <div style={{ padding: 12, display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800, letterSpacing: .2 }}>Wallpaper</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`task ${selected === opt.key ? 'focused' : ''}`}
            onClick={() => apply(opt.key)}
            aria-label={`Set ${opt.title}`}
          >
            <span style={{ fontSize: 22 }}>{opt.preview}</span>
            <span style={{ marginLeft: 8 }}>{opt.title}</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 800, letterSpacing: .2, marginBottom: 8 }}>Custom image</div>
        <label className="start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <span>Upload image</span>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result || '');
                try { localStorage.setItem('wallpaper.custom.url', dataUrl); } catch {}
                window.dispatchEvent(new CustomEvent('wallpaper:setImage', { detail: dataUrl }));
                apply('wallpaper-custom');
              };
              reader.readAsDataURL(file);
              // reset input so selecting the same file again re-triggers change
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
};


