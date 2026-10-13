#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/instruct-repair"
LOG_FILE="$APP_DIR/kitt-server.log"
PID_FILE="$APP_DIR/kitt-server.pid"

mkdir -p "$SCRIPT_DIR/mi/users" \
         "$SCRIPT_DIR/mi/memory" \
         "$SCRIPT_DIR/mi/registry_out" \
         "$SCRIPT_DIR/mi/transcripts" \
         "$SCRIPT_DIR/voice/samples" \
         "$SCRIPT_DIR/voice/jobs" \
         "$SCRIPT_DIR/game/data" \
         "$SCRIPT_DIR/files"

cd "$APP_DIR"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "K.I.T.T. already running on PID $(cat "$PID_FILE")."
  exit 0
fi

echo "Starting K.I.T.T. server on port 3005..."
nohup node server.js > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

for i in $(seq 1 30); do
  if curl -fsS http://localhost:3005/api/health >/dev/null 2>&1; then
    echo "K.I.T.T. started successfully."
    echo "Health: http://localhost:3005/api/health"
    echo "Dashboard: http://localhost:3005/agents.html"
    echo "Game: http://localhost:3005/game.html"
    echo "Log: $LOG_FILE"
    exit 0
  fi
  sleep 1
done

echo "K.I.T.T. did not start correctly."
echo "Log file: $LOG_FILE"
cat "$LOG_FILE" | tail -n 20
exit 1
