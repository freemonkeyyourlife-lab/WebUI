# ARTANIS – normale Modell-Einbindung (Ollama + ComfyUI)

Stand: 2026-10-24. Die bisherige ARTANIS-Implementierung unterstützt Ollama und ComfyUI bereits. Diese Anleitung verändert vorhandene Dateien nicht.

## 1. Vorhandene Modelle prüfen
```bash
curl -fsS http://127.0.0.1:11434/api/tags
```
Bekannt aus dem zuletzt gemeldeten Status: qwen2.5-coder:3b, deepseek-coder:6.7b, qwen3:0.6b, qwen2.5:3b, huihui_ai/qwen2.5-abliterate:7b.

## 2. Modell auswählen und ARTANIS starten
```bash
cd ~/ARTANIS-NEU/WebUI/WebUI/KITT/artanis-studio
export OLLAMA_URL=http://127.0.0.1:11434
export ARTANIS_MODEL=qwen2.5:3b
export COMFYUI_URL=http://127.0.0.1:8188
ARTANIS_PORT=8771 python3 server.py
```
Öffnen: http://localhost:8771/studio.html
Status: http://localhost:8771/api/status
Das Modell kann in der vorhandenen Chat-API auch pro Anfrage als `model` angegeben werden.

## 3. ComfyUI verbinden
Aktueller Fehler: `comfyui_error: Connection refused`. Es läuft kein erreichbarer ComfyUI-Dienst auf der konfigurierten Adresse. Prüfen:
```bash
curl -fsS http://127.0.0.1:8188/system_stats
```
Falls ComfyUI auf einem anderen Rechner läuft, zunächst private SSH-Portweiterleitung zum Rechner mit ComfyUI einrichten. Keinen ungeschützten ComfyUI-Port öffentlich freigeben.

## 4. Bildmodell
Nach ComfyUI-Start muss mindestens ein kompatibler Checkpoint unter `ComfyUI/models/checkpoints/` vorhanden sein. ARTANIS fragt die Checkpoints über `/object_info/CheckpointLoaderSimple` ab und kann erst dann `/api/text-to-image` erfolgreich verwenden. Ohne Checkpoint ist keine Bildgenerierung möglich.

## 5. Video
ARTANIS kann vorhandene ComfyUI-Workflow-JSONs an ComfyUI übermitteln. Ein Videomodell und passender Video-Workflow sind gesondert nötig. Nicht als fertig installiert ansehen.

## 6. Sicherheit
Bestehende Projekte nicht überschreiben. Erst prüfen, dann Modelle installieren. Lokale Ports nur an Loopback binden oder per SSH tunneln. Kein Bot-Token oder Modelllizenzschlüssel in GitHub ablegen.

## 7. Aktueller tatsächlicher Stand
Ollama erreichbar; fünf Sprachmodelle erkannt; ComfyUI nicht erreichbar; Bild- und Videogenerierung nicht erfolgreich getestet.
