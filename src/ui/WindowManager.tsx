import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type WindowDescriptor = {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
  initialSize?: { width: number; height: number };
  focused?: boolean;
  minimized?: boolean;
};

type WindowState = WindowDescriptor & {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  z: number;
};

type Props = {
  windows: WindowDescriptor[];
  setWindows: React.Dispatch<React.SetStateAction<WindowDescriptor[]>>;
  focusRequestId?: string;
};

export const WindowManager: React.FC<Props> = ({ windows, setWindows, focusRequestId }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [states, setStates] = useState<Record<string, WindowState>>({});

  const computeInitialState = useCallback((w: WindowDescriptor, idx: number): WindowState => {
    const width = w.initialSize?.width ?? 320;
    const height = w.initialSize?.height ?? 420;
    const x = 24 + (idx % 3) * 24;
    const y = 64 + (idx % 3) * 24;
    return {
      ...w,
      x,
      y,
      width,
      height,
      isMaximized: false,
      isMinimized: !!w.minimized,
      z: 1,
    };
  }, []);

  // Ensure each window has an initialized state and prune removed ones
  useEffect(() => {
    setStates((prev) => {
      const next: Record<string, WindowState> = { ...prev };
      windows.forEach((w, i) => {
        if (!next[w.id]) next[w.id] = computeInitialState(w, i);
        else if (typeof w.minimized === 'boolean') next[w.id] = { ...next[w.id], isMinimized: w.minimized };
      });
      Object.keys(next).forEach((id) => {
        if (!windows.find((w) => w.id === id)) delete next[id];
      });
      return next;
    });
  }, [windows, computeInitialState]);

  const ordered = useMemo(() => windows.map((w) => states[w.id] ?? computeInitialState(w, 0)), [windows, states, computeInitialState]);

  const bringToFront = (id: string) => {
    const maxZ = Math.max(0, ...Object.values(states).map((s) => s.z));
    setStates((prev) => {
      const base = prev[id] ?? computeInitialState(windows.find((w) => w.id === id)!, 0);
      return { ...prev, [id]: { ...base, isMinimized: false, z: maxZ + 1 } };
    });
    setWindows((prev) => prev.map((w) => ({ ...w, focused: w.id === id, minimized: w.id === id ? false : w.minimized })));
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleMaximize = (id: string) => {
    setStates((prev) => {
      const base = prev[id] ?? computeInitialState(windows.find((w) => w.id === id)!, 0);
      return { ...prev, [id]: { ...base, isMaximized: !base.isMaximized } };
    });
  };
  
  // External focus/unminimize requests (e.g., from taskbar clicks)
  useEffect(() => {
    if (!focusRequestId) return;
    if (!windows.find((w) => w.id === focusRequestId)) return;
    bringToFront(focusRequestId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequestId]);

  const minimizeWindow = (id: string) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], isMinimized: true } }));
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true, focused: false } : w)));
  };

  const onDrag = (id: string, dx: number, dy: number) => {
    setStates((prev) => {
      const base = prev[id] ?? computeInitialState(windows.find((w) => w.id === id)!, 0);
      return { ...prev, [id]: { ...base, x: base.x + dx, y: base.y + dy } };
    });
  };

  const onResize = (id: string, dw: number, dh: number) => {
    setStates((prev) => {
      const base = prev[id] ?? computeInitialState(windows.find((w) => w.id === id)!, 0);
      return {
        ...prev,
        [id]: {
          ...base,
          width: Math.max(260, base.width + dw),
          height: Math.max(220, base.height + dh),
        },
      };
    });
  };

  const hasVisibleWindows = useMemo(() => Object.values(states).some((s) => !s.isMinimized), [states]);

  return (
    <div ref={containerRef} className={`wm ${hasVisibleWindows ? '' : 'empty'}`}>
      {ordered.map((w) => (
        <Window
          key={w.id}
          state={states[w.id] ?? computeInitialState(w, 0)}
          onFocus={() => bringToFront(w.id)}
          onClose={() => closeWindow(w.id)}
          onToggleMax={() => toggleMaximize(w.id)}
          onMinimize={() => minimizeWindow(w.id)}
          onDrag={(dx, dy) => onDrag(w.id, dx, dy)}
          onResize={(dw, dh) => onResize(w.id, dw, dh)}
        />)
      )}
    </div>
  );
};

type WindowProps = {
  state: WindowState;
  onFocus: () => void;
  onClose: () => void;
  onToggleMax: () => void;
  onMinimize: () => void;
  onDrag: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number) => void;
};

const Window: React.FC<WindowProps> = ({ state, onFocus, onClose, onToggleMax, onMinimize, onDrag, onResize }) => {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const sizeRef = useRef<{ w: number; h: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    onFocus();
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    startRef.current = { x: e.clientX, y: e.clientY };
    onDrag(dx, dy);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    startRef.current = null;
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sizeRef.current = { w: state.width, h: state.height };
    startRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleResizeMove = (e: React.PointerEvent) => {
    if (!startRef.current || !sizeRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    onResize(dx, dy);
    startRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleResizeUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    startRef.current = null;
    sizeRef.current = null;
  };

  const style: React.CSSProperties = state.isMaximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 48px)' }
    : { left: state.x, top: state.y, width: state.width, height: state.height };

  return (
    <div className="window" style={{ ...style, zIndex: state.z, display: state.isMinimized ? 'none' : undefined }} onPointerDown={onFocus}>
      <div
        className="window-titlebar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="window-icon">{state.icon}</span>
        <span className="window-title">{state.title}</span>
        <div className="window-actions" onPointerDown={(e) => { e.stopPropagation(); }}>
          <button
            className="win-btn"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            aria-label="Minimize"
          >
            –
          </button>
          <button
            className="win-btn"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onToggleMax(); }}
            aria-label="Maximize"
          >
            ▢
          </button>
          <button
            className="win-btn close"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
      <div className="window-content">
        <React.Suspense fallback={<div style={{ padding: 12, opacity: .8 }}>Loading…</div>}>
          <ErrorBoundary>
            {state.content}
          </ErrorBoundary>
        </React.Suspense>
      </div>
      {!state.isMaximized && (
        <div
          className="window-resize"
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
        />
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, message: (err as any)?.message || 'App crashed' };
  }
  componentDidCatch(err: unknown) {
    // no-op; could log
  }
  render() {
    if (this.state.hasError) {
      return (<div style={{ padding: 12, color: '#fca5a5' }}>Error: {this.state.message}</div>);
    }
    return this.props.children as any;
  }
}


