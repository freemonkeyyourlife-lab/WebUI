from dataclasses import dataclass, asdict
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = ROOT / "WebUI" / "KITT" / "registry" / "agents.json"

@dataclass
class Agent:
    id: str
    name: str
    category: str
    status: str = "offline"
    owner: str | None = None
    description: str | None = None


def load_registry() -> list[Agent]:
    if not REGISTRY_PATH.exists():
        return []
    content = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    agents = []
    for item in content.get("agents", []):
        agents.append(
            Agent(
                id=item.get("id", ""),
                name=item.get("name", item.get("id", "")),
                category=item.get("category", "general"),
                status=item.get("status", "offline"),
                owner=item.get("owner"),
                description=item.get("description"),
            )
        )
    return agents


def get_agent(agent_id: str) -> Agent | None:
    for agent in load_registry():
        if agent.id == agent_id:
            return agent
    return None


def list_agents() -> list[dict]:
    return [asdict(agent) for agent in load_registry()]
