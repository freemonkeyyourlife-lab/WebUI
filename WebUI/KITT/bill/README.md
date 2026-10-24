# BILL – Programmierwerkstatt V0.1

BILL ist ein lokaler, zunächst regelbasierter Programmierassistent für K.I.T.T. und ARTANIS.

## Start

```bash
python3 WebUI/KITT/bill/bill.py status
python3 WebUI/KITT/bill/bill.py scan .
python3 WebUI/KITT/bill/bill.py check .
```

`scan` inventarisiert Dateien; `check` prüft Python-Syntax ohne Programmcode auszuführen. Keine Schreiboperationen an Projektdateien, keine automatische Installation, kein Deployment. `status` zeigt den Funktionsstand. KI-Modellanbindung und selbstständige Reparatur sind noch nicht implementiert.
