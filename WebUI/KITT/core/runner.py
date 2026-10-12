from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

from WebUI.KITT.core.router import Router, TaskStatus


@dataclass
class ExecutionResult:
    task_id: str
    status: str
    assigned_agent: str | None
    intent: str
    output: dict[str, Any]


class KITTOrchestrator:
    """Simple local K.I.T.T. orchestrator used to route tasks and update worker status."""

    def __init__(self):
        self.router = Router()
        self.tasks: dict[str, dict[str, Any]] = {}

    def create_task(self, intent: str, payload: dict[str, Any] | None = None) -> ExecutionResult:
        task = self.router.route(intent, payload or {})
        self.tasks[task.id] = {
            "id": task.id,
            "intent": task.intent,
            "status": task.status.value,
            "assigned_agent": task.assigned_agent,
            "payload": task.payload,
        }
        return ExecutionResult(
            task_id=task.id,
            status=task.status.value,
            assigned_agent=task.assigned_agent,
            intent=task.intent,
            output={"message": f"Task queued for {task.assigned_agent}", "payload": task.payload},
        )

    def get_task(self, task_id: str) -> dict[str, Any] | None:
        return self.tasks.get(task_id)

    def mark_status(self, task_id: str, new_status: str) -> dict[str, Any] | None:
        task = self.tasks.get(task_id)
        if not task:
            return None
        task["status"] = new_status
        return task

    def list_tasks(self) -> list[dict[str, Any]]:
        return list(self.tasks.values())


if __name__ == "__main__":
    kit = KITTOrchestrator()
    result = kit.create_task("voice", {"mode": "rvc", "preset": "kit_default"})
    print(result)
