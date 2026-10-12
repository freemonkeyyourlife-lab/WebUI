from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from WebUI.KITT.core.agent_registry import list_agents
from WebUI.KITT.core.runner import KITTOrchestrator
from WebUI.KITT.core.service_registry import list_services
from WebUI.KITT.core.voice_presets import list_presets

app = FastAPI(title="K.I.T.T. Core API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = KITTOrchestrator()


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "online", "system": "K.I.T.T."}


@app.get("/agents")
def agents() -> list[dict[str, Any]]:
    return list_agents()


@app.get("/services")
def services() -> list[dict[str, Any]]:
    return list_services()


@app.get("/presets")
def presets() -> dict[str, Any]:
    return list_presets()


@app.post("/route")
def route_task(intent: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    result = orchestrator.create_task(intent, payload or {})
    return {
        "task_id": result.task_id,
        "status": result.status,
        "assigned_agent": result.assigned_agent,
        "intent": result.intent,
        "output": result.output,
    }


@app.get("/tasks")
def tasks() -> list[dict[str, Any]]:
    return orchestrator.list_tasks()


@app.get("/tasks/{task_id}")
def task(task_id: str) -> dict[str, Any] | None:
    return orchestrator.get_task(task_id)
