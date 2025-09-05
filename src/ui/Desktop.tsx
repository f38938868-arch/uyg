import React, { useRef } from 'react';
import { appsCatalog } from '../apps/catalog';

type Props = {
  onLaunch: (key: string) => void;
};

export const Desktop: React.FC<Props> = ({ onLaunch }) => {
  const lastTapRef = useRef<{ time: number; key: string }>({ time: 0, key: '' });
  const handlePointerUp = (appKey: string, e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return; // mouse uses native doubleClick below
    const now = Date.now();
    const isSame = lastTapRef.current.key === appKey;
    const delta = now - lastTapRef.current.time;
    lastTapRef.current = { time: now, key: appKey };
    if (isSame && delta < 450) {
      onLaunch(appKey);
    }
  };

  return (
    <div className="desktop">
      {appsCatalog.map((app) => (
        <button
          key={app.key}
          className="desktop-icon"
          onDoubleClick={() => onLaunch(app.key)}
          onPointerUp={(e) => handlePointerUp(app.key, e)}
        >
          <span className="desktop-icon-emoji">{app.icon}</span>
          <span className="desktop-icon-title">{app.title}</span>
        </button>
      ))}
    </div>
  );
};


