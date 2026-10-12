const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, 'registry.json');

function loadRegistry() {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load skill registry', err);
    return { skills: [] };
  }
}

function suggestSkillForText(text) {
  const registry = loadRegistry();
  const t = (text || '').toLowerCase();

  // simple keyword mapping — extendable
  if (/bug|error|fix|repair|crash|issue/.test(t)) return registry.skills.find(s => s.id === 'repair');
  if (/voice|audio|tts|stimme|mic|speech/.test(t)) return registry.skills.find(s => s.id === 'voice');
  if (/chat|agent|assistant|workflow|orchestr/.test(t)) return registry.skills.find(s => s.id === 'chat');
  if (/image|video|music|render|media|game/.test(t)) return registry.skills.find(s => s.id === 'media');
  if (/security|privacy|auth|key|secret|protect/.test(t)) return registry.skills.find(s => s.id === 'security');
  if (/webui|front|page|layout|dashboard|ux/.test(t)) return registry.skills.find(s => s.id === 'webui');

  // fallback: lowest-risk generic handler
  return registry.skills.find(s => s.id === 'chat') || (registry.skills.length? registry.skills[0] : null);
}

module.exports = {
  loadRegistry,
  suggestSkillForText
};
