#!/usr/bin/env python3
"""BILL V0.2: read-only project inventory and Python/JSON validation."""
import argparse
import ast
import json
from pathlib import Path

SKIP = {".git", ".venv", "venv", "node_modules", "__pycache__", ".next", "dist", "build"}
EXTENSIONS = {".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".md", ".sh", ".html", ".css"}

def files(root):
    for p in sorted(root.rglob("*")):
        if p.is_file() and not any(part in SKIP or part.startswith(".") for part in p.relative_to(root).parts):
            yield p

def main():
    parser = argparse.ArgumentParser(description="BILL – K.I.T.T. Programmierwerkstatt")
    parser.add_argument("command", choices=["status", "scan", "check"])
    parser.add_argument("path", nargs="?", default=".")
    args = parser.parse_args()
    if args.command == "status":
        print(json.dumps({"name":"BILL","version":"0.2","inventory":True,"python_syntax_check":True,"json_syntax_check":True,"ai_coding":False,"auto_repair":False,"server_deploy":False}, indent=2))
        return 0
    root = Path(args.path).expanduser().resolve()
    if not root.is_dir():
        parser.error(f"Kein Verzeichnis: {root}")
    found = [p for p in files(root) if p.suffix.lower() in EXTENSIONS]
    if args.command == "scan":
        print(json.dumps({"root":str(root),"count":len(found),"files":[str(p.relative_to(root)) for p in found]}, ensure_ascii=False, indent=2))
        return 0
    failures = []
    checked = {"python":0,"json":0}
    for p in found:
        if p.suffix not in (".py", ".json"):
            continue
        kind = "python" if p.suffix == ".py" else "json"
        checked[kind] += 1
        try:
            source = p.read_text(encoding="utf-8")
            if kind == "python":
                ast.parse(source, filename=str(p))
            else:
                json.loads(source)
        except (SyntaxError, ValueError, UnicodeError, OSError) as exc:
            failures.append({"file":str(p.relative_to(root)),"error":str(exc)})
    print(json.dumps({"checked":checked,"failures":failures,"ok":not failures}, ensure_ascii=False, indent=2))
    return 1 if failures else 0

if __name__ == "__main__":
    raise SystemExit(main())
