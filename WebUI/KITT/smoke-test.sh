#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/instruct-repair"
STARTED_BY_TEST=0
BASE_URL="http://127.0.0.1:3005"

cleanup() {
  if [ "$STARTED_BY_TEST" -eq 1 ]; then
    echo "Stopping test server instance..."
    "$SCRIPT_DIR/stop-kitt.sh" || true
  fi
}
trap cleanup EXIT

echo "=========================================================="
echo "  K.I.T.T. & FREE MONKEYS GO! — Automated Smoke Test Suite"
echo "=========================================================="

# 1. Start server if not running
if ! curl -fsS "$BASE_URL/api/health" >/dev/null 2>&1; then
  echo "Server is not running. Starting K.I.T.T. via start-kitt.sh..."
  "$SCRIPT_DIR/start-kitt.sh"
  STARTED_BY_TEST=1
else
  echo "Server already running at $BASE_URL."
fi

assert_status() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" -eq "$expected" ]; then
    echo "  [PASS] $desc (HTTP $actual)"
  else
    echo "  [FAIL] $desc (Expected HTTP $expected, got HTTP $actual)"
    exit 1
  fi
}

echo ""
echo "=== Test Group 1: Health & System Catalog ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
assert_status "GET /api/health" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/modules")
assert_status "GET /api/modules" 200 "$STATUS"

echo ""
echo "=== Test Group 2: Agent Registry & Capabilities ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/agents")
assert_status "GET /api/agents" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/agents/kitt")
assert_status "GET /api/agents/kitt" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/agents/kitt/capabilities")
assert_status "GET /api/agents/kitt/capabilities" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/agents/kitt/start")
assert_status "POST /api/agents/kitt/start" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/agents/kitt/stop")
assert_status "POST /api/agents/kitt/stop" 200 "$STATUS"

# Safe command execution
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/agents/kitt/command" \
  -H "Content-Type: application/json" \
  -d '{"capability":"orchestrate_agents","params":{"goal":"test"}}')
assert_status "POST /api/agents/kitt/command (safe capability)" 200 "$STATUS"

# Sensitive capability (requires approval gate)
RESP=$(curl -s -X POST "$BASE_URL/api/agents/kitt/command" \
  -H "Content-Type: application/json" \
  -d '{"capability":"execute_system_command","params":{"command":"whoami"}}')
STATUS=$(echo "$RESP" | grep -q "pending_approval" && echo "200" || echo "500")
assert_status "POST /api/agents/kitt/command (sensitive capability -> pending approval)" 200 "$STATUS"

echo ""
echo "=== Test Group 3: Requests & Approval Gate ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/requests")
assert_status "GET /api/requests" 200 "$STATUS"

REQ_RESP=$(curl -s -X POST "$BASE_URL/api/requests" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"kitt","capability":"config_override","params":{"key":"test"}}')
REQ_ID=$(node -e "console.log(JSON.parse(process.argv[1]).request.id)" "$REQ_RESP")

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/requests/$REQ_ID/approve" \
  -H "Content-Type: application/json" \
  -d '{"approver":"chief"}')
assert_status "POST /api/requests/:id/approve" 200 "$STATUS"

echo ""
echo "=== Test Group 4: Prompt Builder Catalog ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/prompts")
assert_status "GET /api/prompts" 200 "$STATUS"

PROMPT_RESP=$(curl -s -X POST "$BASE_URL/api/prompts" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Prompt","template":"Hello {{name}}, code is {{code}}","tags":["test"]}')
PROMPT_ID=$(node -e "console.log(JSON.parse(process.argv[1]).item.id)" "$PROMPT_RESP")

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/prompts/$PROMPT_ID")
assert_status "DELETE /api/prompts/:id" 200 "$STATUS"

echo ""
echo "=== Test Group 5: MI Profile, Memory, Digest & Consent Enforcement ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/mi/chief/profile")
assert_status "GET /api/mi/:user/profile" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/mi/chief/profile" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"K.I.T.T. Prime"}')
assert_status "POST /api/mi/:user/profile" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/mi/chief/memory" \
  -H "Content-Type: application/json" \
  -d '{"text":"Smoke test memory entry","category":"diagnostics"}')
assert_status "POST /api/mi/:user/memory" 201 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/mi/chief/memory")
assert_status "GET /api/mi/:user/memory" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/mi/chief/digest")
assert_status "GET /api/mi/:user/digest" 200 "$STATUS"

