import React, { useEffect, useState } from 'react';

type BatteryInfo = {
  level: number | null; // 0..1
  charging: boolean | null;
};

export const TopBar: React.FC = () => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [battery, setBattery] = useState<BatteryInfo>({ level: null, charging: null });

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // We no longer show connection type; only connected state

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) return;
    let batteryManager: any;
    nav.getBattery().then((b: any) => {
      batteryManager = b;
      const update = () => setBattery({ level: b.level, charging: b.charging });
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    });
    return () => {
      if (!batteryManager) return;
      batteryManager.removeEventListener?.('levelchange');
      batteryManager.removeEventListener?.('chargingchange');
    };
  }, []);

  const batteryPct = battery.level != null ? Math.round(battery.level * 100) : null;
  const batteryIcon = batteryPct != null ? (batteryPct > 80 ? '🔋' : batteryPct > 30 ? '🔋' : '🪫') : '🔋';
  const chargingMark = battery.charging ? '⚡' : '';

  const wifiLabel = online ? 'Online' : 'Offline';

  return (
    <div className="topbar" role="banner" aria-label="Status bar">
      <div className="topbar-left">nebula OS</div>
      <div className="topbar-center">{time}</div>
      <div className="topbar-right">
        <span className="topbar-item" title={wifiLabel}>{wifiLabel}</span>
        <span className="topbar-item" title={`Battery ${batteryPct ?? '—'}%`}>
          {batteryIcon} {batteryPct != null ? `${batteryPct}%` : ''} {chargingMark}
        </span>
      </div>
    </div>
  );
};


