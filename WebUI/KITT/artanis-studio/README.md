# ARTANIS × TANIA – KI-Studio

Start (Linux, Python 3, keine zusätzlichen Python-Pakete):

```bash
cd WebUI/KITT/artanis-studio
python3 server.py
```

Im Browser **http://127.0.0.1:8767/studio.html** öffnen.

**Vorhanden im Code:**
- Chat über lokales Ollama (Standard: http://127.0.0.1:11434).
- ComfyUI API-Workflow als JSON laden, über /prompt ausführen, Status über /history abfragen, Bild- und Videodateien herunterladen.
- Bildeditor über / mit Filtern, Text, PNG und einfachem WebM-Videoexport.
- Nur an 127.0.0.1 gebunden; keine öffentliche Freigabe.

**Voraussetzungen:** Ollama mit lokalem Modell und ComfyUI mit passenden installierten Bild-/Videomodellen und Nodes. ComfyUI-Workflow in **API format** exportieren. Ohne passende Modelle keine generative Bild- oder Videoproduktion.

**Noch offen:** Zielsystem-Integrationstest, Modellinstallation, fertige FREE MONKEYS Produktions-Workflows, automatischer Schnitt, Figurenkonsistenz, Audio/MJ, direkte Chat-zu-Medien-Steuerung.

Konfiguration optional: ARTANIS_PORT, OLLAMA_URL, COMFYUI_URL, ARTANIS_MODEL.

Die Dateien liegen im separaten Branch dev/artanis-bild-video-v01 und verändern die bestehende Installation nicht.
