#!/usr/bin/env python3
"""K.I.T.T. Worker: arbeitet offene Aufträge mit einem LOKALEN Modell ab (Ollama, stdlib only).

  python core/worker.py [--once] [--model NAME] [--root DIR]

Spricht nur mit 127.0.0.1 (Ollama). Das Ergebnis landet als neue Datei in
data/proposals/<id>-antwort.md - bestehende Dateien werden nie geändert.
"""
import argparse
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bootstrap import SRC, now  # noqa: E402
from extend import audit  # noqa: E402

HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
if not HOST.startswith(("http://127.0.0.1", "http://localhost")):
    raise SystemExit("OLLAMA_HOST muss lokal sein (127.0.0.1) - keine externen Calls ohne Consent.")


def ask(model, system, text):
    payload = {"model": model, "stream": False,
               "messages": [{"role": "system", "content": system}, {"role": "user", "content": text}]}
    req = urllib.request.Request(HOST + "/api/chat", json.dumps(payload).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=3600) as r:  # kleines Modell darf dauern
        return json.load(r)["message"]["content"]


def run_once(root, model):
    f = root / "data" / "requests.json"
    if not f.is_file():
        print("Keine Aufträge.")
        return 0
    system = (root / "prompts" / "system_prompt.md").read_text(encoding="utf-8")
    done = 0
    for r in json.loads(f.read_text(encoding="utf-8")):
        if r["status"] != "offen":
            continue
        out = root / "data" / "proposals" / (r["id"] + "-antwort.md")
        if out.exists():
            continue
        # frisch lesen: Status in_arbeit setzen
        cur = json.loads(f.read_text(encoding="utf-8"))
        for c in cur:
            if c["id"] == r["id"]:
                c["status"] = "in_arbeit"
        f.write_text(json.dumps(cur, indent=2, ensure_ascii=False), encoding="utf-8")
        print("Arbeite an:", r["text"][:60])
        try:
            answer = ask(model, system, r["text"])
        except Exception as e:  # Ollama aus / Modell fehlt
            print("Fehler:", e)
            audit(root, "worker-fehler %s %s" % (r["id"], e))
            return 1
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text("# Auftrag\n%s\n\n# Antwort (%s, %s)\n%s\n" % (r["text"], model, now(), answer), encoding="utf-8")
        audit(root, "worker-antwort %s %s" % (r["id"], out.name))
        print("Fertig ->", out)
        done += 1
    print("%d Auftrag/Aufträge bearbeitet." % done)
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="K.I.T.T. Worker")
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--model", default=os.environ.get("OLLAMA_MODEL", ""))
    ap.add_argument("--root", default=str(SRC))
    a = ap.parse_args(argv)
    if not a.model:
        raise SystemExit("Modell angeben: --model NAME oder OLLAMA_MODEL=NAME (siehe `ollama list`)")
    root = Path(a.root).resolve()
    while True:
        rc = run_once(root, a.model)
        if a.once or rc:
            return rc
        time.sleep(15)


if __name__ == "__main__":
    sys.exit(main())
