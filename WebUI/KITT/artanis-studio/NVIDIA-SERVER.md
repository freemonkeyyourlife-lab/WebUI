# ARTANIS – NVIDIA-Server statt Chromebook-GPU

Die ARTANIS-Weboberfläche läuft auf dem Chromebook; die Bildberechnung auf einem separaten NVIDIA-Linux-Server. **Kein öffentlicher ComfyUI-Port.**

## 1. Auf dem NVIDIA-Server
```bash
bash setup_nvidia_server.sh
```
Voraussetzungen: NVIDIA-Treiber mit `nvidia-smi`, Python 3, Git, Internetzugang, ausreichend freier SSD-Speicher. Der Installer prüft, ob PyTorch die CUDA-GPU sieht. Er startet ComfyUI nur auf `127.0.0.1:8188`. Ein kompatibler Stable-Diffusion-Checkpoint muss aus einer erlaubten Quelle unter `ComfyUI/models/checkpoints/` liegen. Ohne Checkpoint ist noch keine Bildgenerierung möglich.

## 2. Auf dem Chromebook: privater SSH-Tunnel
```bash
ssh -N -L 8188:127.0.0.1:8188 BENUTZER@SERVER_IP
```
Das Terminal mit dem Tunnel geöffnet lassen. Bei Portkonflikt einen freien lokalen Port nutzen und `COMFYUI_URL` entsprechend setzen.

## 3. ARTANIS auf dem Chromebook neu starten
```bash
cd ~/ARTANIS-NEU/WebUI
git pull --ff-only
cd WebUI/KITT/artanis-studio
ARTANIS_PORT=8770 COMFYUI_URL=http://127.0.0.1:8188 python3 server.py
```
Wenn 8770 bereits läuft, zuerst **nur den bestehenden ARTANIS-Prozess** kontrolliert beenden, nicht blind Prozesse löschen. Im Browser `http://localhost:8770` öffnen, Checkpoint auswählen, Prompt eingeben, Bild erzeugen.

**Status:** Das sind Installationsdateien, keine Bestätigung, dass der fremde NVIDIA-Server bereits eingerichtet wurde.
