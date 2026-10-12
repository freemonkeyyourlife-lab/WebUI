# K.I.T.T. Handbuch

## 1. Überblick

K.I.T.T. (Knight Integrated Tooling & Tasking) ist der lokale Orchestrator für die Free Monkeys Plattform. Er vereint:
- Anforderungs-Aufnahme (Text, Link, Prompt, Datei)
- Module/Routing (Voice, Chat, WebUI, Repair, Security, Media)
- Planung / Blueprint-Logik (Issue → Struktur → Safe Plan)
- Approvals / Audit / Sicherheit
- Optionaler Voice-Pipeline und Preview-Workflow

Das System ist lokal-first, sicher, erweiterbar und kann ohne GitHub-Verbindung laufen.

## 2. Ziel der Plattform

K.I.T.T. soll:
- auf lokale Maschinen laufen
- auf Unix, Windows, macOS und Android-Wrapper nutzbar sein
- Anfragen in klar definierte Skills/Module routen
- bevor Änderungen ausgeführt werden, eine freie menschliche Freigabe verlangen
- rein verantwortungsbewusst, ohne künstliche Zensur oder blindes Cloud-Handling operieren
- später Models, Skills, Voice-Profile und module-weit erweiterbar sein

## 3. Struktur des Projekts

- WebUI/KITT/README.md
- WebUI/KITT/docs/Master-Overview.md
- WebUI/KITT/instruct-repair/
- WebUI/KITT/skills/
- WebUI/KITT/voice/
- WebUI/KITT/prompts/
- WebUI/KITT/installers/

## 4. Schnellstart (empfohlen)

### 4.1 Docker

```bash
cd <repo-root>
docker compose -f WebUI/KITT/voice/docker/voice-compose.yml up -d
cd WebUI/KITT/instruct-repair
npm install
npm start
```

Danach im Browser:
- http://localhost:3005  → K.I.T.T. Instruct & Repair UI
- http://localhost:3000 → WebUI (falls vorhanden)

### 4.2 Native ohne Docker

#### Linux / macOS
```bash
chmod +x WebUI/KITT/installers/native/install-linux.sh
./WebUI/KITT/installers/native/install-linux.sh
source .venv/bin/activate
node WebUI/KITT/instruct-repair/server.js
```

#### Windows (PowerShell)
```powershell
./WebUI/KITT/installers/native/install-windows.ps1
& .\.venv\Scripts\Activate.ps1
node WebUI/KITT/instruct-repair/server.js
```

## 5. Bedienleitfaden

### 5.1 Instruct & Repair Service

Die Oberfläche öffnet eine einfache Anforderungs-Form:
- Titel
- Typ (Text / Link / Datei)
- Befehl oder Wunsch
- Link / Referenz
- gewünschte Capability

Danach erscheint der Task in der Queue.

Die Zustände sind:
- queued
- analyzing
- ready
- approved
- blocked

Bevor der Task ausgeführt wird, muss er manuell freigegeben werden.

### 5.2 Skill Auswahl

Das System versucht auf Basis des Inputs das passende Modul auszuwählen:
- Voice / Audio
- Chat / Agent-Orchestrierung
- WebUI / Dashboard
- Media / Video / Music
- Repair / Bugfix
- Security / Privacy

Der Skill-Mapper basiert auf Keywords und Regeln und ist leicht erweiterbar.

### 5.3 Prompt-Baukasten

Prompt-Katalog und Templates liegen in:
- WebUI/KITT/prompts/catalog.json
- WebUI/KITT/prompts/code_templates.json

Dort stehen vordefinierte Prompts für:
- Voice Clone Preset
- Image generation
- Research brief
- Repair planner
- Marketing / Social posts

Mit dem Generator kannst du Platzhalter ersetzen:

```bash
node WebUI/KITT/prompts/generate_command.js python_voice_worker \
  REPO_ROOT=/home/user/project \
  AUDIO_PATH=/home/user/samples/kitt.wav \
  VOICE_NAME=KITT \
  CONSENT=true \
  MODE=rvc
```

## 6. Leistungsportfolio (Funktionen)

### 6.1 Request Intake
- Textuelle Anfragen
- Link-basierte Aufgaben
- Datei-/Referenz-Inputs
- Aufgabe in Queue und Statuslog

### 6.2 Repair / Planning
- Analyse von Fehlern und Zuständen
- Erzeugung eines Blueprint mit:
  - Root cause hypothesis
  - minimal fix
  - validation steps
  - rollback plan
  - approval requirement

### 6.3 Voice Manager
- Upload von WAV / FLAC
- Consent-Flag erforderlich
- Worker-Logik für Audio-Qualitätscheck
- Erstellung eines Voice-Jobs
- späterer Synthese-Preview
- lokal-first pipeline

### 6.4 Skill Registry
- zentrales Modulverzeichnis
- dynamische Zuordnung von Request → Skill
- Erweiterung durch neue JSON-Einträge

### 6.5 Prompt-Katalog / Builder
- Lebenszyklus: Prompt suchen, Auswahl, Variablen ersetzen, Ausgabe generieren
- Integration in Benutzer-Requests und Agenten

### 6.6 Installer
- Docker compose
- Electron wrapper
- native installer für Linux, Windows und macOS
- Android-Wrapper notizen (optional)

## 7. Voice Workflow (Detail)

