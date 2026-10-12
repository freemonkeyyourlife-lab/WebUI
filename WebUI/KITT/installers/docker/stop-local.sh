#!/usr/bin/env bash
# stop-local.sh — stop local docker services
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/WebUI/KITT/voice/docker/voice-compose.yml"

echo "Stopping K.I.T.T. local services..."
docker compose -f "$COMPOSE_FILE" down

echo "Stopped."
