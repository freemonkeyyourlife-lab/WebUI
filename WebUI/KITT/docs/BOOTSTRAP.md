# K.I.T.T. Bootstrap

## Quickstart
```bash
./install.sh            # Linux/macOS (Windows: .\install.ps1)
curl localhost:3005/api/health
```
Voraussetzung: Node 18+, Python 3.8+. Zweiter Lauf ändert nichts. Test: `./smoke-test.sh`.

## Ablauf
`core/bootstrap.py [--check|--install|--build|--status] [--root DIR]` lädt DNA + Systemprompt, prüft Node/Python/npm, legt Fehlendes aus `templates/` an (`app/`, `data/`, ...) und schreibt `data/install_state.json`. Nichts wird überschrieben oder gelöscht; weicht eine Datei ab, entsteht `<datei>.new`. Danach startet `start-kitt.sh` (falls vorhanden), sonst `node app/server.js` auf 127.0.0.1:3005.

## Struktur
- `dna/kitt_dna.json` – Quelle der Wahrheit (Name, Rolle, Prinzipien, Module, Aktionen, Pfade)
- `prompts/system_prompt.md` – Systemprompt mit `{{var}}` aus der DNA
- `templates/` – Server, `public/index.html`, Modulvorlagen
- `core/extend.py` – `--new-module NAME`, `--propose DATEI --from NEU`, `--apply ID` (nur nach Bestätigung, Original bleibt als `.bak-ID`)
- `data/` – `todos.json`, `install_state.json`, `proposals/`, `audit.log` (append-only)

## Anpassen
DNA-Felder in `dna/kitt_dna.json` ändern; im Prompt `{{feld}}` verwenden (Listen werden aufgelistet). Der Server liefert beides unter `/api/dna`. API: `/api/health`, `/api/status`, `/api/todos` (GET/POST, PATCH `/api/todos/:id`; Status `offen|in_arbeit|fertig|archiv`, kein Löschen).

## Lokales Modell (Ollama)
`OLLAMA_MODEL=NAME python3 core/worker.py [--once]` schickt offene Aufträge (Box im Browser) an Ollama auf 127.0.0.1 und legt die Antwort als `data/proposals/<id>-antwort.md` ab. Nichts wird überschrieben; der Auftrag wird `in_arbeit`. Kein externer Call.
