#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PY_BIN="${PY_BIN:-python3}"

mkdir -p "$ROOT_DIR/WebUI/KITT/dist" "$ROOT_DIR/WebUI/KITT/tmp"

if ! command -v "$PY_BIN" >/dev/null 2>&1; then
  echo "Python 3 is required."
  exit 1
fi

python3 - <<'PY'
from pathlib import Path
import zipfile

root = Path('/').resolve()
# Use repository root computed from script location
import os
script_dir = Path(os.path.dirname(os.path.abspath(__file__)))
repo_root = script_dir.parent.parent.parent
kit_root = repo_root / 'WebUI' / 'KITT'
out = kit_root / 'dist' / 'KITT-LocalBundle.zip'
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for item in [
        kit_root / 'README.md',
        kit_root / 'docs',
        kit_root / 'prompts',
        kit_root / 'voice',
        kit_root / 'dashboard',
        kit_root / 'registry',
        kit_root / 'installer',
        kit_root / 'core',
        kit_root / 'api',
        kit_root / 'runtime',
    ]:
        if item.is_dir():
            for file in item.rglob('*'):
                if file.is_file():
                    rel = file.relative_to(repo_root)
                    zf.write(file, arcname=str(rel))
        elif item.exists():
            rel = item.relative_to(repo_root)
            zf.write(item, arcname=str(rel))
print(f'Bundle created: {out}')
PY

echo "Bundle built successfully."
