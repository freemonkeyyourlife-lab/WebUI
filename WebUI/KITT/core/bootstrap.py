#!/usr/bin/env python3
"""K.I.T.T. Bootstrap (stdlib only).

python core/bootstrap.py [--check|--install|--build|--status] [--root DIR]

Legt nur an, überschreibt/löscht nie. Weicht eine vorhandene Datei von der
Vorlage ab, entsteht daneben eine `.new`-Datei.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]  # WebUI/KITT (Quelle für DNA/Prompt/Templates)

BOOTSTRAP = {
    "project": "K.I.T.T.",
    "owner": "freemonkeyyourlife-lab",
    "repo": "WebUI",
    "default_mode": "local-first",
}

DIRS = ["data", "data/proposals", "app", "app/public", "registry", "dna", "prompts"]
# Vorlage -> Ziel (relativ zu root)
TEMPLATE_MAP = {
    "server.js": "app/server.js",
    "package.json": "app/package.json",
    "public/index.html": "app/public/index.html",
    ".env.example": ".env.example",
}


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_dna(root):
    for base in (root, SRC):
        f = base / "dna" / "kitt_dna.json"
        if f.is_file():
            return json.loads(f.read_text(encoding="utf-8"))
    raise SystemExit("DNA nicht gefunden: dna/kitt_dna.json")


def render(text, values):
    def sub(m):
        v = values.get(m.group(1).strip())
        if v is None:
            return m.group(0)
        if isinstance(v, list):
            if any(" " in str(i) for i in v):
                return "\n".join("- " + str(i) for i in v)
            return ", ".join(map(str, v))
        return str(v)
    return re.sub(r"\{\{\s*([\w]+)\s*\}\}", sub, text)


def dna_values(dna):
    vals = dict(dna)
    vals.update({k: v for k, v in dna.get("paths", {}).items()})
    return vals


def load_prompt(root, dna):
    rel = dna.get("paths", {}).get("prompt", "prompts/system_prompt.md")
    for base in (root, SRC):
        f = base / rel
        if f.is_file():
            return render(f.read_text(encoding="utf-8"), dna_values(dna))
    raise SystemExit("Systemprompt nicht gefunden: " + rel)


def create_file(target, content):
    """anlegen -> 'created'; identisch -> 'unchanged'; abweichend -> .new daneben."""
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return "created"
    if target.read_bytes() == content:
        return "unchanged"
    new = target.with_name(target.name + ".new")
    if new.exists():
        return "differs (.new vorhanden)"
    new.write_bytes(content)
    return "differs (.new angelegt)"


def check_env():
    res = {"python": {"ok": sys.version_info >= (3, 8), "version": sys.version.split()[0]}}
    for tool in ("node", "npm"):
        exe = shutil.which(tool)
        ver = None
        if exe:
            try:
                ver = subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=20).stdout.strip()
            except Exception:
                pass
        ok = bool(ver)
        if tool == "node" and ok:
            try:
                ok = int(ver.lstrip("v").split(".")[0]) >= 18
            except ValueError:
                ok = False
        res[tool] = {"ok": ok, "version": ver}
    return res


def state_path(root, dna):
    return root / dna.get("paths", {}).get("state", "data/install_state.json")


def read_state(root, dna):
    try:
        return json.loads(state_path(root, dna).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"steps": {}}


def record(state, step, status, detail=""):
    """Zeitstempel ändert sich nur, wenn sich Status/Detail ändern (Idempotenz)."""
    old = state["steps"].get(step)
    if not old or old["status"] != status or old.get("detail") != detail:
        state["steps"][step] = {"status": status, "detail": detail, "time": now()}


def write_state(root, dna, state):
    f = state_path(root, dna)
    f.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(state, indent=2, ensure_ascii=False) + "\n"
    if not f.exists() or f.read_text(encoding="utf-8") != text:
        f.write_text(text, encoding="utf-8")


def do_check(root, dna, state):
    env = check_env()
    ok = all(v["ok"] for v in env.values())
    record(state, "check", "ok" if ok else "fehler", json.dumps({k: v["version"] for k, v in env.items()}))
    return ok, env


def do_install(root, dna, state):
    for d in DIRS:
        (root / d).mkdir(parents=True, exist_ok=True)
    results = {}
    for rel in ("dna/kitt_dna.json", dna["paths"]["prompt"]):
        src, dst = SRC / rel, root / rel
        if src.is_file() and src.resolve() != dst.resolve():
            results[rel] = create_file(dst, src.read_bytes())
    for tpl, dst in TEMPLATE_MAP.items():
        src = SRC / "templates" / tpl
        if src.is_file():
            results[dst] = create_file(root / dst, src.read_bytes())
    # Netzwerk-Installationen nur, wenn echte Dependencies deklariert sind (Template: keine).
    pkg = root / "app" / "package.json"
    deps = {}
    try:
        deps = json.loads(pkg.read_text(encoding="utf-8")).get("dependencies", {})
    except (OSError, ValueError):
        pass
    if deps:
        print("TODO: Dependencies %s brauchen Netzwerk -> Freigabe, bitte manuell: cd app && npm install" % list(deps))
    record(state, "install", "ok")
    return results


def do_build(root, dna, state):
    server = root / "app" / "server.js"
    node = shutil.which("node")
    if not server.is_file() or not node:
        record(state, "build", "fehler", "app/server.js oder node fehlt")
        return False
    r = subprocess.run([node, "--check", str(server)], capture_output=True, text=True)
    ok = r.returncode == 0
    record(state, "build", "ok" if ok else "fehler", "" if ok else r.stderr.strip()[:300])
    return ok


def main(argv=None):
    ap = argparse.ArgumentParser(description="K.I.T.T. Bootstrap")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--root", default=str(SRC), help="Zielverzeichnis (Standard: WebUI/KITT)")
    a = ap.parse_args(argv)
    root = Path(a.root).resolve()
    dna = load_dna(root)
    prompt = load_prompt(root, dna)
    state = read_state(root, dna)
    print("%s v%s (%s) – Prompt geladen (%d Zeichen)" % (dna["name"], dna["version"], dna["mode"], len(prompt)))
    ok = True
    if a.status and not (a.check or a.install or a.build):
        print(json.dumps(state, indent=2, ensure_ascii=False))
        return 0
    if True:  # Umgebung immer prüfen
        good, env = do_check(root, dna, state)
        for k, v in env.items():
            print("  %-7s %s %s" % (k, "ok " if v["ok"] else "FEHLT", v["version"] or ""))
        ok = ok and good
        if a.check and not (a.install or a.build):
            # --check ist rein lesend: keinen State schreiben
            return 0 if ok else 1
    if a.install:
        if not ok:
            print("Umgebung unvollständig (Node 18+/Python 3.8+/npm) – Abbruch.")
        else:
            for k, v in do_install(root, dna, state).items():
                print("  %-28s %s" % (k, v))
    if a.build and ok:
        b = do_build(root, dna, state)
        print("  build: %s" % ("ok" if b else "FEHLER"))
        ok = ok and b
    write_state(root, dna, state)
    if a.status:
        print(json.dumps(state, indent=2, ensure_ascii=False))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
