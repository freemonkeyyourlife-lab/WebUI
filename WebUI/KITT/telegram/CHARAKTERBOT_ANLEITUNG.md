# K.I.T.T. Telegram Charakterbot V0.2 (Testversion)

**Noch nicht auf deinem Chromebook installiert und nicht live mit Telegram getestet.** Separater Prototyp; bestehende ARTANIS- und Telegram-Dateien bleiben unverändert.

## Figuren und Befehle
TANIA, K.I.T.T., BILL, Wanderer (Rektor; TOM ist verantwortlich), ARTANIS, TOM, K.A.R.R.

- `/start` oder `/hilfe`: Anleitung
- `/figuren`: Figurenliste
- `/figur tania` (oder bill, wanderer usw.): Figur **pro Chat** wechseln
- `/stimme an` oder `/stimme aus`: gesprochene Antworten ein-/ausschalten
- `/auftrag Erstelle einen Entwurf`: Aufgabe speichern, **nicht automatisch ausführen**
- `/status`: Modell, Figur und Stimme anzeigen
- Normale Nachricht: Antwort des lokalen Ollama-Modells, falls verbunden

## Einrichten (Linux)
1. In Telegram @BotFather mit `/newbot` einen Bot erstellen. Token geheim halten.
2. Dem Bot `/start` schicken; Chat-ID über Telegram Bot API `getUpdates` ermitteln. Nicht den Token oder komplette API-URL öffentlich posten.
3. **Nur lokal** im Terminal konfigurieren:

```bash
cd ~/ARTANIS-NEU/WebUI/WebUI/KITT/telegram
read -rsp "Telegram Bot Token: " KITT_TELEGRAM_BOT_TOKEN; echo
export KITT_TELEGRAM_BOT_TOKEN
export KITT_TELEGRAM_ALLOWED_CHATS='123456789'
export KITT_OLLAMA_URL='http://127.0.0.1:11434'
export KITT_OLLAMA_MODEL='huihui_ai/qwen2.5-abliterate:7b'
python3 characters_bot.py
```

Die Modellbezeichnung ist nur ein Beispiel; `ollama list` prüfen. Falls Ollama in Docker läuft, muss die Portfreigabe erreichbar sein. Wenn du den Entwicklungsbranch noch nicht lokal hast, zuerst Code nach GitHub-Stand aktualisieren, ohne lokale Änderungen zu überschreiben.

## Stimmen
Optional Piper und ffmpeg lokal installieren; passende lizenzierte Piper-Stimme als ONNX-Datei mit zugehöriger JSON-Konfiguration herunterladen. `KITT_PIPER_MODEL=/absoluter/pfad/stimme.onnx` setzen. Danach `/stimme an`. Ohne Piper wird Text gesendet, aber **keine Audiodatei**. V0.2 verwendet eine gemeinsame Piper-Stimme; **individuelle Stimmen je Charakter sind noch nicht implementiert**.

## Sicherheit und Grenzen
- Nur Chats in `KITT_TELEGRAM_ALLOWED_CHATS` werden bearbeitet.
- Telegram-Kommunikation läuft über Telegram-Server, also **nicht vollständig lokal**.
- Persönliche bestehende Chats können nicht pauschal über die Bot-API ausgelesen werden. Dafür ist eine gesonderte MTProto-Integration mit ausdrücklicher Kontofreigabe nötig.
- Lokales SQLite-Archiv: `~/.local/share/kitt-telegram/characters.sqlite3`. Es ist **nicht verschlüsselt**; Backup verschlüsseln und nicht in ein öffentliches Repository hochladen.
- Noch keine Voice-Message-Transkription, keine Menü-Buttons, kein automatischer Start, keine laufende Verbindung mit TANIA UI, kein Mehrbot-Profilwechsel.
- Für Gruppen Telegram Privacy Mode beachten. Nur mit Zustimmung aller Betroffenen archivieren.
