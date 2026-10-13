#!/usr/bin/env bash
set -euo pipefail

KITT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$KITT_DIR/instruct-repair"

if ! command -v node >/dev/null 2>&1 || ! node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 18 ? 0 : 1)"; then
  echo "Node.js 18 or newer is required." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required." >&2
  exit 1
fi

mkdir -p "$KITT_DIR/mi/users" "$KITT_DIR/mi/memory" "$KITT_DIR/mi/registry_out" \
  "$KITT_DIR/mi/transcripts" "$KITT_DIR/voice/samples" "$KITT_DIR/voice/jobs" \
  "$KITT_DIR/files" "$APP_DIR/data"
(cd "$APP_DIR" && npm ci --omit=dev)

echo "K.I.T.T. is installed. Start it with: $KITT_DIR/start-kitt.sh"
