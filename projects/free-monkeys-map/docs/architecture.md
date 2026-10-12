# Architektur (Kurz) — Free Monkeys® Map (MI)

Komponentenübersicht
- Frontend (static): Leaflet‑Map UI, Präsentationslogik, Theme, Voice‑UI
- Backend (FastAPI): API für /places, /voice, /tasks, Consent‑Endpoints
- Workers (optional): Background‑Jobs zur Voice‑Generierung, Task‑Execution, Content‑Moderation
- Storage: DB für Places/Offers (Postgres / Spatial), Object Storage für voice artifacts
- Shared: libs/shared für Consent/UI/Moderation Tools

Entwicklungsnotizen
- Beginne mit statischen /sample‑Daten; später DB‑Anbindung (PostGIS) hinzufügen
- Voice: lokale TTS für private Nutzung (Coqui/Local models) oder Anbieter mit consent support
- Security: Audit‑Logs, rate‑limit, auth, consent enforcement
