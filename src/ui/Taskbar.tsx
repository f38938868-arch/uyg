import React from 'react';
import { WindowDescriptor } from './WindowManager';

type Props = {
  onStart: () => void;
  windows: WindowDescriptor[];
  onFocus: (id: string) => void;
};

export const Taskbar: React.FC<Props> = ({ onStart, windows, onFocus }) => {
  return (
    <div className="taskbar">
      <button className="start" onClick={onStart} aria-label="Open Apps">
        <span className="start-icon">⬢</span>
        <span className="start-text">Apps</span>
      </button>
      <div className="taskbar-windows">
        {windows.map((w) => (
          <button
            key={w.id}
            className={`task ${w.focused ? 'focused' : ''}`}
            onClick={() => onFocus(w.id)}
            aria-label={`Focus ${w.title}`}
          >
            <span className="task-icon">{w.icon}</span>
            <span className="task-title">{w.title}</span>
          </button>
        ))}
      </div>
      <div className="taskbar-clock" aria-hidden>
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};


