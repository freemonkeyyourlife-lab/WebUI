# K.I.T.T. Start Guide

This file explains how to start the K.I.T.T. local stack and what to do after launch.

## 1) Prerequisites

Install the following if missing:

- Node.js 18+
- npm
- Python 3.8+
- Docker + Docker Compose (optional, recommended)
- Git (optional but useful)

## 2) Recommended: Start with Docker

From the repository root:

```bash
./WebUI/KITT/installers/docker/start-local.sh
```

Then open:

- http://localhost:3005  ← K.I.T.T. Instruct & Repair UI

To stop:

```bash
./WebUI/KITT/installers/docker/stop-local.sh
```

## 3) Native start (no Docker)

### Linux / macOS

```bash
chmod +x WebUI/KITT/installers/native/install-linux.sh
./WebUI/KITT/installers/native/install-linux.sh
source .venv/bin/activate
node WebUI/KITT/instruct-repair/server.js
```

### Windows (PowerShell)

```powershell
./WebUI/KITT/installers/native/install-windows.ps1
& .\.venv\Scripts\Activate.ps1
node WebUI/KITT/instruct-repair/server.js
```

Then open:

- http://localhost:3005

## 4) Health check

Open in browser:

```text
http://localhost:3005/api/health
```

Expected result:

```json
{"status":"ok","service":"kitt-instruct-repair","mode":"safe-approval-gated"}
```

## 5) Create your first request

Open the UI at http://localhost:3005 and create a task.

Example values:

- Title: "K.I.T.T. Voice profile"
- Text: "Create a local voice profile with consent and preview"
- Requested Capability: "voice"

Then click "Anforderung senden".

## 6) Approve once the task is created

In the queue, click:

- Approve
- Resolve

This creates a safe plan only. No automatic patch is executed without your approval.

## 7) Voice worker test (optional)

Example:

```bash
python WebUI/KITT/voice/worker/voice_worker.py \
  --audio /path/to/sample.wav \
  --name "KITT Primary" \
  --consent true \
  --mode rvc
```

This produces a job metadata file in:

- WebUI/KITT/voice/jobs/

## 8) Prompt builder (optional)

```bash
node WebUI/KITT/prompts/generate_command.js python_voice_worker \
  REPO_ROOT=/home/user/project \
  AUDIO_PATH=/home/user/samples/kitt.wav \
  VOICE_NAME=KITT \
  CONSENT=true \
  MODE=rvc
```

## 9) Important safety defaults

- Voice uploads require consent
- API endpoints are approval-gated by design
- No automatic production change without explicit approval
- Keep model artifacts and API keys local and protected

## 10) Typical workflow in practice

1. Start K.I.T.T.
2. Open the UI
3. Create request via text or prompt template
4. Review the queue and task plan
5. Approve / resolve the task
6. Validate locally
7. Repeat / iterate with new prompts and versions

## 11) What to do next

Recommended next tasks:

- add an API key layer
- connect the Prompt Builder UI fully to the request form
- integrate Voice validation + preview flow
- add local preview / dev build views
- implement the repair patch blueprint generator

## 12) Local file references

Key files:

- WebUI/KITT/instruct-repair/server.js
- WebUI/KITT/instruct-repair/public/index.html
- WebUI/KITT/skills/registry.json
- WebUI/KITT/voice/worker/voice_worker.py
- WebUI/KITT/prompts/catalog.json
- WebUI/KITT/installers/docker/start-local.sh

## 13) Troubleshooting

### Server not reachable
- Confirm Node is installed
- Confirm server is running in the terminal
- Check port 3005 is free
- Try: curl http://localhost:3005/api/health

### Docker not found
- Install Docker Desktop or Docker Engine

### Permission denied
- Run chmod +x on shell scripts

### Voice worker rejects sample
- Ensure file type is WAV or FLAC
- Ensure consent is true

## 14) Summary

This is the local entrypoint for K.I.T.T. Use it to start the secure queue, manage prompts, create requests, validate voice samples, and keep the platform modular and local-first.
