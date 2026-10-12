#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PY_BIN="${PY_BIN:-python3}"

if ! command -v "$PY_BIN" >/dev/null 2>&1; then
  echo "Python 3 not found. Please install Python 3 and re-run."
  exit 1
fi

if [ ! -d "$ROOT_DIR/WebUI/KITT" ]; then
  echo "K.I.T.T. directory missing."
  exit 1
fi

echo "[K.I.T.T.] Installing core Python dependencies..."
if [ -f "$ROOT_DIR/WebUI/KITT/requirements.txt" ]; then
  "$PY_BIN" -m pip install -r "$ROOT_DIR/WebUI/KITT/requirements.txt"
fi

if [ -f "$ROOT_DIR/WebUI/KITT/voice/requirements.txt" ]; then
  "$PY_BIN" -m pip install -r "$ROOT_DIR/WebUI/KITT/voice/requirements.txt"
fi

echo "[K.I.T.T.] Creating runtime directories..."
mkdir -p "$ROOT_DIR/WebUI/KITT/tmp" "$ROOT_DIR/WebUI/KITT/storage" "$ROOT_DIR/WebUI/KITT/dist"

echo "[K.I.T.T.] Booting FastAPI core..."
nohup "$PY_BIN" -m uvicorn WebUI.KITT.api.main:app --host 0.0.0.0 --port 8000 > "$ROOT_DIR/WebUI/KITT/tmp/kit_api.log" 2>&1 &

echo "[K.I.T.T.] Booting voice worker..."
nohup "$PY_BIN" "$ROOT_DIR/WebUI/KITT/voice/worker/worker.py" > "$ROOT_DIR/WebUI/KITT/tmp/kit_voice_worker.log" 2>&1 &

echo "[K.I.T.T.] Startup complete."
echo "Open: http://localhost:8000/docs"
echo "Dashboard files are in: $ROOT_DIR/WebUI/KITT/dashboard"
