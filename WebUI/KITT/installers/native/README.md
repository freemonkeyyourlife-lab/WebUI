# Native installers (simple scripts)

These scripts provide a zero-docker fallback to run the K.I.T.T. services locally using Node and Python. They are intended for users who prefer not to use Docker.

Linux
- install-linux.sh: creates virtualenv, installs requirements, and sets up a systemd unit (optional).

Windows
- install-windows.ps1: sets up a Python venv, installs Node dependencies, and creates a basic scheduled task or shortcut to start services.

macOS
- install-macos.sh: similar to linux with plist template for launchd.

Note: these are simple starter scripts — for production hardened deployment, further adjustments and permissions will be necessary.
