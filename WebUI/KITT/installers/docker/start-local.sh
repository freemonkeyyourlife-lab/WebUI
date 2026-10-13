#!/usr/bin/env bash
#!/usr/bin/env bash
set -euo pipefail

KITT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$KITT_DIR/voice/docker/voice-compose.yml"
if [ -f "$KITT_DIR/.env" ]; then
  set -a
  . "$KITT_DIR/.env"
  set +a
fi

echo "Starting K.I.T.T. local services using Docker Compose..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Please install Docker or use the native installer scripts in installers/native/."
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required." >&2
  exit 1
fi

if ! "$KITT_DIR/start-kitt.sh"; then
  exit 1
fi
if ! docker compose -f "$COMPOSE_FILE" up -d --build; then
  "$KITT_DIR/stop-kitt.sh" || true
  exit 1
fi

echo "Services started. Instruct & Repair UI: http://127.0.0.1:${PORT:-3005}"
