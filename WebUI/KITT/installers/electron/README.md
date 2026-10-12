# Electron wrapper (optional)

This folder contains a minimal Electron wrapper that points to a locally hosted WebUI and bundles a desktop app shell. It is intended as a convenience to run the K.I.T.T. frontend as a native app.

How it works
- Electron starts and loads http://localhost:3000 (or the configured UI port)
- The backend services must be running locally (see Docker instructions)

Build steps (example)

1. Install dependencies

```bash
cd WebUI/KITT/installers/electron
npm install
```

2. Run in development mode (requires local frontend running)

```bash
npm run dev
```

3. Build native packages (example using electron-builder)

```bash
npm run build
```

Customize package.json to set productName, icons and platform targets.
