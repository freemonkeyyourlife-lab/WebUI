#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/instruct-repair"
PID_FILE="$APP_DIR/kitt-server.pid"

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" || true
    sleep 1
    kill -9 "$PID" 2>/dev/null || true
    echo "K.I.T.T. stopped (PID $PID)."
  else
    echo "No running K.I.T.T. process found on PID ${PID:-none}."
  fi
  rm -f "$PID_FILE"
else
  # Fallback: check if port 3005 is occupied
  PIDS="$(lsof -ti :3005 2>/dev/null || true)"
  if [ -n "$PIDS" ]; then
    kill $PIDS || true
    echo "Stopped process on port 3005."
  else
    echo "No PID file found and port 3005 is free."
  fi
fi
