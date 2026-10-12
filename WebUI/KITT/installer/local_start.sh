#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "$ROOT_DIR/WebUI/KITT" ]; then
  echo "K.I.T.T. directory not found."
  exit 1
fi

mkdir -p "$ROOT_DIR/WebUI/KITT/tmp"

echo "K.I.T.T. local bootstrap started"
echo "Next actions:"
echo "1) install Python dependencies from WebUI/KITT/voice/requirements.txt"
echo "2) install Node dependencies for the WebUI if present"
echo "3) launch the dashboard and the voice API"
echo "4) connect services through the K.I.T.T. registry"

echo "Local base path: $ROOT_DIR"
