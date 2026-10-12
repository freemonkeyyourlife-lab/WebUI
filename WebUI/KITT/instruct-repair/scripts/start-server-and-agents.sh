#!/usr/bin/env bash
# start-server-and-agents.sh
# Simple helper script to start the K.I.T.T. server and then start all registered agents.
# Designed to be simple and verbose for users who want very clear steps.

set -euo pipefail
IFS=$'\n\t'

# CONFIG — adjust if your layout differs
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"   # points to WebUI/KITT/instruct-repair
SERVER_CMD="node server.js"
HEALTH_URL="http://localhost:3005/api/health"
AGENTS_URL="http://localhost:3005/api/agents"
START_AGENT_URL_TEMPLATE="http://localhost:3005/api/agents/%s/start"

# Helpers
function echo_step() { echo -e "\n==> $*\n"; }
function die() { echo "ERROR: $*" >&2; exit 1; }

# 1) Move to repo dir
echo_step "We will start K.I.T.T. from: $ROOT_DIR"
cd "$ROOT_DIR"

# 2) Ensure node modules installed
if [ ! -d "node_modules" ]; then
  echo_step "Installing npm dependencies (this may take a moment)..."
  npm install
else
  echo_step "npm modules already installed — skipping npm install"
fi

# 3) Ensure needed directories exist
echo_step "Ensuring required directories exist..."
mkdir -p ./mi/users ./mi/registry_out ./mi/transcripts ./voice/samples ./voice/jobs

# 4) Start the server in the background (nohup) and redirect logs
LOGFILE="kitt-server.log"
if pgrep -f "node server.js" >/dev/null 2>&1; then
  echo_step "A server process appears to be running already. I'll not start another. If you want to restart, please stop existing process first."
else
  echo_step "Starting server: $SERVER_CMD"
  nohup $SERVER_CMD > "$LOGFILE" 2>&1 &
  echo_step "Server started in background; logs are in $ROOT_DIR/$LOGFILE"
fi

# 5) Wait for the server to respond on the health endpoint
echo_step "Waiting for server to become healthy at $HEALTH_URL ..."
for i in {1..30}; do
  if curl -sS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Server responded (OK)."
    break
  fi
  echo "  waiting... ($i)"
  sleep 1
done

if ! curl -sS "$HEALTH_URL" >/dev/null 2>&1; then
  die "Server did not respond on $HEALTH_URL. Check $LOGFILE for details."
fi

# 6) List agents and start them one by one
echo_step "Fetching registered agents from $AGENTS_URL"
AGENTS_JSON=$(curl -sS "$AGENTS_URL")
if [ -z "$AGENTS_JSON" ] || [ "$AGENTS_JSON" = "[]" ]; then
  echo "No agents registered (empty list). Nothing to start.";
  exit 0
fi

# Use jq if available to extract ids, otherwise use crude parsing
AGENT_IDS=()
if command -v jq >/dev/null 2>&1; then
  mapfile -t AGENT_IDS < <(echo "$AGENTS_JSON" | jq -r '.[].id')
else
  # very simple fallback: extract "id":"..."
  mapfile -t AGENT_IDS < <(echo "$AGENTS_JSON" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]\+"' | sed -E 's/"id"[[:space:]]*:[[:space:]]*"([^"]+)"/\1/')
fi

if [ ${#AGENT_IDS[@]} -eq 0 ]; then
  echo "Could not detect any agent ids. Inspect $AGENTS_URL in the browser or use curl to check."
  exit 0
fi

for id in "${AGENT_IDS[@]}"; do
  echo_step "Starting agent: $id"
  START_URL=$(printf "$START_AGENT_URL_TEMPLATE" "$id")
  HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$START_URL") || true
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ]; then
    echo "  Agent $id start request accepted (HTTP $HTTP_CODE)."
  else
    echo "  Failed to start agent $id — HTTP $HTTP_CODE. Response:"
    curl -sS -X POST "$START_URL" || true
  fi
  sleep 0.2
done

# 7) Summary
echo_step "All done. Server should be running and agents have start requests sent."
echo " - Server health: $(curl -sS $HEALTH_URL)"
echo " - Tail logs: tail -n 60 $LOGFILE"

echo_step "Useful next commands (copy & paste):"
echo "  # Show server logs:\n  tail -f $ROOT_DIR/$LOGFILE"
echo "  # List agents:\n  curl http://localhost:3005/api/agents | jq '.'"
echo "  # Start a single agent:\n  curl -X POST http://localhost:3005/api/agents/kitt/start"
echo "  # Stop a single agent:\n  curl -X POST http://localhost:3005/api/agents/kitt/stop"
echo "  # Send a command to an agent:\n  curl -X POST http://localhost:3005/api/agents/kitt/command -H \"Content-Type: application/json\" -d '{\"command\":\"say\",\"params\":{\"text\":\"Hallo\"}}'"

exit 0
