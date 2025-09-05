import React, { useState } from 'react';

type FileItem = { id: string; name: string; url: string };

export const FilesApp: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ padding: 10, display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <label className="start" style={{ cursor: 'pointer' }}>
          Upload
          <input type="file" multiple style={{ display: 'none' }} onChange={(e) => {
            const list = Array.from(e.target.files || []);
            const items = list.map((f) => ({ id: Math.random().toString(36).slice(2), name: f.name, url: URL.createObjectURL(f) }));
            setFiles((prev) => [...items, ...prev]);
          }} />
        </label>
      </div>
      <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, overflow: 'auto' }}>
        {files.map((f) => (
          <a key={f.id} className="task" href={f.url} target="_blank" rel="noopener noreferrer" title={f.name}>
            {f.name}
          </a>
        ))}
        {files.length === 0 && <div style={{ opacity: .7 }}>No files</div>}
      </div>
    </div>
  );
};


