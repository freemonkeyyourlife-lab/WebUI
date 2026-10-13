#!/usr/bin/env bash
set -euo pipefail

KITT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$KITT_DIR/instruct-repair"
PID_FILE="$APP_DIR/kitt-server.pid"
LOG_FILE="$APP_DIR/kitt-server.log"
if [ -f "$KITT_DIR/.env" ]; then
  set -a
  . "$KITT_DIR/.env"
  set +a
fi
PORT="${PORT:-3005}"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"

for directory in \
  "$KITT_DIR/mi/users" \
  "$KITT_DIR/mi/memory" \
  "$KITT_DIR/mi/registry_out" \
  "$KITT_DIR/mi/transcripts" \
  "$KITT_DIR/voice/samples" \
  "$KITT_DIR/voice/jobs" \
  "$KITT_DIR/files" \
  "$APP_DIR/data"; do
  mkdir -p "$directory"
done

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 or newer is required." >&2
  exit 1
fi

if [ ! -d "$APP_DIR/node_modules" ]; then
  (cd "$APP_DIR" && npm ci --omit=dev)
fi

is_kitt_process() {
  local pid="$1"
  local command
  command="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  [[ "$command" == *"$APP_DIR/server.js"* ]]
}

if [ -f "$PID_FILE" ]; then
  existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ "$existing_pid" =~ ^[0-9]+$ ]] && kill -0 "$existing_pid" 2>/dev/null && is_kitt_process "$existing_pid"; then
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      echo "K.I.T.T. is already running (PID $existing_pid)."
      exit 0
    fi
    echo "A tracked K.I.T.T. process is running but not healthy (PID $existing_pid)." >&2
    exit 1
  fi
  rm -f "$PID_FILE"
fi

cd "$APP_DIR"
nohup node "$APP_DIR/server.js" >>"$LOG_FILE" 2>&1 &
pid=$!
printf '%s\n' "$pid" > "$PID_FILE"

attempt=0
while [ "$attempt" -lt 30 ]; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "K.I.T.T. started. Health: $HEALTH_URL"
    echo "Log: $LOG_FILE"
    exit 0
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    break
  fi
  sleep 1
  attempt=$((attempt + 1))
done

if is_kitt_process "$pid"; then
  kill "$pid" 2>/dev/null || true
fi
rm -f "$PID_FILE"
echo "K.I.T.T. failed to become healthy. See $LOG_FILE." >&2
exit 1
