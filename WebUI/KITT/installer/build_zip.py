#!/usr/bin/env python3
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KITT_ROOT = ROOT / "WebUI" / "KITT"
OUTPUT = KITT_ROOT / "dist" / "KITT-LocalBundle.zip"


def pack_bundle(output_path: str | None = None):
    target = Path(output_path) if output_path else OUTPUT
    target.parent.mkdir(parents=True, exist_ok=True)
    included = [
        KITT_ROOT / "README.md",
        KITT_ROOT / "docs",
        KITT_ROOT / "prompts",
        KITT_ROOT / "voice",
        KITT_ROOT / "dashboard",
        KITT_ROOT / "registry",
        KITT_ROOT / "installer",
    ]

    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for item in included:
            if item.is_dir():
                for file in item.rglob('*'):
                    if file.is_file():
                        rel = file.relative_to(ROOT)
                        zf.write(file, arcname=str(rel))
            elif item.exists():
                rel = item.relative_to(ROOT)
                zf.write(item, arcname=str(rel))

    return str(target)


if __name__ == "__main__":
    created = pack_bundle()
    print(f"Bundle created: {created}")
