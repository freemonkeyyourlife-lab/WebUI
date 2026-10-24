"""Wanderer-Aufgaben: nachvollziehbare Aufträge und Ergebnisprüfung, Standardbibliothek."""
import argparse
import json
from pathlib import Path

TASKS = [
 ('W01','Illuminati','Archiv und Herkunft','Inventar einer freigegebenen Ablage erstellen; Dateiversionen und Originalquellen getrennt erfassen.'),
 ('W02','Düsentrieb','Website-Funktionen','Eine Basisseite analysieren: Funktion, Eingabe, Ausgabe, Werkzeug, tatsächlicher Anschluss, Prüfschritt.'),
 ('W03','Mattlock','Quellenprüfung','Aussagen eines Dokuments mit Fundstellen erfassen; Unsicherheit und fehlende Belege markieren.'),
 ('W04','Meli','SEO und Bedienbarkeit','Seitentitel, Überschriften, Linkziele, Alt-Texte und Bedienhindernisse mit Fundstellen prüfen.'),
 ('W05','Spielberg-Dali','Gestaltung','Vorhandene Gestaltungsvorgaben gegen eine Seite prüfen; keine Claims ergänzen; NACHBARSCHAFFT! exakt erhalten.'),
 ('W06','MJ','Medien-Inventar','Vorhandene Audio-/Medienfunktionen und ihre Ein-/Ausgaben inventarisieren; Verfügbarkeit belegen.'),
 ('W07','Bill Jobs','Trainer-Anschluss','Version, Basismodellrevision, unterstütztes Datenformat, Ressourcen und unabhängige Evaluation des vorhandenen Trainers dokumentieren. Keinen Lauf starten.'),
 ('W08','Statistikprofi','Evaluation','Aufgabenfamilien für Lernen und unabhängige Prüfung trennen; Ausgangsmodell und Kandidat nach denselben Kriterien vergleichen.'),
 ('W09','Spielberg-Dali','Missionen','Mission starten anhand vorhandener Regeln prüfen: Anmeldung, Kapazität, Zeitkonflikt und Doppelklick. Keine realen Teilnahmen anlegen.'),
 ('W10','KITT','Bestand und Restore','Eigene Arbeitskopie sichern und Wiederherstellung in separatem Testordner prüfen; fremde Bestände nicht verändern.'),
]

def tasks():
 return [dict(id=i,agent=a,gebiet=g,auftrag=t,status='vorbereitet',basisseite=None,
  skills=['quellenbelege','bestandsschutz','pruefbericht','lern_pruef_trennung'],
  abnahme=['Originalquelle und Fundstelle vorhanden','Behauptung und geprüfte Funktion getrennt','Fehlende Anschlüsse benannt','Keine ungeprüfte Trainingsfreigabe']) for i,a,g,t in TASKS]

def validate(result):
 errors=[]
 if result.get('task_id') not in {x[0] for x in TASKS}: errors.append('Unbekannte task_id')
 if not isinstance(result.get('quellen'),list) or not result['quellen']: errors.append('Quellen fehlen')
 else:
  for q in result['quellen']:
   if not isinstance(q,dict) or not all(isinstance(q.get(k),str) and q[k].strip() for k in ['quelle','fundstelle','beleg']): errors.append('Quelle braucht quelle, fundstelle und beleg')
 for k in ['ergebnis','pruefschritte','anschluesse_offen']:
  if k not in result: errors.append(k+' fehlt')
 if not isinstance(result.get('ergebnis'),str) or not result.get('ergebnis','').strip(): errors.append('Ergebnis muss Text enthalten')
 for k in ['pruefschritte','anschluesse_offen']:
  if not isinstance(result.get(k),list): errors.append(k+' muss eine Liste sein')
 if result.get('trainingsfreigabe') is not False: errors.append('Ergebnisse bleiben ungeprüft: trainingsfreigabe muss false sein')
 return errors

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('aktion',choices=['liste','vorlage','pruefen'])
 p.add_argument('--datei',type=Path)
 a=p.parse_args()
 if a.aktion=='liste': print(json.dumps(tasks(),ensure_ascii=False,indent=2))
 elif a.aktion=='vorlage': print(json.dumps(dict(task_id='W02',quellen=[dict(quelle='',fundstelle='',beleg='')],ergebnis='',pruefschritte=[],anschluesse_offen=[],trainingsfreigabe=False),ensure_ascii=False,indent=2))
 else:
  if not a.datei: p.error('--datei erforderlich')
  errors=validate(json.loads(a.datei.read_text()))
  print(json.dumps(dict(format_gueltig=not errors,fehler=errors,fachlich_geprueft=False),ensure_ascii=False,indent=2))
  raise SystemExit(bool(errors))

if __name__=='__main__': main()
