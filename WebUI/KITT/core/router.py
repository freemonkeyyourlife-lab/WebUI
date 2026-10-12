from dataclasses import dataclass, asdict
from enum import Enum
from typing import Any


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETE = "complete"
    FAILED = "failed"
    REVIEW = "require_review"


@dataclass
class Task:
    id: str
    intent: str
    payload: dict[str, Any] | None = None
    status: TaskStatus = TaskStatus.QUEUED
    assigned_agent: str | None = None


class Router:
    """Simple K.I.T.T. router that maps intents to agent IDs."""

    def __init__(self):
        self.intent_map = {
            "voice": "voice_manager",
            "research": "illuminati",
            "news": "illuminati",
            "creative": "spielberg_dali",
            "media": "daniel",
            "social": "marketing",
            "music": "mj",
            "legal": "mattlock",
            "training": "bill_jobs",
            "installer": "daniel",
            "default": "kit",
        }

    def dispatch(self, task: Task) -> Task:
        category = task.intent.lower()
        if category in self.intent_map:
            task.assigned_agent = self.intent_map[category]
        else:
            task.assigned_agent = self.intent_map["default"]
        task.status = TaskStatus.QUEUED
        return task

    def route(self, intent: str, payload: dict[str, Any] | None = None) -> Task:
        task = Task(id=f"task-{abs(hash(intent + str(payload)) % 1000000)}", intent=intent, payload=payload or {})
        return self.dispatch(task)

    @staticmethod
    def describe(task: Task) -> dict:
        return {
            "id": task.id,
            "intent": task.intent,
            "status": task.status.value,
            "assigned_agent": task.assigned_agent,
            "payload": task.payload,
        }
