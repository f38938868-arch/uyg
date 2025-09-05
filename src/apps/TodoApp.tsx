import React, { useEffect, useMemo, useState } from 'react';

type Todo = { id: string; text: string; done: boolean };
const STORAGE_KEY = 'todo.items.v1';

export const TodoApp: React.FC = () => {
  const [items, setItems] = useState<Todo[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setItems((prev) => [{ id: Math.random().toString(36).slice(2), text: t, done: false }, ...prev]);
    setText('');
  };
  const toggle = (id: string) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const remove = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));
  const remaining = useMemo(() => items.filter((i) => !i.done).length, [items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, padding: 10 }}>
        <input
          className="web-url"
          placeholder="Add a task"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
        />
        <button className="start" onClick={add} aria-label="Add">Add</button>
      </div>
      <div style={{ padding: '0 10px 8px 10px', opacity: .85 }}>{remaining} remaining</div>
      <div style={{ overflow: 'auto', padding: '0 10px 10px 10px', display: 'grid', gap: 8 }}>
        {items.map((it) => (
          <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10 }}>
            <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
            <span style={{ textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? .7 : 1 }}>{it.text}</span>
            <button className="win-btn close" onClick={(e) => { e.preventDefault(); remove(it.id); }} aria-label="Delete">×</button>
          </label>
        ))}
        {items.length === 0 && <div style={{ opacity: .7 }}>No tasks yet</div>}
      </div>
    </div>
  );
};


