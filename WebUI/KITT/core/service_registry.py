from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KITT_ROOT = ROOT / "WebUI" / "KITT"

@dataclass
class Service:
    id: str
    name: str
    type: str
    status: str = "planned"


def list_services() -> list[dict]:
    return [
        {"id": "ollama", "name": "Ollama local runtime", "type": "llm", "status": "planned"},
        {"id": "voice_manager", "name": "Voice Manager", "type": "voice", "status": "active"},
        {"id": "jobs_queue", "name": "Jobs Queue", "type": "queue", "status": "active"},
        {"id": "knowledge_archive", "name": "Knowledge Archive", "type": "memory", "status": "planned"},
    ]


def service_status(service_id: str) -> dict:
    for service in list_services():
        if service["id"] == service_id:
            return service
    return {"id": service_id, "name": service_id, "type": "unknown", "status": "unknown"}
