# K.I.T.T. Core

K.I.T.T. is the secure coordinating layer for the Free Monkeys platform.

Current modules
- Instruct & Repair Service: request intake, task queue, approval gates
- Skill Registry: module classification and routing
- Voice Manager: upload, validation, model job planning, synthesis preview

Principles
- Safe by default
- Approval required before runtime mutation
- Local-first and extensible
- Human-in-the-loop for sensitive or high-risk actions

Architecture overview
- Request input enters the Instruct & Repair service
- The Skill Registry suggests the best module
- The task is converted into a structured plan and stored in the task queue
- The Voice Manager handles sample upload, quality checks, and model jobs
- The Repair planner prepares bugfix / extension blueprints with validation and rollback steps

This is the foundation for K.I.T.T. to grow modularly without losing control.
