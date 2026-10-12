# Installers / Local Deployment

This folder contains cross-platform installer scaffolding and instructions to run K.I.T.T. locally without requiring a GitHub connection.

Strategy (recommended):
1. Docker Compose (primary, works on Linux, macOS, Windows with Docker Desktop) — easy, consistent, keeps services isolated.
2. Electron Desktop Wrapper (optional) — packages WebUI into a native app for Windows/macOS/Linux that connects to local backend.
3. Native scripts (optional) — plain shell/PowerShell installers for users who prefer not to use Docker.
4. Android: Capacitor / WebView wrapper (optional) — runs the WebUI as a local WebView and connects to the local machine via Wi‑Fi or local server.

Notes:
- All installers are local-first. None requires a connection to GitHub to run the platform. External model downloads or optional remote GPU jobs are opt-in and disabled by default.
- For heavy model training/inference you will likely need a GPU-equipped machine and configure the inference service to use CUDA.

Files in this folder:
- docker/ : docker-compose start/stop scripts and instructions
- electron/ : starter Electron project to package the WebUI into a desktop app
- native/ : native install scripts (linux, windows, macos)
- android/ : notes and Capacitor wrapper template

Read the platform-specific README for details and usage examples.
