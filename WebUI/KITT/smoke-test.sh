#!/usr/bin/env bash
# Smoke-Test: Bootstrap in Temp-Verzeichnis, Idempotenz, Health-Endpoint.
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="$(command -v python3 || command -v python)"
T="$(mktemp -d)"; PORT="${KITT_TEST_PORT:-3905}"; PID=""
trap '[ -n "$PID" ] && kill "$PID" 2>/dev/null || true' EXIT  # Temp-Dir bleibt (nichts löschen)

"$PY" "$SRC/core/bootstrap.py" --check --root "$T"
"$PY" "$SRC/core/bootstrap.py" --install --build --root "$T"
h1="$(cd "$T" && find . -type f -exec sha256sum {} + | sort)"
"$PY" "$SRC/core/bootstrap.py" --install --build --root "$T"
h2="$(cd "$T" && find . -type f -exec sha256sum {} + | sort)"
[ "$h1" = "$h2" ] || { echo "FAIL: nicht idempotent"; diff <(echo "$h1") <(echo "$h2"); exit 1; }
echo "OK: idempotent"

KITT_HOME="$T" KITT_PORT="$PORT" node "$T/app/server.js" >"$T/server.out" 2>&1 & PID=$!
for _ in $(seq 1 30); do curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break; sleep 0.2; done
curl -fs "http://127.0.0.1:$PORT/api/health" | grep -q '"ok"' || { echo "FAIL: health"; exit 1; }
curl -fs "http://127.0.0.1:$PORT/" | grep -q '<title>K.I.T.T.</title>' || { echo "FAIL: index.html"; exit 1; }
curl -fs "http://127.0.0.1:$PORT/api/dna" | grep -q 'K.I.T.T.' || { echo "FAIL: dna"; exit 1; }
id="$(curl -fs -X POST -d '{"title":"test"}' "http://127.0.0.1:$PORT/api/todos" | sed 's/.*"id":"\([^"]*\)".*/\1/')"
curl -fs -X PATCH -d '{"status":"archiv"}' "http://127.0.0.1:$PORT/api/todos/$id" | grep -q archiv || { echo "FAIL: todo"; exit 1; }
echo "SMOKE TEST GRÜN ($T)"
