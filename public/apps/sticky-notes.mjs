const React = globalThis.React;

export default function StickyNotes() {
  const [text, setText] = React.useState('');
  React.useEffect(() => {
    try { const v = localStorage.getItem('dyn.sticky.v1'); if (v) setText(v); } catch {}
  }, []);
  React.useEffect(() => {
    try { localStorage.setItem('dyn.sticky.v1', text); } catch {}
  }, [text]);
  return React.createElement('textarea', {
    style: { width: '100%', height: '100%', padding: 10, background: 'rgba(255,255,200,0.8)', color: '#111', border: 'none', outline: 'none', resize: 'none', fontSize: 16, lineHeight: 1.4 },
    value: text,
    onChange: (e) => setText(e.target.value),
    placeholder: 'Write a note...'
  });
}

