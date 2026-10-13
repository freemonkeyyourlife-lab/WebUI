const express = require('express');
const fs = require('fs');
const path = require('path');
const agentCore = require('../../agents/core/agent_core');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

const DEFAULT_AGENTS = [
  { id: 'kitt', role: 'orchestrator', label: 'K.I.T.T.', description: 'Local coordination agent' },
  { id: 'observer', role: 'observer', label: 'Observer', description: 'Monitors local events and files' },
  { id: 'listener', role: 'listener', label: 'Listener', description: 'Receives and organizes user requests' },
  { id: 'talker', role: 'talker', label: 'Talker', description: 'Prepares local speech responses' }
];

function writeAgents(agents) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2));
}

function readAgents() {
  if (!fs.existsSync(AGENTS_FILE)) {
    const agents = DEFAULT_AGENTS.map((agent) => ({ ...agent, status: 'stopped', lastSeen: null, commands: [] }));
    writeAgents(agents);
  }
  const agents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
  let changed = false;
  agents.forEach((agent) => {
    const runtime = ensureRuntimeAgent(agent);
    if (runtime && agent.status !== runtime.status) {
      agent.status = runtime.status;
      agent.lastSeen = runtime.lastSeen;
      changed = true;
    }
  });
  if (changed) writeAgents(agents);
  return agents;
}

function ensureRuntimeAgent(agent) {
  if (!agent || typeof agent.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(agent.id)) return null;
  let runtime = agentCore.getAgent(agent.id);
  if (!runtime) {
    agentCore.registerAgent({
      id: agent.id,
      role: agent.role || 'assistant',
      label: agent.label || agent.id,
      description: agent.description || '',
      heartbeat: 5000
    });
    runtime = agentCore.getAgent(agent.id);
  }
  return runtime;
}

function findAgent(agents, id) {
  return agents.find((agent) => agent.id === id);
}

router.get('/', (req, res) => {
  try {
    res.json(readAgents());
  } catch (error) {
    res.status(500).json({ error: 'Could not read local agent registry' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const agent = findAgent(readAgents(), req.params.id);
    if (!agent) return res.status(404).json({ error: 'agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Could not read local agent registry' });
  }
});

router.post('/:id/start', (req, res) => {
  try {
    const agents = readAgents();
    const agent = findAgent(agents, req.params.id);
    if (!agent) return res.status(404).json({ error: 'agent not found' });
    const runtime = ensureRuntimeAgent(agent);
    agentCore.startAgent(agent.id);
    agent.status = runtime.status;
    agent.lastSeen = runtime.lastSeen;
    writeAgents(agents);
    res.json({ ok: true, agent });
  } catch (error) {
    res.status(500).json({ error: 'Could not update local agent registry' });
  }
});

router.post('/:id/stop', (req, res) => {
  try {
    const agents = readAgents();
    const agent = findAgent(agents, req.params.id);
    if (!agent) return res.status(404).json({ error: 'agent not found' });
    const runtime = ensureRuntimeAgent(agent);
    agentCore.stopAgent(agent.id);
    agent.status = runtime.status;
    agent.lastSeen = runtime.lastSeen;
    writeAgents(agents);
    res.json({ ok: true, agent });
  } catch (error) {
    res.status(500).json({ error: 'Could not update local agent registry' });
  }
});

router.post('/:id/command', (req, res) => {
  const command = req.body && req.body.command;
  if (typeof command !== 'string' || !command.trim() || command.length > 500) {
    return res.status(400).json({ error: 'command must be a non-empty string of at most 500 characters' });
  }

  try {
    const agents = readAgents();
    const agent = findAgent(agents, req.params.id);
    if (!agent) return res.status(404).json({ error: 'agent not found' });
    const entry = {
      command: command.trim(),
      params: req.body.params && typeof req.body.params === 'object' ? req.body.params : {},
      status: 'approval_required',
      createdAt: new Date().toISOString()
    };
    agent.commands = [...(Array.isArray(agent.commands) ? agent.commands : []), entry].slice(-50);
    writeAgents(agents);
    res.status(202).json({ ok: true, result: { id: agent.id, ...entry } });
  } catch (error) {
    res.status(500).json({ error: 'Could not update local agent registry' });
  }
});

module.exports = router;
