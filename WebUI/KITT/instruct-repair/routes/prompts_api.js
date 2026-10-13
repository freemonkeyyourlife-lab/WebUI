const express = require('express');
const fs = require('fs');
const path = require('path');
const { logAudit } = require('../audit_helper');

const router = express.Router();

const PROMPTS_FILE = path.join(__dirname, '..', '..', 'prompts', 'catalog.json');

function ensureCatalog() {
  const dir = path.dirname(PROMPTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PROMPTS_FILE)) {
    fs.writeFileSync(PROMPTS_FILE, '[]', 'utf8');
  }
}

function readCatalog() {
  ensureCatalog();
  try {
    return JSON.parse(fs.readFileSync(PROMPTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeCatalog(items) {
  ensureCatalog();
  fs.writeFileSync(PROMPTS_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function extractVariables(templateText) {
  const matches = (templateText || '').match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (!matches) return [];
  const vars = matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim());
  return Array.from(new Set(vars));
}

// GET all prompts or search
router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const items = readCatalog();
  if (!q) return res.json(items);

  const filtered = items.filter((item) => {
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.template && item.template.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });
  res.json(filtered);
});

// GET single prompt
router.get('/:id', (req, res) => {
  const items = readCatalog();
  const item = items.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'prompt not found' });
  res.json(item);
});

// POST save/update prompt template
router.post('/', (req, res) => {
  const body = req.body || {};
  const template = String(body.template || '').trim();
  if (!template) {
    return res.status(400).json({ error: 'template text is required' });
  }

  const items = readCatalog();
  const id = body.id || `prompt-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const extracted = extractVariables(template);
  const variables = Array.isArray(body.variables) && body.variables.length ? body.variables : extracted;

  const promptRecord = {
    id,
    title: String(body.title || 'Untitled Prompt').slice(0, 100),
    description: String(body.description || '').slice(0, 250),
    template,
    variables,
    tags: Array.isArray(body.tags) ? body.tags : [],
    updatedAt: new Date().toISOString()
  };

  const existingIndex = items.findIndex((p) => p.id === id);
  if (existingIndex >= 0) {
    items[existingIndex] = promptRecord;
  } else {
    items.unshift(promptRecord);
  }

  writeCatalog(items);
  logAudit({
    action: existingIndex >= 0 ? 'prompt_updated' : 'prompt_created',
    userId: body.userId || 'chief',
    details: { id, title: promptRecord.title }
  });

  res.status(201).json({ ok: true, prompt: promptRecord });
});

// DELETE prompt template
router.delete('/:id', (req, res) => {
  const items = readCatalog();
  const filtered = items.filter((p) => p.id !== req.params.id);
  if (filtered.length === items.length) {
    return res.status(404).json({ error: 'prompt not found' });
  }

  writeCatalog(filtered);
  logAudit({
    action: 'prompt_deleted',
    userId: 'chief',
    details: { id: req.params.id }
  });

  res.json({ ok: true, id: req.params.id });
});

// POST render prompt template with variables
router.post('/:id/render', (req, res) => {
  const items = readCatalog();
  const item = items.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'prompt not found' });

  const values = req.body?.variables || req.body?.values || {};
  let rendered = item.template;
  const missing = [];

  for (const v of item.variables || []) {
    const pattern = new RegExp(`\\{\\{${v}\\}\\}`, 'g');
    if (values[v] !== undefined && values[v] !== null) {
      rendered = rendered.replace(pattern, String(values[v]));
    } else {
      missing.push(v);
    }
  }

  res.json({
    id: item.id,
    title: item.title,
    rendered,
    missingVariables: missing
  });
});

module.exports = router;
