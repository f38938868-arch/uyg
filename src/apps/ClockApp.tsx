import React, { useEffect, useState } from 'react';

export const ClockApp: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', padding: 16 }}>
      <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: 1 }}>{time}</div>
      <div style={{ marginTop: 8, opacity: .9 }}>{date}</div>
    </div>
  );
};


