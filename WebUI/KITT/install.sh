#!/usr/bin/env bash
# K.I.T.T. Ein-Befehl-Installer: ./install.sh  (Linux/macOS)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
KITT_HOME="$(pwd)"
export KITT_HOME

PY="$(command -v python3 || command -v python || true)"
[ -n "$PY" ] || { echo "Python 3.8+ fehlt."; exit 1; }

# Entpacken, falls ein Bundle neben dem Skript liegt (nie überschreiben: unzip -n)
BUNDLE="$(ls kitt-bundle*.zip 2>/dev/null | head -n1 || true)"
if [ -n "$BUNDLE" ] && command -v unzip >/dev/null; then
  unzip -n "$BUNDLE" -d "$KITT_HOME"
elif [ -z "$BUNDLE" ]; then
  echo "Kein Bundle-Zip gefunden – nutze vorhandene Dateien (Bundle bauen: installer/build_zip.py)."
fi

"$PY" core/bootstrap.py --install --build

if [ "${KITT_NO_START:-0}" = "1" ]; then exit 0; fi
if [ -x ./start-kitt.sh ]; then
  exec ./start-kitt.sh
fi
mkdir -p data
if [ -f data/kitt.pid ] && kill -0 "$(cat data/kitt.pid)" 2>/dev/null; then
  echo "K.I.T.T. läuft bereits (PID $(cat data/kitt.pid))."
else
  nohup node app/server.js >> data/kitt.log 2>&1 &
  echo $! > data/kitt.pid
  echo "K.I.T.T. gestartet (PID $!)."
fi
echo "http://127.0.0.1:${KITT_PORT:-3005}"