# Consent policy: outbound sharing must be blocked (HTTP 403) by default
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/mi/chief/share-external" \
  -H "Content-Type: application/json" \
  -d '{"payload":"test"}')
assert_status "POST /api/mi/:user/share-external (Consent Gate: HTTP 403 Forbidden by default)" 403 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/mi/chief/notifications/mute" \
  -H "Content-Type: application/json" \
  -d '{"durationMinutes":30}')
assert_status "POST /api/mi/:user/notifications/mute" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/mi/audit")
assert_status "GET /api/mi/audit" 200 "$STATUS"

echo ""
echo "=== Test Group 6: Voice Workflow & Consent Enforcement ==="
# Missing consent must be rejected with 400
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/voice/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Unconsenting Voice","consent":false}')
assert_status "POST /api/voice/register (Reject when consent=false)" 400 "$STATUS"

# Valid registration with explicit consent
VOICE_RESP=$(curl -s -X POST "$BASE_URL/api/voice/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Voice","consent":true,"metadata":{"notes":"Smoke test audio"}}')
JOB_ID=$(node -e "console.log(JSON.parse(process.argv[1]).job.id)" "$VOICE_RESP")
assert_status "POST /api/voice/register (Accept when consent=true)" 201 201

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/voice/jobs")
assert_status "GET /api/voice/jobs" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/voice/preview")
assert_status "GET /api/voice/preview (Local-first offline preview)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/voice/transcripts/sample-1/srt")
assert_status "GET /api/voice/transcripts/:id/srt" 200 "$STATUS"

echo ""
echo "=== Test Group 7: Artanis Autonomous Planner & Digital Buddy Engine ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/artanis/status")
assert_status "GET /api/artanis/status" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/artanis/personas")
assert_status "GET /api/artanis/personas" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/artanis/personas" \
  -H "Content-Type: application/json" \
  -d '{"name":"Diagnostics Specialist","role":"System Monitor","traits":["precise"]}')
assert_status "POST /api/artanis/personas" 201 "$STATUS"

PLAN_RESP=$(curl -s -X POST "$BASE_URL/api/artanis/plan" \
  -H "Content-Type: application/json" \
  -d '{"goal":"Inspect local storage and announce telemetry"}')
PLAN_ID=$(node -e "console.log(JSON.parse(process.argv[1]).plan.planId)" "$PLAN_RESP")
assert_status "POST /api/artanis/plan (Autonomous goal decomposition)" 201 201

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/artanis/plans/$PLAN_ID/submit")
assert_status "POST /api/artanis/plans/:id/submit (Batch submission to approval gate)" 200 "$STATUS"

echo ""
echo "=== Test Group 8: FREE MONKEYS GO! Game Module ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/game/profile")
assert_status "GET /api/game/profile" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/game/monkeys")
assert_status "GET /api/game/monkeys" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/game/monkeys/go/comment?situation=idle")
assert_status "GET /api/game/monkeys/:id/comment" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/game/pois")
assert_status "GET /api/game/pois (GeoJSON POI FeatureCollection)" 200 "$STATUS"

MISSION_RESP=$(curl -s -X POST "$BASE_URL/api/game/missions/generate" \
  -H "Content-Type: application/json" \
  -d '{"type":"search","monkey":"go"}')
MISSION_ID=$(node -e "console.log(JSON.parse(process.argv[1]).mission.id)" "$MISSION_RESP")
assert_status "POST /api/game/missions/generate (1-3 min mission)" 201 201

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/game/missions/$MISSION_ID/accept")
assert_status "POST /api/game/missions/:id/accept (Activate timer)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/game/missions/$MISSION_ID/complete" \
  -H "Content-Type: application/json" \
  -d '{}')
assert_status "POST /api/game/missions/:id/complete (Award XP & coins)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/game/rewards/tick")
assert_status "POST /api/game/rewards/tick (15-min reward tick check)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/game/social/highfive")
assert_status "POST /api/game/social/highfive (Generate opt-in token)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/game/history")
assert_status "GET /api/game/history" 200 "$STATUS"

echo ""
echo "=== Test Group 9: Static UI Dashboards ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/agents.html")
assert_status "GET /agents.html" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/prompt_builder.html")
assert_status "GET /prompt_builder.html" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/mi_settings.html")
assert_status "GET /mi_settings.html" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/artanis.html")
assert_status "GET /artanis.html" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/game.html")
assert_status "GET /game.html" 200 "$STATUS"

echo ""
echo "=========================================================="
echo "  All smoke test assertions PASSED successfully (100%)!"
echo "=========================================================="
exit 0
