// Modified server.js to integrate the Skill Registry suggestions
const express = require('express');
const path = require('path');
const fs = require('fs');

const registry = require('../skills/registry_loader');

const app = express();
const PORT = process.env.PORT || 3005;
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

ensureStorage();

const moduleCatalog = {
  chat: { label: 'Chat / agent workflow', risk: 'low' },
  voice: { label: 'Voice / audio model', risk: 'medium' },
  webui: { label: 'Web UI / dashboards', risk: 'low' },
  media: { label: 'Image / video / music generation', risk: 'medium' },
  repair: { label: 'Bugfix / maintenance', risk: 'medium' },
  security: { label: 'Security / privacy', risk: 'high' }
};

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
  }
}

function readTasks() {
  const raw = fs.readFileSync(TASKS_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function buildSafetyPlan(task, suggestedSkill) {
  const category = suggestedSkill ? suggestedSkill.id : classifyRequest(task);
  const actions = [
    'Check user request for policy and scope boundaries',
    'Map required files and modules before touching code',
    'Create a minimal change plan with explicit acceptance criteria',
    'Run the smallest relevant validation step',
    'Block or require approval for risky actions'
  ];

  return {
    taskId: task.id,
    category,
    module: suggestedSkill?.label || moduleCatalog[category]?.label || 'General task',
    risk: suggestedSkill?.risk || moduleCatalog[category]?.risk || 'low',
    requestedCapability: task.requestedCapability || 'general feature update',
    acceptanceCriteria: [
      'Request is represented as a structured task object',
      'Impact is limited to the intended module or feature',
      'Validation steps are listed before patching',
      'No hidden or remote execution is triggered automatically'
    ],
    actions,
    nextStep: 'Human approval required before patch generation or execution.'
  };
}

function classifyRequest(payload) {
  const text = `${payload.text || ''} ${payload.link || ''} ${payload.note || ''}`.toLowerCase();

  if (/bug|error|fix|repair|broken|fail|crash|issue/.test(text)) return 'repair';
  if (/voice|audio|tts|speech|mic|stimme/.test(text)) return 'voice';
  if (/chat|agent|assistant|workflow|orchestr/.test(text)) return 'chat';
  if (/image|video|music|media|render/.test(text)) return 'media';
  if (/security|privacy|auth|key|secret|protect/.test(text)) return 'security';
  if (/webui|front|page|layout|portal/.test(text)) return 'webui';
  return 'chat';
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'kitt-instruct-repair', mode: 'safe-approval-gated' });
});

app.get('/api/requests', (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

app.get('/api/requests/:id', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((entry) => entry.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });
  res.json(task);
});

app.post('/api/requests', (req, res) => {
  const payload = req.body || {};
  const text = payload.text || payload.Request || payload.prompt || '';
  const link = payload.link || '';

  if (!text && !link) {
    return res.status(400).json({ error: 'Provide text, a link or a request payload.' });
  }

  // suggest a skill using the registry
  const suggestedSkill = registry.suggestSkillForText(`${text} ${link}`);

  const tasks = readTasks();
  const task = {
    id: `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: (payload.title || 'New instruction request').slice(0, 120),
    sourceType: payload.sourceType || (link ? 'link' : 'text'),
    text,
    link,
    requestedCapability: payload.requestedCapability || 'general extension',
    category: suggestedSkill?.id || classifyRequest(payload),
    suggestedModule: suggestedSkill?.label || null,
    status: 'queued',
    secureMode: true,
    createdAt: new Date().toISOString(),
    plan: buildSafetyPlan({ ...payload, id: 'temp', requestedCapability: payload.requestedCapability || 'general extension' }, suggestedSkill)
  };

  tasks.unshift(task);
  writeTasks(tasks);

  res.status(201).json(task);
});

app.post('/api/requests/:id/approve', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((entry) => entry.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });

  task.status = 'approved';
  task.plan = task.plan || buildSafetyPlan(task, registry.suggestSkillForText(task.text || ''));
  task.plan.approvedAt = new Date().toISOString();
  task.approved = true;
  writeTasks(tasks);

  res.json(task);
});

app.post('/api/requests/:id/resolve', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((entry) => entry.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });

  const suggestedSkill = registry.suggestSkillForText(task.text || '');
  const plan = buildSafetyPlan(task, suggestedSkill);
  task.status = 'ready';
  task.plan = plan;

  const extensionResult = {
    id: task.id,
    resolved: true,
    type: 'extension-plan',
    summary: `Task classified as ${plan.category}. Review required before code changes are executed.`,
    startPoint: 'Collect the exact file(s) and acceptance criteria first.',
    safeActions: plan.actions,
    risk: plan.risk,
    acceptanceCriteria: plan.acceptanceCriteria,
    suggestedModule: suggestedSkill?.label,
    suggestedEntrypoint: suggestedSkill?.entrypoint,
    generatedAt: new Date().toISOString()
  };

  writeTasks(tasks);
  res.json({ task, extensionResult });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`K.I.T.T. Instruct & Repair Service running on http://localhost:${PORT}`);
});
