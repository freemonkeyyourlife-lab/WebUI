# Skill Handlers Guidance

When you implement a skill handler (e.g. /api/skills/voice), follow these rules:

1. Minimal trusted surface
- Each handler should expose only a small set of endpoints (status, start-job, preview, metadata).
- Authenticate/authorize calls from K.I.T.T. core.

2. Idempotent job creation
- Creating a job must be safe to retry; use job IDs and check for duplicates.

3. Clear inputs & outputs
- Accept structured payloads. For voice: {voiceId, mode, preset, samples[]}
- Return job object {id, status, logs, artifacts[]}

4. Safety gating
- If a requested action is high-risk (security, external publishing, legal), the handler must require explicit approval flags from the core.

5. Logging & audit
- Record who requested what and when. Store minimal PII and keep logs encrypted if necessary.

6. Test-first
- Provide simple smoke tests for each handler (health check, start job, get job).
