const express = require('express');
const fs = require('fs');
const path = require('path');
const { capabilityRouter } = require('../capability_router');
const { createRequest } = require('../requests_store');
const { logAudit } = require('../audit_helper');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(AGENTS_FILE)) {
    const seed = [
      {
        id: 'kitt',
        label: 'K.I.T.T.',
        role: 'controller',
        status: 'running',
        lastSeen: new Date().toISOString(),
        pid: null,
        capabilities: [
          { name: 'orchestrate_agents', label: 'Orchestrate Agents', description: 'Coordinates tasks and routing across all local agents', requiresApproval: false },
          { name: 'system_status', label: 'System Status', description: 'Inspects CPU, memory, uptime, and local service health', requiresApproval: false },
          { name: 'execute_system_command', label: 'Execute System Command', description: 'Executes sensitive system diagnostic and maintenance commands', requiresApproval: true },
          { name: 'config_override', label: 'Configuration Override', description: 'Modifies core system parameters and security limits', requiresApproval: true }
        ],
        history: []
      },
      {
        id: 'observer',
        label: 'Observer',
        role: 'observer',
        status: 'stopped',
        lastSeen: null,
        pid: null,
        capabilities: [
          { name: 'monitor_filesystem', label: 'Monitor Filesystem', description: 'Monitors file changes in the local storage and MI directory', requiresApproval: false },
          { name: 'inspect_environment', label: 'Inspect Environment', description: 'Reports local node environment and hardware architecture', requiresApproval: false },
          { name: 'network_scan', label: 'Network Scan', description: 'Inspects loopback network bindings and port listeners', requiresApproval: true }
        ],
        history: []
      },
      {
        id: 'listener',
        label: 'Listener',
        role: 'listener',
        status: 'stopped',
        lastSeen: null,
        pid: null,
        capabilities: [
          { name: 'parse_instructions', label: 'Parse Instructions', description: 'Parses incoming user instructions and extracts intent', requiresApproval: false },
          { name: 'transcribe_audio', label: 'Transcribe Audio', description: 'Ingests local audio samples and produces text transcripts', requiresApproval: false },
          { name: 'ingest_external_stream', label: 'Ingest External Stream', description: 'Captures and processes live loopback or authorized audio input streams', requiresApproval: true }
        ],
        history: []
      },
      {
        id: 'talker',
        label: 'Talker',
        role: 'talker',
        status: 'stopped',
        lastSeen: null,
        pid: null,
        capabilities: [
          { name: 'speak_local', label: 'Speak Local', description: 'Plays synthesized speech through local audio output', requiresApproval: false },
          { name: 'relay_message', label: 'Relay Message', description: 'Relays textual status messages to active UI subscribers', requiresApproval: false },
          { name: 'broadcast_remote', label: 'Broadcast Remote', description: 'Transmits speech notifications across authorized network relays', requiresApproval: true }
        ],
        history: []
      },
      {
        id: 'artanis',
        label: 'Artanis',
        role: 'planner',
        status: 'registered',
        lastSeen: null,
        pid: null,
        capabilities: [
          { name: 'plan_decomposition', label: 'Plan Decomposition', description: 'Decomposes complex human instructions into structured agent task plans', requiresApproval: false },
          { name: 'persona_extractor', label: 'Persona Extractor', description: 'Extracts personality traits and builds buddy models locally', requiresApproval: true },
          { name: 'model_trainer', label: 'Model Trainer', description: 'Trains and refines local buddy and assistant models', requiresApproval: true }
        ],
        history: []
      }
    ];
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(seed, null, 2), 'utf8');
  }
}

function readAgents() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAgents(agents) {
  ensureStore();
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf8');
}

// List all agents
router.get('/', (req, res) => {
  res.json(readAgents());
});

// Get agent by id
router.get('/:id', (req, res) => {
  const agent = readAgents().find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  res.json(agent);
});

// Get agent capabilities
router.get('/:id/capabilities', (req, res) => {
  const agent = readAgents().find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  res.json({
    id: agent.id,
    label: agent.label,
    capabilities: agent.capabilities || []
  });
});

// Get agent command history
router.get('/:id/history', (req, res) => {
  const agent = readAgents().find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  res.json(agent.history || []);
});

// Start agent
router.post('/:id/start', (req, res) => {
  const agents = readAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });

  agent.status = 'running';
  agent.lastSeen = new Date().toISOString();
  writeAgents(agents);

  logAudit({
    action: 'agent_start',
    userId: req.body?.userId || 'chief',
    details: { agentId: agent.id }
  });

  res.json({ ok: true, agent });
});

// Stop agent
router.post('/:id/stop', (req, res) => {
  const agents = readAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });

  agent.status = 'stopped';
  agent.lastSeen = new Date().toISOString();
  writeAgents(agents);

  logAudit({
    action: 'agent_stop',
    userId: req.body?.userId || 'chief',
    details: { agentId: agent.id }
  });

  res.json({ ok: true, agent });
});

// Send command to agent with capability router & approval gating
router.post('/:id/command', async (req, res) => {
  const agents = readAgents();
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });

  const payload = req.body || {};
  const capabilityName = payload.capability || payload.command || payload.action || 'system_status';
  const commandName = payload.command || payload.action || capabilityName;
  const params = payload.params || {};
  const userId = payload.userId || 'chief';

  // Find matching capability in agent
  const caps = agent.capabilities || [];
  let cap = caps.find((c) => c.name === capabilityName);

  // If no exact match, fallback to first capability or create ad-hoc requiresApproval check
  if (!cap) {
    cap = {
      name: capabilityName,
      label: capabilityName,
      description: 'Dynamic capability',
      requiresApproval: true
    };
  }

  agent.lastSeen = new Date().toISOString();
  agent.history = agent.history || [];

  // Gated: sensitive capability requires approval
  if (cap.requiresApproval) {
    const request = createRequest({
      title: `Agent [${agent.id}] command: ${cap.label || cap.name}`,
      agentId: agent.id,
      command: commandName,
      capability: cap.name,
      params,
      userId,
      requiresApproval: true,
      status: 'pending_approval'
    });

    const histEntry = {
      id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      command: commandName,
      capability: cap.name,
      params,
      status: 'pending_approval',
      requestId: request.id,
      timestamp: new Date().toISOString()
    };
    agent.history.unshift(histEntry);
    writeAgents(agents);

    logAudit({
      action: 'agent_command_gated',
      userId,
      status: 'pending_approval',
      details: { agentId: agent.id, command: commandName, requestId: request.id }
    });

    return res.status(202).json({
      ok: true,
      status: 'pending_approval',
      requiresApproval: true,
      requestId: request.id,
      message: `Capability '${cap.name}' requires explicit human approval before execution. Approve via POST /api/requests/${request.id}/approve.`
    });
  }

  // Not gated: execute immediately via capability router
  try {
    const execResult = await capabilityRouter.execute(agent.id, cap.name, { ...params, userId });
    const histEntry = {
      id: `cmd-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      command: commandName,
      capability: cap.name,
      params,
      status: 'executed',
      result: execResult,
      timestamp: new Date().toISOString()
    };
    agent.history.unshift(histEntry);
    writeAgents(agents);

    res.json({
      ok: true,
      status: 'executed',
      agentId: agent.id,
      capability: cap.name,
      result: execResult
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

