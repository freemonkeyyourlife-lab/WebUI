# ARTANIS: Modelle und echte Fähigkeiten

Die folgenden Modelle sind **Empfehlungen**, nicht bereits installiert. Der GPU-Server muss vor Installation auf VRAM, CUDA und freien Speicher geprüft werden.

| Aufgabe | Modell / Backend | Hinweis |
| --- | --- | --- |
| Text → Bild | Stable Diffusion XL (SDXL) / ComfyUI | Standard-SDXL-Checkpoint; bestehender CheckpointLoaderSimple-Workflow unterstützt SDXL |
| Bild → Bild | SDXL img2img / ComfyUI | Separater API-Workflow mit VAEEncode und geladenem Bild nötig |
| Bild → Text | Qwen2.5-VL oder vergleichbares Vision-Modell | Braucht Vision-API und Upload-Verarbeitung |
| Audio → Text | faster-whisper (Whisper large-v3 oder small) | small für wenig VRAM; large-v3 für höhere Genauigkeit |
| Text → Audio | Piper TTS (leicht) oder XTTS v2 | Stimmen-/Lizenzbedingungen beachten |
| Video → Text | ffmpeg Einzelbilder + Vision; Audio + Whisper | Kombination beider Kanäle |
| Text → Video | Wan 2.2 oder kompatibles ComfyUI-Modell | Sehr hoher VRAM-Bedarf; ggf. kleineres quantisiertes Modell |
| GIF ↔ Video, Video → Frames, Audio extrahieren | ffmpeg | Ohne KI direkt nutzbar; siehe media_tools.py |
| Video → GIF | ffmpeg Palette-Workflow | Ohne KI direkt nutzbar |

## Test vor Modellinstallation
```bash
nvidia-smi
df -h
free -h
```

**Nicht blind alle Modelle installieren:** Ein vollständiges Paket kann viele zehn GB SSD und viel GPU-VRAM benötigen. Modelle einzeln passend zur Hardware hinzufügen und durch echten Inferenztest prüfen. Die bisherigen ARTANIS-Seiten unterstützen ComfyUI Text-zu-Bild und freie API-Workflows, aber die übrigen KI-Aufgaben sind noch nicht vollständig angeschlossen.

## Medienumwandlungen
```bash
sudo apt-get install ffmpeg
python3 media_tools.py video-to-gif clip.mp4 --fps 10 --width 640
python3 media_tools.py gif-to-mp4 animation.gif
python3 media_tools.py video-to-frames clip.mp4 --fps 1 --output frames
python3 media_tools.py extract-audio clip.mp4
python3 media_tools.py audio-to-wav sprache.mp3
```
