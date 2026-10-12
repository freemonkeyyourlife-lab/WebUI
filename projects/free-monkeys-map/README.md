# Free Monkeys® — Map (MI) — Projektübersicht

Dieses Verzeichnis enthält das Scaffold für das Projekt "Free Monkeys® (MI / FREE MONKEYS® GO)" — eine map‑zentrierte KI‑App (MI = Monkey INtelligenz). Ziel ist eine Karten‑UI mit Personas/Stimmen, Angeboten/Tasks auf der Map und einer klaren Consent‑/Policy‑Basis für Voice.

Kurz: Dieses Scaffold liefert eine schnelle lokale Dev‑Umgebung (Frontend + kleines Backend) und eine Dokumentationsbasis.

Ordnerstruktur
- frontend/: einfache statische Demo (Leaflet map + UI Platzhalter)
- backend/: FastAPI‑Microservice mit Endpunkten für /places, /health und voice consent stubs
- docs/: Policy & Architektur‑Notizen

Schnellstart (lokal)
1) Backend starten
   - Wechseln in projects/free-monkeys-map/backend
   - Virtuelle Umgebung erstellen: python3 -m venv .venv && source .venv/bin/activate
   - Abhängigkeiten installieren: pip install -r requirements.txt
   - Starten: uvicorn main:app --reload --host 127.0.0.1 --port 9001

2) Frontend öffnen
   - Öffne projects/free-monkeys-map/frontend/index.html im Browser (oder serviere mit http-server)
   - Das Frontend verbindet sich automatisch mit http://127.0.0.1:9001/api/places

Weiteres
- Dieses Scaffold ist bewusst minimal gehalten. Für Produktion sind Auth, sichere Speicherung, Consent‑Audit, Rate‑Limit, CORS, HTTPS und ein echtes DB‑Backend erforderlich.
