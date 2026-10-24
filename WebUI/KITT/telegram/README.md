# K.I.T.T. Telegram Bridge v0.1

Isolierter Prototyp, nicht auf deinem Chromebook installiert. Bestehenden ARTANIS-Server geprüft: keine Änderungen an dessen Routen oder Ports.

## Funktionen
- Mehrere freigegebene Telegram-Chats/Gruppen über einen Bot; Chat-Wechsel in Telegram.
- /agents, /agent NAME, /task AUFTRAG, /history, /status, /chats, /help.
- Lokales SQLite-Archiv und Auftragswarteschlange, keine automatische KI-Ausführung.
- Keine öffentlichen lokalen Ports; nur ausgehende Telegram-API-Verbindung.

## Linux-Start
1. Eigenen Bot über Telegram @BotFather erstellen. Token geheim halten.
2. Bot im gewünschten Chat starten, Chat-ID lokal über die Bot-API ermitteln. Gruppenbot benötigt Einladung und passende Privacy-Mode-Einstellungen.
3. Im Verzeichnis WebUI/KITT/telegram:

```bash
export KITT_TELEGRAM_BOT_TOKEN='DEIN_TOKEN'
export KITT_TELEGRAM_ALLOWED_CHATS='123456789,-1001234567890'
python3 telegram_bridge.py
```

Daten: ~/.local/share/kitt-telegram/archive.sqlite3. Verschlüsselt sichern, nicht ins öffentliche GitHub hochladen.

## Grenzen
Persönliche bestehende Telegram-Privatchats lassen sich nicht vollständig per Bot-API auslesen; dazu wäre eine getrennte, ausdrücklich autorisierte MTProto-Client-Anbindung nötig. Diese ist nicht implementiert. Auch Multi-Bot-Profile, Web-UI, Rollenverwaltung, echte Agentenausführung und automatische Ergebnisrückmeldungen stehen noch aus.

## Geplante Architektur
Telegram -> Chat- und Rechteprüfung -> Agentenzuweisung -> Aufträge -> K.I.T.T.-Router -> Ergebnisregister -> Rückmeldung -> verschlüsseltes Archiv.
