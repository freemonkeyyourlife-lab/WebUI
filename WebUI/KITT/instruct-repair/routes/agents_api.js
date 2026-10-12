const express = require('express');
const router = express.Router();
const agentCore = require('../agents/core/agent_core');

// List agents
router.get('/', (req, res) => {
  try {
    const list = agentCore.listAgents();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get agent
router.get('/:id', (req, res) => {
  const a = agentCore.getAgent(req.params.id);
  if (!a) return res.status(404).json({ error: 'agent not found' });
  res.json(a);
});

// Start agent
router.post('/:id/start', (req, res) => {
  try {
    const a = agentCore.startAgent(req.params.id);
    res.json({ ok: true, agent: a });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Stop agent
router.post('/:id/stop', (req, res) => {
  try {
    const a = agentCore.stopAgent(req.params.id);
    res.json({ ok: true, agent: a });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Send command to agent
router.post('/:id/command', (req, res) => {
  try {
    const { command, params } = req.body || {};
    const result = agentCore.sendCommand(req.params.id, command, params);
    res.json({ ok: true, result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
