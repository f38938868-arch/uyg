import React, { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'notes.content.v1';

export const NotesApp: React.FC = () => {
  const [text, setText] = useState<string>('');
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored != null) setText(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, text);
      } catch {
        // ignore
      }
    }, 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [text]);

  return (
    <div className="notes-app">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a note..."
        spellCheck
        autoFocus
      />
    </div>
  );
};


