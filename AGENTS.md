# Base44 — K.I.T.T. WebUI

This repository is a local-first multi-component project. The **main user-facing
service** is the K.I.T.T. Instruct & Repair Node/Express app.

## Main service

- Entry point: `WebUI/KITT/instruct-repair/server.js` (Express)
- Serves a static UI from `WebUI/KITT/instruct-repair/public/` and a JSON API under `/api/*`
- Health check: `GET /api/health` → `{ status: "ok", ... }`
- Default port: `3005`, but the Base44 dev compose forces `PORT=3000` so the preview
  is reachable on host port 3000.

## Why the main update failed to start

The initial commit shipped `server.js` (which `require`s `express` and `multer`)
**without a `package.json`** in `WebUI/KITT/instruct-repair/`. `npm install` therefore
installed nothing and the process crashed on boot with
`Error: Cannot find module 'express'`. The catch-all route also referenced a
`public/index.html` that did not exist, so even a successful boot would 500 on `/`.

### Fixes applied
- Added `WebUI/KITT/instruct-repair/package.json` (express, multer; nodemon dev dep).
- Added `WebUI/KITT/instruct-repair/public/index.html` (self-contained Instruct &
  Repair UI that talks to the server's own `/api`).
- Added `.gitignore` for `node_modules/` and runtime data dirs.

## Run in the Base44 sandbox

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

The compose service bind-mounts the repo, runs `npm install` on startup, then
launches `nodemon --legacy-watch server.js` for live reload. The frontend HTML is
served fresh from disk on every request, so UI edits appear without a restart;
server/route edits trigger an automatic nodemon restart.

## Other components (not part of the default preview)

- `WebUI/KITT/dashboard/` — a separate FastAPI dashboard service (`service.py`)
  that serves `dashboard/index.html` and an API on its own port. Its `app.js`
  expects a backend at `http://localhost:8000`; it is not wired into the main
  service and is left untouched.
- `WebUI/KITT/voice/` — voice worker (Python) with its own compose file.
- `projects/free-monkeys-map/` — a standalone FastAPI + frontend sub-project.

## Notes / quirks

- `routes/agents_api.js` and `routes/transcript_api.js` exist but are **not mounted**
  in `server.js` (only `/api/files` and `/api/mi` are). `scripts/start-server-and-agents.sh`
  calls `/api/agents`, which currently 404s; this is pre-existing and intentionally
  left as-is (do not add functionality unless asked).
- `mi_api.js` writes under `WebUI/KITT/mi/`; `api_file_handlers.js` writes under
  `WebUI/KITT/voice/` and `WebUI/KITT/files/`. These dirs are created on module load.
