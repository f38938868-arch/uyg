# Nebula OS App Store – Developer Guide (for humans and AIs)

This document explains how to build, publish, and install apps for Nebula OS using the lightweight manifest-and-module framework implemented in this repo.

## Overview
- Apps are either built-in (static) or dynamic (installed via the App Store).
- Dynamic apps are defined by a small JSON-like manifest and a React component module that is loaded at runtime via import().
- Installed apps are persisted in localStorage and appear in the Apps menu alongside built-ins.

Key files in this repo:
- src/apps/registry.ts – install/uninstall/list with localStorage persistence
- src/apps/AppStore.tsx – App Store UI (install from URL, uninstall)
- src/ui/StartMenu.tsx – merges static catalog with installed apps and renders entries

## Manifest Schema
Nebula OS expects a manifest with the following shape (TypeScript):

```ts
export type AppManifest = {
  key: string;                           // unique stable ID, e.g. "hello-world"
  title: string;                         // display name, e.g. "Hello World"
  icon: string;                          // emoji or short text icon, e.g. "👋"
  initialSize?: { width: number; height: number }; // optional default window size
  load: () => Promise<{ default: React.ComponentType<any> } | React.ComponentType<any>>;
};
```

Notes:
- load MUST be a function that returns a Promise resolving to either a React component OR an ES module object with default as the component. This allows:
  - inline loader that returns a component immediately, or
  - a dynamic import: () => import('https://.../app.mjs')
- The component will be mounted directly inside a Nebula window and should manage its own internal UI.

## Example Manifest (ES module recommended)
```js
// https://your.cdn.com/hello-world.manifest.mjs
export const manifest = {
  key: 'hello-world',
  title: 'Hello World',
  icon: '👋',
  initialSize: { width: 320, height: 240 },
  load: () => import('https://your.cdn.com/hello-world.mjs')
};
export default manifest;
```
Then install using that manifest URL in the App Store.

## Example App Module
Your app module must export a default React component:
```js
// https://your.cdn.com/hello-world.mjs
import React from 'react';
export default function HelloWorld() {
  return React.createElement('div', { style: { padding: 12 } }, 'Hello from the web!');
}
```
Requirements:
- Must be served as an ESM module with proper CORS headers.
- MIME type should be text/javascript or application/javascript.
- The module should not rely on bundler-specific globals.

## Installation Flow
1. Open Nebula OS → Apps → App Store.
2. Paste your manifest URL (ESM manifest that exports default manifest).
3. Click Install. The manifest is fetched and stored via Registry.installFromManifest.
4. The Apps menu now includes your app. Launching it will call manifest.load() and mount the exported component in a window.
5. Uninstall from the App Store list.

## Runtime Integration Details
- Start menu (src/ui/StartMenu.tsx) reads appstore.installed.v1 from localStorage, builds dynamic entries with lazy components, and merges them into the static catalog.
- Windows are managed by WindowManager and receive the app’s content as a React node; no special props are required.
- If you need configuration, handle it inside your component or via your own backend; the host passes no props for now.

## Publishing Guidelines
- Host both your ESM manifest (*.manifest.mjs) and your ESM component (*.mjs) on a CDN or static host.
- Ensure CORS allows Nebula origin to import your module (e.g., Access-Control-Allow-Origin: *).
- Prefer small, self-contained components; avoid heavy global CSS that might clash with Nebula.
- Keep network requests within your component’s origin or handle CORS appropriately.

## Versioning & Updates
- Use a stable key for your app. To ship updates, bump the module URL (e.g., app.v2.mjs) and update the manifest.
- Reinstalling via the App Store will update the stored manifest.

## Security Considerations
- Dynamic modules run in the same origin as Nebula (via browser import). Do not include untrusted code.
- Avoid accessing localStorage keys used by Nebula unless prefixed uniquely to your app.

## Troubleshooting
- Installation fails: Check CORS, MIME type, and that your manifest exports a default object with a functional load.
- App won’t render: Verify your module’s default export is a valid React component.
- Icons not showing: Use short text or emoji for icon.

## Roadmap (suggested)
- Optional props injection to dynamic apps (e.g., closeWindow, notify).
- Category/ratings metadata in manifests.
- Remote app discovery feed in App Store.
- Sandboxed iframe runtime for untrusted apps.

---
Maintainers (human or AI): keep this document updated when the manifest schema or App Store behavior changes.
