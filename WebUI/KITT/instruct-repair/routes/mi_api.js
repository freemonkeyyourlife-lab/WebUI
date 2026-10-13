const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const KITT_DIR = path.join(__dirname, '..', '..');
const USERS_DIR = path.join(KITT_DIR, 'mi', 'users');
const MEMORY_DIR = path.join(KITT_DIR, 'mi', 'memory');
const REGISTRY_OUT_DIR = path.join(KITT_DIR, 'mi', 'registry_out');
const TRANSCRIPTS_DIR = path.join(KITT_DIR, 'mi', 'transcripts');
const AUDIT_FILE = path.join(KITT_DIR, 'mi', 'audit.log');

function ensureStorage() {
  [USERS_DIR, MEMORY_DIR, REGISTRY_OUT_DIR, TRANSCRIPTS_DIR].forEach((directory) => {
    fs.mkdirSync(directory, { recursive: true });
  });
  if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, '');
}

function validUser(userId) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(userId);
}

function profilePath(userId) {
  return path.join(USERS_DIR, `${userId}.json`);
}

function memoryPath(userId) {
  return path.join(MEMORY_DIR, `${userId}.json`);
}

function defaultProfile(userId) {
  return {
    userId,
    displayName: userId,
    mode: 'assistant',
    proactive: true,
    proactiveFrequency: 'daily',
    notifyChannels: ['ui', 'audio'],
    voiceProfile: { enabled: false, voiceName: '', style: '' },
    mapFilters: { watchOffers: true, watchNeeds: true, watchJobs: true },
    memory: { enabled: true, retentionDays: 90 },
    externalAIConsent: { allowOutbound: false, allowInbound: false },
    sharingLevel: 'none',
    sensitivity: 'standard'
  };
}

