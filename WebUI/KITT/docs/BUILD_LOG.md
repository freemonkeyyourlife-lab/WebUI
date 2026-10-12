# K.I.T.T. / Free Monkeys - Build Log

Ein Protokoll, das den gesamten Aufbau nachvollziehbar macht.
Neue Eintraege immer unten anfuegen (Datum, was, warum, Status).

## Entscheidungen (Stand 2026-10-13)

- Lokal-first: Betrieb ohne GitHub und ohne Cloud-Zwang.
- MI (Monkey Intelligence) = Free Monkeys (Sehen / Hoeren / Sagen), pro User einstellbar. NICHT identisch mit K.I.T.T.
- K.I.T.T. = Sprachrohr / Relay zu den Agenten und Skills.
- Alles Riskante ist approval-gated, Voice nur mit Consent.
- Install: ein Download + ein Terminal-Befehl (Linux, macOS, Windows).
- Hosting/Mieten: spaeter, erst wenn lokal stabil.
- Spiel "FREE MONKEYS GO!": Eckdaten folgen vom Owner (eigenstaendige Spiel-App ODER App + Spiel).

## Prioritaeten

1. Self-Installer (Terminal, ein Befehl) + Start/Stop/Healthcheck
2. Lokales Protokoll (dieses Log, mi/transcripts, mi/audit.log)
3. MI: Profil, Sharing-Level, Consent, Memory, Digest, UI
4. Voice: Upload/Record/Base64, Consent, Register, Preview, SRT
5. Prompt-/Task-Builder: Live-Suche, Variablen, Insert in Request
6. Agenten-Runtime + Skills, Dschungel-Map
7. Spiel FREE MONKEYS GO!

## Status (grob, %)

| Bereich | % |
|---|---|
| Instruct & Repair | 75-85 |
| File Operations | 95 |
| Prompt Builder | 55-70 |
| Voice Manager | 45 |
| Voice Worker | 30 |
| MI | 25-55 |
| Installer / Start-Skripte | 80 (Self-Installer offen) |
| Dschungel-Map UI | 10-20 |
| A-Team Agenten | 25 |
| Docs | 90-100 |
| FMC / Smart Contracts | 0 |
| Spiel FREE MONKEYS GO! | 0 (wartet auf Eckdaten) |

## Log

- 2026-10-12: K.I.T.T.-Basis, Instruct & Repair, Skill Registry, Voice-Scaffold, File-Router, MI-API-Stub im Repo angelegt.
- 2026-10-13: `start K.I.T.T..md` aktualisiert (lokaler Start, Docker/native, Healthcheck).
- 2026-10-13: Entscheidung: ein nachvollziehbares Build-Log statt vollstaendigem Chat-Mitschnitt.
- 2026-10-13: Offen: install-kitt.sh/.ps1, start/stop/health-Skripte, Spiel-Eckdaten.
