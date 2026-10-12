const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const MI_DIR = path.join(__dirname, '..', '..', 'mi');
const USERS_DIR = path.join(MI_DIR, 'users');
const REGISTRY_OUT = path.join(MI_DIR, 'registry_out');
const AUDIT_FILE = path.join(MI_DIR, 'audit.log');

if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });
if (!fs.existsSync(REGISTRY_OUT)) fs.mkdirSync(REGISTRY_OUT, { recursive: true });
if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, '');

function userProfilePath(userId){
  return path.join(USERS_DIR, `${userId}.json`);
}

function readProfile(userId){
  const p = userProfilePath(userId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p,'utf8'));
  } catch (e){ return null; }
}

function writeProfile(userId, obj){
  const p = userProfilePath(userId);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  appendAudit(userId, 'profile_update', { profile: obj });
}

function appendAudit(userId, action, payload){
  const entry = { id: `audit-${Date.now()}`, userId, action, payload, timestamp: new Date().toISOString() };
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
}

// GET profile
router.get('/:user/profile', (req, res) => {
  const userId = req.params.user;
  const profile = readProfile(userId);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  res.json(profile);
});

// POST profile (create or update)
router.post('/:user/profile', (req, res) => {
  const userId = req.params.user;
  const body = req.body || {};
  // minimal validation
  const profile = Object.assign({
    userId,
    displayName: userId,
    mode: 'assistant',
    proactive: false,
    proactiveFrequency: 'daily',
    notifyChannels: ['ui'],
    voiceProfile: { enabled: false, voiceName: '', style: '' },
    mapFilters: { watchOffers: true, watchNeeds: true, watchJobs: true },
    memory: { enabled: true, retentionDays: 90 },
    externalAIConsent: { allowOutbound: false, allowInbound: false },
    sharingLevel: 'none'
  }, body);

  writeProfile(userId, profile);
  res.json({ ok: true, profile });
});

// Export profile to registry_out (simple JSON copy) -- POST /api/mi/:user/export
router.post('/:user/export', (req, res) => {
  const userId = req.params.user;
  const profile = readProfile(userId);
  if (!profile) return res.status(404).json({ error: 'profile not found' });
  const outFile = path.join(REGISTRY_OUT, `${userId}-profile-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ exportedAt: new Date().toISOString(), profile }, null, 2));
  appendAudit(userId, 'export_profile', { file: outFile });
  res.json({ ok: true, path: outFile });
});

// List registry_out files
router.get('/registry/list', (req, res) => {
  try{
    const files = fs.readdirSync(REGISTRY_OUT).map(f => ({ name: f, path: path.join(REGISTRY_OUT,f) }));
    res.json(files);
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// Read audit log (simple)
router.get('/:user/audit', (req, res) => {
  const userId = req.params.user;
  const lines = fs.readFileSync(AUDIT_FILE, 'utf8').trim().split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch(e){return {raw:l}}});
  const filtered = lines.filter(e => !userId || e.userId === userId);
  res.json(filtered);
});

module.exports = router;
