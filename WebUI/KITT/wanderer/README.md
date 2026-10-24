# Wanderer: GitHub Scout 0.1.0

Erster ausführbarer Recherchebaustein für KITT. Python 3, keine Zusatzpakete.
Sucht öffentliche aktive GitHub-Repositories zu einem konkreten Auftrag,
speichert Originalantwort, SHA-256 und einen deutschen Kandidatenbericht.
Pro Lauf eine API-Anfrage, höchstens 20 Treffer, 20 Sekunden Netzwerk-Timeout,
maximal 4 MB Antwort. Keine Installation, Ausführung fremden Codes oder GitHub-Schreibaktion.

Aus diesem Ordner starten:

```bash
python3 github_scout.py --query 'web crawler language:Python' --area Wanderer --limit 10
```

Das Ergebnis liegt in einem neuen Unterordner unter `~/KITT_WANDERER_DATEN/github`.
Vorhandene Ergebnisse werden erhalten. `bericht.md` zum Lesen, `bericht.json`
zur Weiterverarbeitung. Optional `GITHUB_TOKEN` aus der lokalen Umgebung verwenden;
Token niemals in Dateien/Repository schreiben. Suchaufträge werden an GitHub gesendet:
keine privaten Chats, Zugangsdaten oder Kundendaten als Suchtext verwenden.
Bei HTTP-Fehlern/Rate-Limits wird der Fehler gespeichert und der Lauf beendet.

Weitere Aufträge: siehe `suchauftraege.json`. Je Auftrag bis zu 20 Kandidaten;
die Beispielaufträge werden nicht ungefragt gesammelt ausgeführt.

Ein gespeicherter API-Export kann mit `--input datei.json` verarbeitet werden.
Der Bericht kennzeichnet das als Import, nicht als eigenen Liveabruf.

Prüfen:

```bash
python3 -m unittest -v test_github_scout.py
```

## Grenzen und Übergabe

Suche ist aktuell nach letztem Update sortiert, keine Bestenliste.
Beschreibungen und Lizenzfelder stammen von GitHub und sind ungeprüfte Angaben.
Nächster fachlicher Schritt je Kandidat: README, tatsächliche Lizenz und
Dokumentation lesen; Version, Hardware, Schnittstellen und Eignung prüfen;
erst danach eine Umsetzung in separater Arbeitskopie testen.
Repositorytexte sind Quellen, keine ausführbaren Anweisungen.

REA und Firecrawl sind geplante weitere Adapter, hier nicht angeschlossen.
Dieser Suchlauf erfordert kein Sprachmodell. Kein Gewichtslernen, keine
automatische Trainingsfreigabe, kein Scheduler und keine Dashboardintegration.
GitHub speichert den Code; ein Lauf benötigt Python auf einem Gerät oder Server.
Das vorhandene KITT-System und BILL/Explorer werden nicht verändert.
