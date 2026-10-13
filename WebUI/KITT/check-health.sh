#!/usr/bin/env bash
set -euo pipefail

KITT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$KITT_DIR/.env" ]; then
  set -a
  . "$KITT_DIR/.env"
  set +a
fi
PORT="${PORT:-3005}"
curl --fail --silent --show-error "http://127.0.0.1:${PORT}/api/health"
printf '\n'
