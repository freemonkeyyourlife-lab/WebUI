#!/usr/bin/env bash
# install-macos.sh — setup K.I.T.T. services locally without Docker
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Use python3 venv
python3 -m venv "$ROOT_DIR/.venv"
source "$ROOT_DIR/.venv/bin/activate"

pip install --upgrade pip
if [ -f "$ROOT_DIR/requirements.txt" ]; then
  pip install -r "$ROOT_DIR/requirements.txt"
fi

# Install node deps for web UI and instruct-repair service
if command -v npm >/dev/null 2>&1; then
  (cd "$ROOT_DIR/WebUI/KITT/instruct-repair" && npm install)
  (cd "$ROOT_DIR/WebUI/KITT/installers/electron" && npm install)
fi

echo "Installation complete. To start services run:"
echo "  source $ROOT_DIR/.venv/bin/activate"
echo "  node WebUI/KITT/instruct-repair/server.js"
