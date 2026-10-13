#!/usr/bin/env bash
#!/usr/bin/env bash
set -euo pipefail

KITT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$KITT_DIR/voice/docker/voice-compose.yml"

echo "Stopping K.I.T.T. local services..."
status=0
if command -v docker >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" down || status=$?
fi
"$KITT_DIR/stop-kitt.sh" || status=$?

if [ "$status" -ne 0 ]; then
  exit "$status"
fi
echo "Stopped."
