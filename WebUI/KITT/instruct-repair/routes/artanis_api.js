const express = require('express');
const artanisModule = require('../artanis_module');

const router = express.Router();

// GET /api/artanis/status
router.get('/status', (req, res) => {
  res.json(artanisModule.getStatus());
});

// GET /api/artanis/personas
router.get('/personas', (req, res) => {
  res.json(artanisModule.listPersonas());
});

// POST /api/artanis/personas
router.post('/personas', (req, res) => {
  const persona = req.body || {};
  if (!persona.name) {
    return res.status(400).json({ error: 'Persona name is required' });
  }
  const saved = artanisModule.savePersona(persona);
  res.status(201).json({ ok: true, persona: saved });
});

// GET /api/artanis/plans
router.get('/plans', (req, res) => {
  res.json(artanisModule.listPlans());
});

// POST /api/artanis/plan (or /decompose)
router.post('/plan', (req, res) => {
  const goal = (req.body && (req.body.goal || req.body.text)) || '';
  if (!goal.trim()) {
    return res.status(400).json({ error: 'Goal or instruction text is required' });
  }
  const plan = artanisModule.decomposeGoal(goal, req.body.context || {});
  res.status(201).json({ ok: true, plan });
});

router.post('/decompose', (req, res) => {
  const goal = (req.body && (req.body.goal || req.body.text)) || '';
  if (!goal.trim()) {
    return res.status(400).json({ error: 'Goal or instruction text is required' });
  }
  const plan = artanisModule.decomposeGoal(goal, req.body.context || {});
  res.status(201).json({ ok: true, plan });
});

// POST /api/artanis/plans/:id/submit - pushes decomposed tasks to approval gate
router.post('/plans/:id/submit', async (req, res) => {
  const planId = req.params.id;
  const actor = req.body?.actor || 'chief';
  try {
    const result = await artanisModule.submitPlanToGate(planId, actor);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
