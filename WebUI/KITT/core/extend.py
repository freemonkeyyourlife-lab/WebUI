#!/usr/bin/env python3
"""K.I.T.T. kontrollierte Selbst-Erweiterung (stdlib only).

  python core/extend.py --new-module NAME
  python core/extend.py --propose ZIELDATEI --from NEUE_DATEI
  python core/extend.py --apply ID [--yes]

Bestehende Dateien werden nur nach expliziter Bestätigung geändert; das
Original bleibt als Sicherung `<datei>.bak-<ID>` erhalten. Nichts wird gelöscht.
"""
import argparse
import difflib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bootstrap import SRC, render, now  # noqa: E402


def audit(root, msg):
    f = root / "data" / "audit.log"
    f.parent.mkdir(parents=True, exist_ok=True)
    with open(f, "a", encoding="utf-8") as fh:  # append-only
        fh.write("%s %s\n" % (now(), msg))


def inside(root, rel):
    p = (root / rel).resolve()
    if root != p and root not in p.parents:
        raise SystemExit("Pfad außerhalb von root: %s" % rel)
    return p


def new_module(root, name):
    if not re.fullmatch(r"[a-z][a-z0-9_-]{1,40}", name):
        raise SystemExit("Ungültiger Modulname (a-z, 0-9, _ -, 2-41 Zeichen)")
    mdir = root / "modules" / name
    reg = root / "registry" / "modules" / (name + ".json")
    if mdir.exists() or reg.exists():
        raise SystemExit("Modul existiert bereits – nichts geändert.")
    vals = {"module": name, "created": now()}
    for tpl, dst in (("module.json", mdir / "module.json"), ("module_index.js", mdir / "index.js")):
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(render((SRC / "templates" / tpl).read_text(encoding="utf-8"), vals), encoding="utf-8")
    reg.parent.mkdir(parents=True, exist_ok=True)
    reg.write_text(json.dumps({"name": name, "path": "modules/%s" % name, "created": vals["created"]}, indent=2) + "\n", encoding="utf-8")
    audit(root, "new-module %s" % name)
    print("Modul angelegt: modules/%s, registriert: registry/modules/%s.json" % (name, name))


def propose(root, target, source):
    t = inside(root, target)
    new = Path(source).read_text(encoding="utf-8")
    old = t.read_text(encoding="utf-8") if t.exists() else ""
    pid = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    pdir = root / "data" / "proposals"
    pdir.mkdir(parents=True, exist_ok=True)
    diff = "".join(difflib.unified_diff(old.splitlines(True), new.splitlines(True), "a/" + target, "b/" + target))
    (pdir / (pid + ".patch")).write_text(diff, encoding="utf-8")
    (pdir / (pid + ".json")).write_text(json.dumps({"id": pid, "target": target, "content": new, "applied": False}, indent=2, ensure_ascii=False), encoding="utf-8")
    audit(root, "propose %s %s" % (pid, target))
    print("Vorschlag %s: data/proposals/%s.patch  – anwenden: --apply %s" % (pid, pid, pid))


def apply(root, pid, yes):
    if not re.fullmatch(r"\d{14}", pid):
        raise SystemExit("Ungültige ID")
    f = root / "data" / "proposals" / (pid + ".json")
    if not f.is_file():
        raise SystemExit("Vorschlag nicht gefunden")
    prop = json.loads(f.read_text(encoding="utf-8"))
    if prop.get("applied"):
        raise SystemExit("Bereits angewendet.")
    t = inside(root, prop["target"])
    print((root / "data" / "proposals" / (pid + ".patch")).read_text(encoding="utf-8"))
    if not yes and input("Änderung an %s anwenden? [ja/N] " % prop["target"]).strip().lower() not in ("ja", "j", "y", "yes"):
        audit(root, "apply-declined %s" % pid)
        print("Abgebrochen.")
        return 1
    if t.exists():
        bak = t.with_name("%s.bak-%s" % (t.name, pid))
        bak.write_bytes(t.read_bytes())
    t.parent.mkdir(parents=True, exist_ok=True)
    t.write_text(prop["content"], encoding="utf-8")
    prop["applied"] = True
    f.write_text(json.dumps(prop, indent=2, ensure_ascii=False), encoding="utf-8")
    audit(root, "apply %s %s" % (pid, prop["target"]))
    print("Angewendet.")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="K.I.T.T. Erweiterung")
    ap.add_argument("--new-module", metavar="NAME")
    ap.add_argument("--propose", metavar="ZIELDATEI")
    ap.add_argument("--from", dest="source", metavar="NEUE_DATEI")
    ap.add_argument("--apply", metavar="ID")
    ap.add_argument("--yes", action="store_true", help="Bestätigung ohne Rückfrage")
    ap.add_argument("--root", default=str(SRC))
    a = ap.parse_args(argv)
    root = Path(a.root).resolve()
    if a.new_module:
        new_module(root, a.new_module)
    elif a.propose and a.source:
        propose(root, a.propose, a.source)
    elif a.apply:
        return apply(root, a.apply, a.yes)
    else:
        ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
