from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Basic bootstrap file for K.I.T.T.
BOOTSTRAP = {
    "project": "K.I.T.T.",
    "owner": "freemonkeyyourlife-lab",
    "repo": "WebUI",
    "purpose": "Central orchestrator for voice, media, agents, and local platform services.",
    "default_mode": "local-first",
    "modules": [
        "voice",
        "dashboard",
        "docs",
        "registry",
        "installer",
        "core",
    ],
}

if __name__ == "__main__":
    print(BOOTSTRAP)
