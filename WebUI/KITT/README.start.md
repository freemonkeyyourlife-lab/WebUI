# K.I.T.T. Local Start Guide

Local-first, loopback-only, approval-gated personal AI environment with integrated multi-agent capabilities (K.I.T.T., Observer, Listener, Talker, Artanis) and the FREE MONKEYS GO! comic game module.

---

## 1. Prerequisites

- **Node.js**: v18.0.0+ (tested on Node.js v20/v24)
- **npm**: v8.0.0+
- **curl**: For health checks and smoke tests
- **Python**: 3.9+ (optional, for auxiliary worker services)

---

## 2. Directory Setup & Environment Configuration

Copy the example environment configuration into place:

```bash
cd WebUI/KITT
cp .env.example .env
```

Key environment configuration variables:
- `PORT=3005` (Loopback port binding)
- `HOST=127.0.0.1` (Strict local binding, no remote listening)
- `ENABLE_CORS=false` (Disabled by default for local isolation)
- `VOICE_REQUIRE_CONSENT=true` (German copyright & consent compliance)

---

## 3. Quick Start

### Starting K.I.T.T.

From the repository root or `WebUI/KITT`:

```bash
cd /home/runner/work/WebUI/WebUI
./WebUI/KITT/start-kitt.sh
```

This starts the K.I.T.T. Instruct & Repair service as a background daemon, creates all required directories (`mi/users`, `mi/memory`, `mi/transcripts`, `voice/samples`, `voice/jobs`), and polls the health endpoint until ready.

### Checking Health

```bash
./WebUI/KITT/check-health.sh
# Or direct curl:
curl -fsS http://localhost:3005/api/health
```

Expected output:
```json
{"status":"ok","service":"kitt-instruct-repair","mode":"safe-approval-gated"}
```

### Stopping K.I.T.T.

```bash
./WebUI/KITT/stop-kitt.sh
```

---

## 4. Web Dashboards & UI

Once started, access the local-first web interfaces in your browser:

- **Agent Dashboard & Approval Gate**: [http://localhost:3005/agents.html](http://localhost:3005/agents.html)
- **MI Personal Profile & Consent Settings**: [http://localhost:3005/mi_settings.html](http://localhost:3005/mi_settings.html)
- **Prompt Builder**: [http://localhost:3005/prompt_builder.html](http://localhost:3005/prompt_builder.html)
- **Artanis Autonomous Planner & Digital Buddy**: [http://localhost:3005/artanis.html](http://localhost:3005/artanis.html)
- **FREE MONKEYS GO! Comic Game**: [http://localhost:3005/game.html](http://localhost:3005/game.html)

---

## 5. Automated Verification & Smoke Tests

Run the comprehensive end-to-end smoke test suite covering all 9 test groups and 30+ endpoints across Stages 0–5:

```bash
./WebUI/KITT/smoke-test.sh
```

All test assertions verify:
1. Health and module catalog
2. Agent registry, start/stop, and approval gating for sensitive capabilities
3. Task approval flow (`POST /api/requests/:id/approve`)
4. Parametric prompt templates with `{{var}}` placeholders
5. Local MI personal memory, daily digest, notification muting, and strict consent gate (blocking outbound sharing with HTTP 403)
6. Voice workflow with §53 UrhG consent requirement, offline preview, and SubRip SRT export
7. Artanis autonomous goal decomposition into multi-agent subtasks
8. FREE MONKEYS GO! micro-missions, rewards tick, and opt-in social high-fives
9. Static UI dashboards availability

---

## 6. Architecture & Local Isolation

- **Loopback Default**: Server binds strictly to `127.0.0.1`.
- **Approval Gate**: Commands marked with `requiresApproval: true` create tasks with `status: pending_approval` and require explicit human sign-off via `POST /api/requests/:id/approve`.
- **Outbound AI Gate**: External sharing endpoint `/api/mi/:user/share-external` rejects requests with HTTP 403 unless both `externalAIConsent.allowOutbound` is `true` and `sharingLevel != 'none'`.
- **Local Voice Privacy**: No audio is dispatched to external clouds. Offline previews return `not-synthesized` safely when no local TTS engine is present.
