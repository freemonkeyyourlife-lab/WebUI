#!/usr/bin/env bash
set -euo pipefail

KITT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$KITT_DIR/instruct-repair"
PID_FILE="$APP_DIR/kitt-server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No K.I.T.T. PID file found."
  exit 0
fi

pid="$(cat "$PID_FILE" 2>/dev/null || true)"
if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
  rm -f "$PID_FILE"
  echo "Removed invalid K.I.T.T. PID file."
  exit 0
fi

command="$(ps -p "$pid" -o command= 2>/dev/null || true)"
if [[ "$command" != *"$APP_DIR/server.js"* ]]; then
  rm -f "$PID_FILE"
  echo "Tracked process is not K.I.T.T.; left it untouched."
  exit 0
fi

kill "$pid"
attempt=0
while [ "$attempt" -lt 10 ]; do
  if ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "K.I.T.T. stopped."
    exit 0
  fi
  sleep 1
  attempt=$((attempt + 1))
done

command="$(ps -p "$pid" -o command= 2>/dev/null || true)"
if [[ "$command" == *"$APP_DIR/server.js"* ]]; then
  kill -KILL "$pid" 2>/dev/null || true
fi
rm -f "$PID_FILE"
echo "K.I.T.T. stopped."
