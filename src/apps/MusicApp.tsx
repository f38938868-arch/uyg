import React, { useRef, useState } from 'react';

export const MusicApp: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [title, setTitle] = useState<string>('');

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 800 }}>Music</div>
        <div style={{ opacity: .85, minHeight: 20 }}>{title || 'No track loaded'}</div>
      </div>
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <label className="start" style={{ cursor: 'pointer' }}>
          Upload audio
          <input
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play().catch(() => {});
              }
              setTitle(file.name);
            }}
          />
        </label>
      </div>
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <audio ref={audioRef} controls style={{ width: '100%' }} />
      </div>
    </div>
  );
};


