const fs = require('fs');
const path = require('path');
const { logAudit } = require('./audit_helper');
const { capabilityRouter } = require('./capability_router');

const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readRequests() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeRequests(requests) {
  ensureStore();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(requests, null, 2), 'utf8');
}

function getRequest(id) {
  const list = readRequests();
  return list.find((r) => r.id === id) || null;
}

function buildSafetyPlan(task) {
  return {
    taskId: task.id,
    category: task.category || 'agent_execution',
    module: task.agentId ? `Agent: ${task.agentId}` : 'K.I.T.T. Local Orchestrator',
    risk: task.requiresApproval ? 'high' : 'low',
    requestedCapability: task.capability || task.requestedCapability || 'general action',
    acceptanceCriteria: [
      'Executed strictly on local loopback interface',
      'No data shared externally without explicit user consent',
      'Approval required for sensitive capabilities'
    ],
    actions: [
      'Validate local agent parameters',
      'Check capability permission boundary',
      'Execute handler upon human approval',
      'Log audit record to local disk'
    ],
    nextStep: task.requiresApproval
      ? 'Awaiting explicit POST /api/requests/:id/approve'
      : 'Ready for execution'
  };
}

function createRequest(data = {}) {
  const requests = readRequests();
  const id = data.id || `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const item = {
    id,
    title: (data.title || data.command || 'Agent Request').slice(0, 120),
    sourceType: data.sourceType || 'agent',
    agentId: data.agentId || null,
    command: data.command || null,
    capability: data.capability || data.requestedCapability || null,
    params: data.params || {},
    text: data.text || '',
    status: data.status || 'pending_approval',
    requiresApproval: data.requiresApproval !== false,
    createdAt: new Date().toISOString(),
    plan: buildSafetyPlan({ ...data, id }),
    result: null
  };

  requests.unshift(item);
  writeRequests(requests);

  logAudit({
    action: 'request_created',
    userId: data.userId || 'chief',
    status: 'pending',
    details: { id: item.id, agentId: item.agentId, capability: item.capability }
  });

  return item;
}

async function approveRequest(id, approver = 'chief') {
  const requests = readRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const req = requests[index];
  req.approved = true;
  req.approvedAt = new Date().toISOString();
  req.approver = approver;
  req.status = 'approved';

  // If this request is tied to an agent capability, execute it now!
  if (req.agentId && req.capability) {
    try {
      const execResult = await capabilityRouter.execute(req.agentId, req.capability, req.params);
      req.status = 'completed';
      req.result = execResult;
      req.executedAt = new Date().toISOString();

      // Also update agent history if possible
      const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
      if (fs.existsSync(AGENTS_FILE)) {
        try {
          const agents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
          const ag = agents.find((a) => a.id === req.agentId);
          if (ag) {
            ag.history = ag.history || [];
            const histItem = ag.history.find((h) => h.requestId === id);
            if (histItem) {
              histItem.status = 'executed';
              histItem.result = execResult;
              histItem.executedAt = req.executedAt;
            } else {
              ag.history.unshift({
                id: `cmd-${Date.now()}`,
                command: req.command,
                capability: req.capability,
                params: req.params,
                status: 'executed',
                result: execResult,
                requestId: id,
                timestamp: req.executedAt
              });
            }
            fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf8');
          }
        } catch (e) {
          console.error('Error updating agent history:', e.message);
        }
      }
    } catch (err) {
      req.status = 'failed';
      req.error = err.message;
    }
  }

  requests[index] = req;
  writeRequests(requests);

  logAudit({
    action: 'request_approved',
    userId: approver,
    status: req.status,
    details: { id, agentId: req.agentId, capability: req.capability, resultSummary: req.result?.summary }
  });

  return req;
}

function resolveRequest(id) {
  const requests = readRequests();
  const req = requests.find((r) => r.id === id);
  if (!req) return null;

  req.status = 'ready';
  const extensionResult = {
    id: req.id,
    resolved: true,
    summary: `Task resolved and ready for safe execution.`,
    safeActions: req.plan?.actions || [],
    risk: req.plan?.risk || 'low',
    generatedAt: new Date().toISOString()
  };

  writeRequests(requests);
  logAudit({
    action: 'request_resolved',
    userId: 'chief',
    details: { id }
  });

  return { task: req, extensionResult };
}

module.exports = {
  readRequests,
  writeRequests,
  getRequest,
  createRequest,
  approveRequest,
  resolveRequest,
  readTasks: readRequests,
  getTask: getRequest,
  createTask: createRequest,
  approveTask: approveRequest,
  TASKS_FILE
};
