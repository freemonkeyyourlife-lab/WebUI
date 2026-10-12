# K.I.T.T. Local Runtime Notes

This folder is the runtime core for K.I.T.T. It can be started locally using the provided start_local.sh script.

How to run
- cd WebUI/KITT/installer
- bash start_local.sh

Then:
- Open the FastAPI docs: http://localhost:8000/docs
- Open the dashboard HTML file directly from WebUI/KITT/dashboard/index.html
- Use the K.I.T.T. API to route tasks, list agents, show services and manage voice presets.

System components
- WebUI/KITT/core: router, registry, task engine, presets
- WebUI/KITT/api: FastAPI endpoints for K.I.T.T.
- WebUI/KITT/voice: voice upload, model jobs and worker
- WebUI/KITT/dashboard: main dashboard shell
- WebUI/KITT/installer: bootstrap and builder scripts
