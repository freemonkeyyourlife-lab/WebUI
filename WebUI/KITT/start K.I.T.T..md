# K.I.T.T. Local Start Guide

This is the main local-first start guide for K.I.T.T. inside the WebUI repository.
It is designed so you can work without GitHub during runtime and keep a local audit trail.

## Goals

- Start K.I.T.T. locally with one terminal command
- Keep all runtime use local-first
- Record chat / request / task activity locally
- Support MI, Voice, Prompt Builder, and File Operations
- Provide a safe approval-gated workflow

## 1) Prerequisites

Install the following if missing:

- Node.js 18+
- npm
- Python 3.8+
- Docker + Docker Compose (optional, recommended)
- Git (optional but useful)

## 2) Recommended start flow

### Docker

From the repository root:

```bash
./WebUI/KITT/installers/docker/start-local.sh
```

Then open:

- http://localhost:3005

Health check:

- http://localhost:3005/api/health

Stop:

```bash
./WebUI/KITT/installers/docker/stop-local.sh
```

### Native start

#### Linux / macOS

```bash
cd WebUI/KITT/instruct-repair
npm install
node server.js
```

#### Windows PowerShell

```powershell
cd WebUI\KITT\instruct-repair
npm install
node server.js
```

Then open:

- http://localhost:3005

## 3) What to do after start

1. Open the UI
2. Create a request
3. Review the queue
4. Approve or resolve the task
5. Use File Ops for upload / import / extract / convert
6. Register voice samples if needed
7. Use Prompt Builder templates for repeated actions
8. Keep all work local-first unless you explicitly export or sync

## 4) Voice workflow

Example register call:

```bash
curl -X POST http://localhost:3005/api/voice/register \
  -H "Content-Type: application/json" \
  -d '{"name":"KITT Primary","file_path":"samples/kitt.wav","consent":true,"owner":"chief"}'
```

## 5) File operations

Example upload:

```bash
curl -X POST http://localhost:3005/api/files/upload \
  -F "file=@/path/to/file.wav" \
  -F "target=voice" \
  -F "name=kitt_sample.wav"
```

Example base64 upload:

```bash
curl -X POST http://localhost:3005/api/files/upload_base64 \
  -H "Content-Type: application/json" \
  -d '{"filename":"kitt.wav","data_base64":"<BASE64DATA>","target":"voice"}'
```

Example URL import:

```bash
curl -X POST http://localhost:3005/api/files/import_url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/file.zip","target":"files"}'
```

## 6) Request workflow

Example request:

- Title: `K.I.T.T. Voice profile`
- Text: `Create a local voice profile with consent and preview`
- Requested Capability: `voice`

Then click:

- `Anforderung senden`

## 7) Approval-gated behavior

- No automatic production changes without approval
- Requests become structured tasks
- Review the plan first
- Resolve only when you want the safe plan generated

## 8) Local transcript logging

The long-term goal is to keep the important local history inside the repository structure.
Suggested places:

- `WebUI/KITT/mi/transcripts/`
- `WebUI/KITT/mi/audit.log`
- `WebUI/KITT/instruct-repair/data/`

## 9) Next modules to finish

Priority order:

1. Self-installer scripts
2. MI profile / consent / memory
3. Voice workflow UI
4. Prompt Builder live search
5. File Ops UI consolidation
6. Local transcript and audit logging

## 10) Troubleshooting

### Server not reachable

- Check Node installation
- Check if port 3005 is in use
- Run: `curl http://localhost:3005/api/health`

### Permission denied

- Run `chmod +x` on shell scripts

### Voice sample rejected

- Use WAV or FLAC
- Set consent to true
- Ensure the file exists locally

## 11) Summary

K.I.T.T. is intended as a local-first controller with safe task handling, local logging, and modular extension points for MI, voice, prompt building, and file operations.
