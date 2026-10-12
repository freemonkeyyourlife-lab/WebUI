# K.I.T.T. Architecture

K.I.T.T. is the main orchestrator for the Free Monkeys ecosystem. It coordinates the agent network, manages voice, media, knowledge, and external tools, and exposes a central dashboard for the Chief user.

Core principles
- K.I.T.T. is the central controller.
- Agents are specialized modules and plugins, not monolithic services.
- Data, documents, media, and jobs are central but modular.
- Voice cloning is local-first and consent-gated.
- The system is extendable over time without rewriting the core.

System layers
1. Interface layer
   - Dashboard, terminal, chat, project views, media previews
2. Orchestration layer
   - Agent registry, router, queue, task states, policies
3. Service layer
   - Voice, image, video, music, research, business, legal, code, automation, social
4. Data layer
   - SQLite/Postgres, object storage, embeddings, logs, archives
5. Runtime layer
   - Local models via Ollama, external APIs, workers, inference services

Primary agents
- Illuminati: research, news, statistics, archive, verification
- Daniel Düsentrieb: tools, devops, media conversion, systems engineering
- Spielberg-Dali: images, stories, videos, game visuals
- Social Media AI: content pipeline, marketing, SEO, campaigns
- MJ: music, voice training, audio production
- Mattlock: legal, security, architecture, academy
- Bill Jobs: AI academy, model training, prompt engineering, Linux automation
- Phantom: shared memory / central knowledge instance
- K.I.T.T.: central orchestrator

Routing model
- Every task enters the orchestrator.
- The router decides: direct tool, local agent, external service, or multi-agent chain.
- Each task has status: queued, running, waiting, complete, failed, require-review.
- Human approval remains possible for sensitive or external operations.

Default local stack
- Web UI: Next.js / React / Tailwind
- Backend: FastAPI or Node service
- Data: SQLite + optional Postgres later
- Search: Qdrant/Chroma optional
- Models: Ollama local models
- Voice: local inference + RVC / TTS options

Recommended roadmap
- Phase 1: Dashboard + basic registry + local agent runner
- Phase 2: Voice upload and synth pipeline
- Phase 3: Research/news archive and project tracking
- Phase 4: Media + gaming + content pipeline
- Phase 5: Installer + portable deployments