### 7.1 Anforderungen
- Sample-Dateien nur mit Consent
- WAV oder FLAC
- gute Sprachqualität, leiser Hintergrund, konstante Lautstärke

### 7.2 Lokalworkflow
1. Upload des Audio-Samples
2. Worker validiert Datei
3. Quali checks
4. Modell/Job-Plan wurde erzeugt
5. Trainings-/Synthese-Schritt startet
6. Preview und Bearbeitung folgen

### 7.3 Beispiel-Worker-Aufruf
```bash
python WebUI/KITT/voice/worker/voice_worker.py \
  --audio /path/to/voice.wav \
  --name "KITT Primary" \
  --consent true \
  --mode rvc
```

## 8. Sicherheit und Datenschutz

Empfohlene Regeln:
- Jeder Voice-Upload braucht Consent
- API-Schlüssel nur als Secrets speichern
- Keine automatischen Produktions-Changes ohne Freigabe
- Logdateien sichern und regelmäßig prüfen
- Modellartefakte lokal halten

## 9. API-Schlüssel und Authentifizierung

### 9.1 Warum nötig?
- Kontrolle über Dienstzugriff
- Zugriff auf Job-APIs nur für autorisierte Nutzer/Agenten
- Audit log und Security layer

### 9.2 Beispiel-Generierung
```bash
openssl rand -hex 32
```

### 9.3 Empfehlung zur Speicherung
- .env.local (lokal, geschützt)
- chmod 600 .env.local
- oder OS-Keyring / Docker-Secrets

### 9.4 Beispiel .env
```env
KITT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VOICE_REQUIRE_CONSENT=true
```

### 9.5 Beispiel Node Middleware
```js
const apiKey = process.env.KITT_API_KEY;
app.use((req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).send('Missing API key');
  const key = header.slice(7);
  if (key !== apiKey) return res.status(403).send('Invalid API key');
  next();
});
```

## 10. API Beispielaufrufe

### Health
```bash
curl http://localhost:3005/api/health
```

### Request erstellen
```bash
curl -X POST http://localhost:3005/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Voice Profil",
    "sourceType":"text",
    "text":"Erstelle ein lokales Voice-Profil für K.I.T.T.",
    "requestedCapability":"voice"
  }'
```

### Aufgabenliste
```bash
curl http://localhost:3005/api/requests
```

### Genehmigen
```bash
curl -X POST http://localhost:3005/api/requests/<task-id>/approve
```

### Blueprint lösen
```bash
curl -X POST http://localhost:3005/api/requests/<task-id>/resolve
```

## 11. Prompt-Katalog Bedienung

Beispiel-Suche:
```bash
node - <<'NODE'
const { searchPrompts } = require('./WebUI/KITT/prompts/search.js');
console.log(searchPrompts('voice'));
NODE
```

Template ausgeben:
```bash
node WebUI/KITT/prompts/generate_command.js python_voice_worker \
  REPO_ROOT=/home/user/project \
  AUDIO_PATH=/home/user/samples/kitt.wav \
  VOICE_NAME=KITT \
  CONSENT=true \
  MODE=rvc
```

## 12. Export / Backup / Wiederherstellung

Empfohlene Backups:
- WebUI/KITT/instruct-repair/data/tasks.json
- WebUI/KITT/voice/jobs/
- Voice-Profiles / model metadata
- .env.local / API-Keys

Export-Workflow:
- exportiere JSON-Dateien nach /backup/
- sichere Schlüssel als .env.local oder OS-Keyring
- dokumentiere Version / createdAt / owner

## 13. Roadmap / nächste Schritte

### Direkt machbar
- API-Key-Middleware aktivieren
- Prompt-Baukasten vollständig mit UI einbinden
- Voice Job Runner + Preview endpoint ausbauen
- Repair patch generator finalisieren

### Mittelreife
- dev-agent preview (local ngrok)
- WebUI-KI-Routing weiter verfeinern
- Model-Audit & encryption

### Langzeit
- Desktop/Native App
- Android wrapper
- Remote GPU support optional
- Multi-user RBAC

## 14. Wichtige Hinweise

- Kein automatisches Pushen oder Mergen ohne Freigabe
- Lokale Nutzung hat Vorrang vor Cloud/Internet-Integrationen
- Ein K.I.T.T.-Voice-Design sollte originell und rechtlich sauber sein; 1:1 Nachbildungen fremder Stimmen nur mit ausdrücklicher Erlaubnis
- Der systemische Fokus liegt auf verantwortungsbewusster Qualität statt unkontrollierter Automatisierung

## 15. Kurzfassung

K.I.T.T. ist dein lokaler Agent- und Orchestrator-Baukasten. Er nimmt Anfragen entgegen, klassifiziert sie, prüft sie sicher, plant Veränderungen, verwaltet Voice-Profile und hält alles in einem kontrollierten, modularen System. Du kannst ihn lokal auf Windows, macOS, Linux oder via Docker starten und später je nach Bedarf erweitern.

Wenn du möchtest, kann ich dir als Nächstes noch 2 konkrete Dinge direkt bauen:
1) die vollständige PromptBuilder-UI / Live-Suche in K.I.T.T.
2) die sichere API-Key-Middleware für die K.I.T.T.-Server-API

oder ich lege dir auch gleich die Datei WebUI/KITT/docs/HANDBUCH.md im Repo an.
