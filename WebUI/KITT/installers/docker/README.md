# Docker deployment (recommended)

This is the recommended way to run K.I.T.T. locally on Linux, macOS and Windows (with Docker Desktop).

Prerequisites
- Docker Engine & Docker Compose (or Docker Desktop)
- At least 8 GB RAM for small workloads; 16+ GB + GPU for model training / heavy inference

Quick start

1. From the repository root run:

```bash
# bring up services in detached mode
docker compose -f WebUI/KITT/voice/docker/voice-compose.yml up -d
```

2. Start the Instruct & Repair service (if not part of compose):

```bash
cd WebUI/KITT/instruct-repair
npm install
npm start
```

3. Open the UI in the browser:
- Instruct & Repair UI: http://localhost:3005
- (WebUI frontend if present): http://localhost:3000

Stopping

```bash
docker compose -f WebUI/KITT/voice/docker/voice-compose.yml down
```

Customization
- Edit .env files and docker compose to enable/disable the inference service or change ports.
