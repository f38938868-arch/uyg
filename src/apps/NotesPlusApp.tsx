import React, { useEffect, useState } from 'react';

type Note = { id: string; title: string; body: string; updatedMs: number };
const STORAGE_KEY = 'notes.list.v1';

export const NotesPlusApp: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setNotes(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {} }, [notes]);

  const add = () => {
    const n: Note = { id: Math.random().toString(36).slice(2), title: 'Untitled', body: '', updatedMs: Date.now() };
    setNotes((prev) => [n, ...prev]);
    setSelected(n.id);
  };
  const remove = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selected === id) setSelected(null);
  };
  const update = (id: string, patch: Partial<Note>) => setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedMs: Date.now() } : n)));
  const current = notes.find((n) => n.id === selected) || null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', height: '100%' }}>
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateRows: 'auto 1fr', minWidth: 0 }}>
        <div style={{ padding: 8, display: 'flex', gap: 8 }}>
          <button className="start" onClick={add}>New</button>
        </div>
        <div style={{ overflow: 'auto', padding: 8, display: 'grid', gap: 6 }}>
          {notes.map((n) => (
            <button key={n.id} className={`task ${selected === n.id ? 'focused' : ''}`} onClick={() => setSelected(n.id)}>
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title || 'Untitled'}</div>
              <div style={{ opacity: .75, fontSize: 12 }}>{new Date(n.updatedMs).toLocaleDateString()}</div>
            </button>
          ))}
          {notes.length === 0 && <div style={{ opacity: .7 }}>No notes yet</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', minWidth: 0 }}>
        {current ? (
          <>
            <input
              className="web-url"
              value={current.title}
              onChange={(e) => update(current.id, { title: e.target.value })}
              placeholder="Title"
              style={{ margin: 10 }}
            />
            <textarea
              value={current.body}
              onChange={(e) => update(current.id, { body: e.target.value })}
              placeholder="Write..."
              style={{ margin: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, minHeight: 200, height: 260 }}
            />
            <div style={{ padding: 10, display: 'flex', gap: 8 }}>
              <button className="win-btn close" onClick={() => remove(current.id)}>Delete</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center' }}>Select or create a note</div>
        )}
      </div>
    </div>
  );
};


