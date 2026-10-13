// Modified server.js to integrate MI and File routes
const express = require('express');
const path = require('path');
const fs = require('fs');

const registry = require('../skills/registry_loader');

const app = express();
const PORT = process.env.PORT || 3005;
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

const { rateLimit } = require('./rate_limiter');

// parse larger bodies for uploads
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 600 }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount file handlers and MI API routes (provide flexible file ops + MI settings)
const fileHandlers = require('./api_file_handlers');
const miRoutes = require('./routes/mi_api');
const agentsRoutes = require('./routes/agents_api');
const promptsRoutes = require('./routes/prompts_api');
const voiceRoutes = require('./routes/voice_api');
const artanisRoutes = require('./routes/artanis_api');
const gameRoutes = require('./routes/game_api');
const { readRequests, createRequest, approveRequest, resolveRequest } = require('./requests_store');
const { logAudit } = require('./audit_helper');

if (process.env.ENABLE_CORS === 'true') {
  const cors = require('cors');
  app.use(cors());
}

app.use('/api/files', fileHandlers);
app.use('/api/mi', miRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/prompts', promptsRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/artanis', artanisRoutes);
app.use('/api/game', gameRoutes);

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

app.get('/api/modules', (req, res) => {
  res.json(moduleCatalog);
});

app.get('/api/requests', (req, res) => {
  const tasks = readRequests();
  res.json(tasks);
});

app.get('/api/requests/:id', (req, res) => {
  const tasks = readRequests();
  const task = tasks.find((entry) => entry.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'task not found' });
  res.json(task);
});

app.post('/api/requests', (req, res) => {
  const payload = req.body || {};
  const text = payload.text || payload.Request || payload.prompt || payload.capability || payload.command || '';
  const link = payload.link || '';

  if (!text && !link && !payload.capability && !payload.command) {
    return res.status(400).json({ error: 'Provide text, a link or a request payload.' });
  }

  const suggestedSkill = registry.suggestSkillForText(`${text} ${link}`);
  const task = createRequest({
    title: (payload.title || payload.capability || payload.command || 'New instruction request').slice(0, 120),
    sourceType: payload.sourceType || (link ? 'link' : 'text'),
    text,
    link,
    agentId: payload.agentId || null,
    capability: payload.requestedCapability || payload.capability || suggestedSkill?.id || classifyRequest(payload),
    params: payload.params || {},
    requiresApproval: payload.requiresApproval !== undefined ? payload.requiresApproval : true,
    status: 'pending_approval'
  });

  res.status(201).json({ ok: true, request: task, id: task.id, ...task });
});

app.post('/api/requests/:id/approve', async (req, res) => {
  const approver = req.body?.approver || 'chief';
  const task = await approveRequest(req.params.id, approver);
  if (!task) return res.status(404).json({ error: 'task not found' });
  res.json(task);
});

app.post('/api/requests/:id/resolve', (req, res) => {
  const result = resolveRequest(req.params.id);
  if (!result) return res.status(404).json({ error: 'task not found' });
  res.json(result);
});

app.get('*', (req, res, next) => {
  // If requesting an API route that didn't match, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: `Endpoint ${req.method} ${req.path} not found` });
  }
  const publicDir = path.resolve(__dirname, 'public');
  const safePath = path.resolve(publicDir, '.' + path.normalize(req.path));
  if (safePath.startsWith(publicDir) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    return res.sendFile(safePath);
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`K.I.T.T. Instruct & Repair Service running on http://localhost:${PORT}`);
});