function appendAudit(userId, action, payload) {
  const entry = { id: `audit-${Date.now()}`, userId, action, payload, timestamp: new Date().toISOString() };
  fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(entry)}\n`);
}

function readProfile(userId) {
  const file = profilePath(userId);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function saveProfile(userId, changes) {
  const defaults = defaultProfile(userId);
  const current = readProfile(userId) || {};
  const body = changes && typeof changes === 'object' && !Array.isArray(changes) ? changes : {};
  const profile = {
    ...defaults,
    ...current,
    ...body,
    userId,
    externalAIConsent: {
      ...defaults.externalAIConsent,
      ...(current.externalAIConsent || {}),
      ...(body.externalAIConsent && typeof body.externalAIConsent === 'object' ? body.externalAIConsent : {})
    },
    voiceProfile: { ...defaults.voiceProfile, ...(current.voiceProfile || {}), ...(body.voiceProfile || {}) },
    mapFilters: { ...defaults.mapFilters, ...(current.mapFilters || {}), ...(body.mapFilters || {}) },
    memory: { ...defaults.memory, ...(current.memory || {}), ...(body.memory || {}) }
  };
  profile.externalAIConsent.allowOutbound = profile.externalAIConsent.allowOutbound === true;
  profile.externalAIConsent.allowInbound = profile.externalAIConsent.allowInbound === true;
  fs.writeFileSync(profilePath(userId), JSON.stringify(profile, null, 2));
  appendAudit(userId, 'profile_update', { fields: Object.keys(body) });
  return profile;
}

function loadMemory(userId) {
  const file = memoryPath(userId);
  if (!fs.existsSync(file)) return [];
  const entries = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(entries) ? entries : [];
}

function validUserRequest(req, res, next) {
  if (!validUser(req.params.user)) return res.status(400).json({ error: 'user must contain only letters, numbers, _ or -' });
  ensureStorage();
  next();
}

router.use('/:user', validUserRequest);

router.get('/:user/profile', (req, res) => {
  try {
    let profile = readProfile(req.params.user);
    if (!profile) profile = saveProfile(req.params.user, {});
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Could not read local profile' });
  }
});

router.post('/:user/profile', (req, res) => {
  try {
    const profile = saveProfile(req.params.user, req.body);
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(500).json({ error: 'Could not save local profile' });
  }
});

router.get('/:user/memory', (req, res) => {
  try {
    res.json({ userId: req.params.user, entries: loadMemory(req.params.user) });
  } catch (error) {
    res.status(500).json({ error: 'Could not read local memory' });
  }
});

router.post('/:user/memory', (req, res) => {
  const body = req.body || {};
  const content = typeof body.content === 'string' ? body.content : body.text;
  if (typeof content !== 'string' || !content.trim() || content.length > 20000) {
    return res.status(400).json({ error: 'content must be a non-empty string of at most 20000 characters' });
  }
  try {
    const entries = loadMemory(req.params.user);
    const entry = { id: `memory-${Date.now()}`, content: content.trim(), createdAt: new Date().toISOString() };
    entries.push(entry);
    fs.writeFileSync(memoryPath(req.params.user), JSON.stringify(entries, null, 2));
    appendAudit(req.params.user, 'memory_add', { id: entry.id });
    res.status(201).json({ ok: true, entry });
  } catch (error) {
    res.status(500).json({ error: 'Could not save local memory' });
  }
});

router.post('/:user/consent', (req, res) => {
  const body = req.body || {};
  const consent = body.externalAIConsent && typeof body.externalAIConsent === 'object'
    ? body.externalAIConsent
    : body;
  try {
    const current = readProfile(req.params.user) || defaultProfile(req.params.user);
    const profile = saveProfile(req.params.user, {
      externalAIConsent: {
        allowOutbound: consent.allowOutbound === true,
        allowInbound: consent.allowInbound === true
      },
      ...(typeof body.sharingLevel === 'string' ? { sharingLevel: body.sharingLevel } : {})
    });
    appendAudit(req.params.user, 'consent_update', {
      allowOutbound: profile.externalAIConsent.allowOutbound,
      allowInbound: profile.externalAIConsent.allowInbound,
      sharingLevel: profile.sharingLevel
    });
    res.json({ ok: true, profile });
  } catch (error) {
    res.status(500).json({ error: 'Could not save local consent settings' });
  }
});

router.post('/:user/command', (req, res) => {
  const command = req.body && req.body.command;
  if (typeof command !== 'string' || !command.trim() || command.length > 2000) {
    return res.status(400).json({ error: 'command must be a non-empty string of at most 2000 characters' });
  }
  const request = { command: command.trim(), status: 'approval_required', createdAt: new Date().toISOString() };
  appendAudit(req.params.user, 'command_request', request);
  res.status(202).json({ ok: true, request, externalAIUsed: false });
});

router.get('/:user/digest', (req, res) => {
  try {
    const entries = loadMemory(req.params.user);
    res.json({
      userId: req.params.user,
      memoryCount: entries.length,
      recent: entries.slice(-5)
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not build local digest' });
  }
});

router.post('/:user/speak', (req, res) => {
  const text = req.body && req.body.text;
  if (typeof text !== 'string' || !text.trim() || text.length > 20000) {
    return res.status(400).json({ error: 'text must be a non-empty string of at most 20000 characters' });
  }
  const entry = { text: text.trim(), status: 'approval_required', createdAt: new Date().toISOString() };
  try {
    fs.appendFileSync(path.join(TRANSCRIPTS_DIR, `${req.params.user}.jsonl`), `${JSON.stringify(entry)}\n`);
    appendAudit(req.params.user, 'speak_request', { status: entry.status });
    res.status(202).json({ ok: true, request: entry, externalAIUsed: false });
  } catch (error) {
    res.status(500).json({ error: 'Could not save local speech request' });
  }
});

router.post('/:user/export', (req, res) => {
  try {
    const profile = readProfile(req.params.user);
    if (!profile) return res.status(404).json({ error: 'profile not found' });
    const file = path.join(REGISTRY_OUT_DIR, `${req.params.user}-profile-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify({ exportedAt: new Date().toISOString(), profile }, null, 2));
    appendAudit(req.params.user, 'export_profile', { file: path.basename(file) });
    res.json({ ok: true, path: file });
  } catch (error) {
    res.status(500).json({ error: 'Could not export local profile' });
  }
});

router.get('/registry/list', (req, res) => {
  try {
    res.json(fs.readdirSync(REGISTRY_OUT_DIR).map((name) => ({ name })));
  } catch (error) {
    res.status(500).json({ error: 'Could not list local profile exports' });
  }
});

router.get('/:user/audit', (req, res) => {
  try {
    const entries = fs.readFileSync(AUDIT_FILE, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
      try {
        const entry = JSON.parse(line);
        return entry.userId === req.params.user ? [entry] : [];
      } catch (error) {
        return [];
      }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Could not read local audit log' });
  }
});

ensureStorage();

module.exports = router;
