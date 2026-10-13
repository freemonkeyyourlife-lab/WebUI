# Artanis — Autonomous Planner & Digital Buddy Engine

## 1. Overview & Heritage
In the local K.I.T.T. repository notes (`GitHiub.txt` and `WebUI/KITT/docs/Master-Overview.md`), Artanis is described as:
> *"Menschenkloner Frankenstein ARTANIS lieferant klont baut und erstellt und extrahiert alles as geil sit persönlichkeiten, daraus modell des buddys machen, modell trainer mit kitt"*

Based on this heritage and the technical requirements, **Artanis** fulfills two critical core roles within the local-first multi-agent architecture:
1. **Multi-Agent Planner & Task Coordinator**: Analyzes complex user objectives and autonomously decomposes them into structured, ordered multi-agent subtasks assigned across specialized agents (`listener`, `observer`, `kitt`, `talker`). All sensitive steps (e.g. system commands, model training, external broadcasts) are routed into K.I.T.T.'s human approval gate before execution.
2. **Digital Buddy Persona Modeler & Synthesizer**: Formulates structured digital persona profiles, extracting personality traits, voice presets, and behavioural attributes from local interactions and memory, preparing local training recipes for offline buddy companion models in collaboration with K.I.T.T.

---

## 2. Agent Registry Definition
Artanis is formally registered in `WebUI/KITT/instruct-repair/data/agents.json`:
- **ID**: `artanis`
- **Label**: `Artanis`
- **Role**: `planner` / `buddy-modeler`
- **Status Lifecycle**: `stopped` / `running` via standard `/api/agents/artanis/start` and `/api/agents/artanis/stop`
- **Capabilities**:
  - `plan_decomposition`: Deconstructs high-level instructions into executable agent steps.
  - `persona_extractor`: Synthesizes digital buddy personas from text, memory, and dialogue.
  - `buddy_synthesizer`: Combines persona attributes with local voice presets and prompt contexts.
  - `model_trainer`: Prepares local model training and fine-tuning jobs (strictly approval-gated).

---

## 3. Architecture & Data Flow

```
User Instruction
       │
       ▼
[Artanis Module] (/api/artanis/plan)
       │
       ├──> Multi-Step Plan Decomposition
       │      ├─ Step 1 (listener): parse_instructions
       │      ├─ Step 2 (observer): inspect_environment / scan
       │      ├─ Step 3 (kitt): orchestrate / execute (approval-gated if sensitive)
       │      ├─ Step 4 (artanis): persona_extractor
       │      └─ Step 5 (talker): speak_local
       │
       ▼
[/api/artanis/plans/:id/submit]
       │
       ▼
[K.I.T.T. Approval Gate] (`data/tasks.json`)
       │
       ├── Safe tasks ──────────> Executed automatically via capability router
       └── Sensitive tasks ─────> Pending human approval (`POST /api/requests/:id/approve`)
```

---

## 4. API Endpoints

### `GET /api/artanis/status`
Returns agent status, registered persona count, plan count, and capabilities.

### `POST /api/artanis/plan` (or `POST /api/artanis/decompose`)
Decomposes a user goal into structured tasks.
- **Request**: `{ "goal": "Analyze network and speak diagnostic summary", "context": {} }`
- **Response**: `{ "ok": true, "plan": { "planId": "...", "steps": [...], "requiresApproval": false } }`

### `POST /api/artanis/plans/:id/submit`
Submits all steps of a plan into the K.I.T.T. task and approval runner.
- **Response**: `{ "ok": true, "result": { "planId": "...", "tasksGenerated": 4, "tasks": [...] } }`

### `GET /api/artanis/personas` & `POST /api/artanis/personas`
Retrieves or creates structured digital buddy personas with traits, style, role, and local voice presets.

---

## 5. UI Integration
- Accessible at `http://localhost:3005/artanis.html`.
- Allows real-time interactive goal decomposition, one-click plan submission to the approval gate, persona synthesis, and plan history inspection.
