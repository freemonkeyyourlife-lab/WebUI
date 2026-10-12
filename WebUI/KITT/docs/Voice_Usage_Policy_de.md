# Stimmnutzungs- und Rechtsinformation (Deutsch)

Titel: Nutzung von Stimmklonen – Privater Gebrauch & rechtliche Hinweise

Version: 1.0
Datum: 2026-10-12

Kurzfassung
-----------
Diese Richtlinie erklärt, was beim Erstellen und Verwenden von Stimme(n) in K.I.T.T. im rein privaten Rahmen zulässig ist und wo rechtliche Grenzen erreicht werden. Sie fasst die wichtigsten Punkte in klarer Sprache zusammen und dient als Grundlage für das Consent‑Modal im Voice‑Upload.

1) Kann ich die Stimme privat nutzen?
-----------------------------------
Ja — die Stimme darf rein privat genutzt werden. Solange du das Projekt ausschließlich für dich selbst, in deinen privaten Räumen oder in deinem eigenen Fahrzeug nutzt, greift regelmäßig das Recht auf Privatkopie und es bestehen deutlich geringere rechtliche Risiken.

Wichtig: Sobald die Stimme jedoch außerhalb des privaten Rahmens verwendet oder verbreitet wird, musst du vorab rechtliche Grenzen beachten und ggf. Genehmigungen einholen.

2) Was im privaten Rahmen erlaubt ist
-----------------------------------
- Private Kopien & Audio‑Samples: Das Herausschneiden von kurzen Original‑Sprachfetzen zur privaten Verwendung fällt meist unter das Recht auf Privatkopie (§53 UrhG), sofern die Verwendung rein privat bleibt.
- KI‑Klonen für den Eigenbedarf: Modelle, die du lokal mit eigenen Audiodateien trainierst, dürfen für rein private Zwecke (z. B. dein Smart‑Home, dein privates Auto) verwendet werden.

3) Wo die Grenze zur Illegalität verläuft
---------------------------------------
Die Grenze ist erreicht, sobald du die private Nutzung verlässt, z. B.:
- Veröffentlichen oder Teilen im Internet (YouTube, TikTok, Social Media etc.)
- Weitergabe des trainierten Modells an Dritte oder Upload auf öffentliche Plattformen
- Öffentliche Vorführung (Messen, Treffen, Ausstellungen) mit hörbarer Wiedergabe

Deutsche Gerichte haben bei unautorisierten KI‑Stimmklonen häufig restriktiv entschieden; daher ist Vorsicht geboten.

4) Empfehlungen & Umsetzung in K.I.T.T.
--------------------------------------
- Consent‑Pflicht: Jede hochgeladene Sprachprobe benötigt eine ausdrückliche Zustimmung (Consent‑Checkbox) und eine kurze Bestätigung, dass die Nutzung privat erfolgen darf.
- Beweisdokumentation: Optional kann der Nutzer ein Dokument / eine unterschriebene Einwilligung hochladen, wenn eine externe Stimme verwendet werden soll.
- Speicherung & Audit: Jede Generierung/Ausgabe protokollieren (Wer, was, wann, welches Voice‑Preset). Logs werden verschlüsselt gespeichert.
- Export‑Beschränkung: Modelle/Artifacts dürfen nicht automatisch exportierbar sein; ein manueller Export muss vom Besitzer genehmigt und protokolliert werden.

5) Beispieltexte (für UI / Consent‑Modal)
----------------------------------------
Kurztext (Checkbox‑Label):
„Ich bestätige, dass ich die Rechte an den hochgeladenen Audio‑Dateien habe und die erzeugten Stimmen ausschließlich privat nutze. Mir ist bewusst, dass eine Veröffentlichung oder Weitergabe rechtliche Folgen haben kann.“

Tooltip / Hilfetext (bei Bedarf):
„Privat = Nutzung in deinen eigenen Räumen oder deinem privaten Fahrzeug. Veröffentlichung, Teilen oder Verbreitung ist nicht gestattet ohne ausdrückliche Genehmigung der betroffenen Person/Rechteinhaber. Bei Unsicherheit lade eine schriftliche Einwilligung hoch.“

6) Technische Umsetzung (Kurz)
------------------------------
- UI: Consent‑Checkbox + optionaler Upload für Einwilligungsdokument hinter dem Upload‑Formular.
- API: `POST /api/voice/voices` erfordert ein `consent: true` Feld; serverseitig validieren und speichern.
- Storage: Verschlüsselte Ablage für model artifacts, Einwilligungsdokumente und Logs.
- Audit: Tab mit Nutzungsverlauf (wer hat welche Sätze generiert, Timestamp, Preset).

7) Haftungsausschluss
---------------------
Diese Zusammenfassung ist keine Rechtsberatung. Bei Unsicherheit oder öffentlicher Nutzung wende dich bitte an eine Rechtsberatung oder Fachanwalt.

---

Datei: WebUI/KITT/docs/Voice_Usage_Policy_de.md

