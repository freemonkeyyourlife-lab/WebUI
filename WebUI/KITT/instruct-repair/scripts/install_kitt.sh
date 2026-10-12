#!/usr/bin/env bash
# install_kitt.sh
# Optional installer: checks for git/curl/node (nvm) and offers actions.
set -euo pipefail
ROOT="$PWD"
echo "This script helps prepare K.I.T.T. locally. It does not require sudo by default."

# Check curl
if ! command -v curl >/dev/null 2>&1; then echo "Please install curl with your package manager and re-run."; exit 1; fi

# Check git
if ! command -v git >/dev/null 2>&1; then
  echo "git not found. The script will download the ZIP release instead."
  if [ ! -f "$HOME/WebUI/WebUI-main.zip" ]; then
    curl -L -o "$HOME/WebUI.zip" https://github.com/freemonkeyyourlife-lab/WebUI/archive/refs/heads/main.zip
    echo "Downloaded $HOME/WebUI.zip — please extract it into ~/WebUI and rerun this script.";
    exit 0
  fi
fi

# nvm install helper
if ! command -v node >/dev/null 2>&1; then
  echo "Node not found. Installing nvm and Node 18 in your user account..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 18
  nvm use 18
fi

echo "Now you can: cd ~/WebUI/WebUI/KITT/instruct-repair && npm install && ./scripts/start-server-and-agents.sh"
