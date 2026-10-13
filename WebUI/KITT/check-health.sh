#!/usr/bin/env bash
set -euo pipefail

curl -fsS http://localhost:3005/api/health || {
  echo "K.I.T.T. health check failed."
  exit 1
}
echo ""
echo "K.I.T.T. is healthy."
