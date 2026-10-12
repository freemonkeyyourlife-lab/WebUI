#!/usr/bin/env bash
# start-local.sh — bring up all required local services via docker-compose
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/WebUI/KITT/voice/docker/voice-compose.yml"

echo "Starting K.I.T.T. local services using Docker Compose..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Please install Docker or use the native installer scripts in installers/native/."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d --build

echo "Services started. Instruct & Repair UI: http://localhost:3005"
