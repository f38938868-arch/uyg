import React from 'react';

export type AppManifest = {
  key: string;
  title: string;
  icon: string;
  initialSize?: { width: number; height: number };
  // A component factory; loaded dynamically for remote apps
  load: () => Promise<{ default: React.ComponentType<any> } | React.ComponentType<any>>;
};

export type InstalledApp = {
  key: string;
  title: string;
  icon: string;
  initialSize?: { width: number; height: number };
  manifestUrl: string; // where to import the manifest from
  inlineManifestCode?: string; // if provided, load manifest from this code string
};

const STORAGE_KEY = 'appstore.installed.v1';

export const Registry = {
  async installFromManifest(manifest: AppManifest, manifestUrl: string, extra?: { inlineManifestCode?: string }): Promise<InstalledApp> {
    const app: InstalledApp = {
      key: manifest.key,
      title: manifest.title,
      icon: manifest.icon,
      initialSize: manifest.initialSize,
      manifestUrl,
      inlineManifestCode: extra?.inlineManifestCode,
    };
    const all = Registry.list();
    const exists = all.find((a) => a.key === app.key);
    const next = exists ? all.map((a) => (a.key === app.key ? app : a)) : [...all, app];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return app;
  },
  uninstall(key: string) {
    const next = Registry.list().filter((a) => a.key !== key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
  list(): InstalledApp[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as InstalledApp[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
};


