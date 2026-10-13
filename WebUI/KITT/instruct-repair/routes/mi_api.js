const express = require('express');
const path = require('path');
const fs = require('fs');
const auditHelper = require('../audit_helper');
const { capabilityRouter } = require('../capability_router');
const requestsStore = require('../requests_store');

const router = express.Router();

const MI_DIR = path.join(__dirname, '..', '..', 'mi');
const USERS_DIR = path.join(MI_DIR, 'users');
const MEMORY_DIR = path.join(MI_DIR, 'memory');
const REGISTRY_OUT = path.join(MI_DIR, 'registry_out');

[MI_DIR, USERS_DIR, MEMORY_DIR, REGISTRY_OUT].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function defaultProfile(userId) {
  return {
    userId,
    displayName: 'K.I.T.T.',
    mode: 'assistant', // 'assistant' | 'friend' | 'secretary' | 'tactical'
    proactive: true,
    mutedUntil: null,
    proactiveFrequency: 'daily', // 'hourly' | 'daily' | 'weekly' | 'off'
    notifyChannels: ['ui', 'audio'],
    voiceProfile: {
      enabled: true,
      engine: 'local',
      voiceName: 'KITT Primary',
      gender: 'neutral',
      style: 'authoritative-friendly',
      pitch: 'medium',
      speed: 'normal'
    },
    mapFilters: {
      watchOffers: true,
      watchNeeds: true,
      watchJobs: true,
      areas: []
    },
    memory: {
      enabled: true,
      scope: 'local',
      retentionDays: 90
    },
    externalAIConsent: {
      allowInbound: false,
      allowOutbound: false
    },
    sharingLevel: 'none', // 'none' | 'metadata_only' | 'anonymized' | 'full_with_consent' | 'peer_direct'
    sensitivity: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function userProfilePath(userId) {
  return path.join(USERS_DIR, `${userId}.json`);
}

function readProfile(userId) {
  const p = userProfilePath(userId);
  if (!fs.existsSync(p)) {
    const fresh = defaultProfile(userId);
    fs.writeFileSync(p, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return defaultProfile(userId);
  }
}

function writeProfile(userId, obj) {
  const p = userProfilePath(userId);
  obj.updatedAt = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  auditHelper.logAction('profile_update', userId, { profile: obj });
}

function memoryFilePath(userId) {
  return path.join(MEMORY_DIR, `${userId}.json`);
}

function readMemory(userId) {
  const p = memoryFilePath(userId);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeMemory(userId, items) {
  const p = memoryFilePath(userId);
  fs.writeFileSync(p, JSON.stringify(items, null, 2));
}

// GET profile
router.get('/:user/profile', (req, res) => {
  const profile = readProfile(req.params.user);
  res.json(profile);
});

// POST profile
router.post('/:user/profile', (req, res) => {
  const userId = req.params.user;
  const current = readProfile(userId);
  const updated = {
    ...current,
    ...(req.body || {}),
    userId,
    updatedAt: new Date().toISOString()
  };
  writeProfile(userId, updated);
  res.json({ ok: true, profile: updated });
});

// POST consent update
router.post('/:user/consent', (req, res) => {
  const userId = req.params.user;
  const current = readProfile(userId);
  current.externalAIConsent = {
    ...current.externalAIConsent,
    ...(req.body.externalAIConsent || req.body || {})
  };
  if (req.body.sharingLevel) {
    current.sharingLevel = req.body.sharingLevel;
  }
  writeProfile(userId, current);
  auditHelper.logAction('consent_update', userId, {
    externalAIConsent: current.externalAIConsent,
    sharingLevel: current.sharingLevel
  });
  res.json({ ok: true, externalAIConsent: current.externalAIConsent, sharingLevel: current.sharingLevel });
});

// GET memory
router.get('/:user/memory', (req, res) => {
  const items = readMemory(req.params.user);
  res.json(items);
});

// POST memory
router.post('/:user/memory', (req, res) => {
  const userId = req.params.user;
  const items = readMemory(userId);
  const entry = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: req.body.text || '',
    category: req.body.category || 'general',
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    sentiment: req.body.sentiment || 'neutral',
    importance: req.body.importance || 'normal',
    scope: 'local',
    createdAt: new Date().toISOString()
  };
  items.unshift(entry);
  writeMemory(userId, items);
  auditHelper.logAction('memory_create', userId, { memoryId: entry.id, category: entry.category });
  res.status(201).json({ ok: true, memory: entry });
});

// DELETE memory entry
router.delete('/:user/memory/:id', (req, res) => {
  const userId = req.params.user;
  const memoryId = req.params.id;
  const items = readMemory(userId);
  const filtered = items.filter((m) => m.id !== memoryId);
  const deleted = items.length !== filtered.length;
  if (!deleted) {
    return res.status(404).json({ error: 'Memory entry not found' });
  }
  writeMemory(userId, filtered);
  auditHelper.logAction('memory_delete', userId, { memoryId });
  res.json({ ok: true, deletedId: memoryId, remainingCount: filtered.length });
});

// Export memory (GET and POST support)
function handleMemoryExport(req, res) {
  const userId = req.params.user;
  const profile = readProfile(userId);
  const memory = readMemory(userId);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    userId,
    profileSummary: {
      displayName: profile.displayName,
      mode: profile.mode,
      sharingLevel: profile.sharingLevel
    },
    totalEntries: memory.length,
    memories: memory
  };

  const filename = `${userId}-memory-export-${Date.now()}.json`;
  const exportPath = path.join(REGISTRY_OUT, filename);
  fs.writeFileSync(exportPath, JSON.stringify(exportPayload, null, 2));

  auditHelper.logAction('memory_export', userId, { filename, exportPath, entryCount: memory.length });
  res.json({
    ok: true,
    filename,
    exportPath,
    entryCount: memory.length,
    data: exportPayload
  });
}

router.get('/:user/memory/export', handleMemoryExport);
router.post('/:user/memory/export', handleMemoryExport);

// Digest generation from memory
router.get('/:user/digest', (req, res) => {
  const userId = req.params.user;
  const profile = readProfile(userId);
  const memories = readMemory(userId);

  // Group memories by category and recency
  const recentMemories = memories.slice(0, 10);
  const categoryCounts = {};
  memories.forEach((m) => {
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  });

  const highlights = recentMemories.map((m) => `[${m.category.toUpperCase()}] ${m.text}`);

  const digest = {
    user: userId,
    displayName: profile.displayName,
    generatedAt: new Date().toISOString(),
    proactiveMode: profile.proactive ? (profile.mutedUntil && new Date(profile.mutedUntil) > new Date() ? 'muted' : profile.proactiveFrequency) : 'disabled',
    notifyChannels: profile.notifyChannels,
    totalMemories: memories.length,
    categoryBreakdown: categoryCounts,
    recentHighlights: highlights,
    digestText: memories.length > 0
      ? `K.I.T.T. Daily Memory Digest: Tracking ${memories.length} local memories across categories (${Object.keys(categoryCounts).join(', ')}). Latest focus: "${memories[0].text}".`
      : `K.I.T.T. Memory Digest: No memories recorded yet for ${profile.displayName}. System operational in local-first mode.`
  };

  auditHelper.logAction('digest_generated', userId, { totalMemories: memories.length });
  res.json(digest);
});

// Proactive notification schedule honoring notifyChannels and proactiveFrequency with mute/off switch
router.get('/:user/notifications', (req, res) => {
  const userId = req.params.user;
  const profile = readProfile(userId);

  const now = new Date();
  const isMuted = profile.mutedUntil && new Date(profile.mutedUntil) > now;
  const isOff = !profile.proactive || profile.proactiveFrequency === 'off';

  if (isOff || isMuted) {
    return res.json({
      active: false,
      reason: isMuted ? 'muted' : 'proactive_disabled',
      mutedUntil: profile.mutedUntil,
      notifications: []
    });
  }

  // Generate scheduled proactive items according to frequency & channels
  const memories = readMemory(userId);
  const notifications = [
    {
      id: `notif-${Date.now()}-1`,
      type: 'digest_reminder',
      frequency: profile.proactiveFrequency,
      channels: profile.notifyChannels,
      title: `${profile.displayName} Status Check`,
      message: `System healthy. ${memories.length} memories retained locally. Next check scheduled for ${profile.proactiveFrequency} cycle.`,
      timestamp: now.toISOString()
    }
  ];

  if (profile.mapFilters && profile.mapFilters.watchOffers) {
    notifications.push({
      id: `notif-${Date.now()}-2`,
      type: 'map_watch',
      channels: profile.notifyChannels,
      title: 'Local Radar Watch Active',
      message: 'Monitoring local points of interest and regional peer nodes.',
      timestamp: now.toISOString()
    });
  }

  res.json({
    active: true,
    frequency: profile.proactiveFrequency,
    channels: profile.notifyChannels,
    notifications
  });
});

// Mute / Unmute switch for proactive notifications
router.post('/:user/notifications/mute', (req, res) => {
  const userId = req.params.user;
  const profile = readProfile(userId);
  const muteMinutes = req.body.minutes !== undefined ? Number(req.body.minutes) : (req.body.mute ? 60 : 0);

  if (muteMinutes > 0) {
    profile.mutedUntil = new Date(Date.now() + muteMinutes * 60000).toISOString();
    profile.proactive = false;
  } else {
    profile.mutedUntil = null;
    profile.proactive = true;
  }

  writeProfile(userId, profile);
  auditHelper.logAction('notifications_mute_toggle', userId, { muted: muteMinutes > 0, mutedUntil: profile.mutedUntil });
  res.json({
    ok: true,
    proactive: profile.proactive,
    mutedUntil: profile.mutedUntil,
    message: muteMinutes > 0 ? `Proactive notifications muted for ${muteMinutes} minutes` : 'Proactive notifications unmuted'
  });
});

// Consent Enforcement: Block any outbound / sharing path unless externalAIConsent / sharingLevel allows
router.post('/:user/share-external', (req, res) => {
  const userId = req.params.user;
  const profile = readProfile(userId);

  const allowsOutbound = Boolean(profile.externalAIConsent && profile.externalAIConsent.allowOutbound);
  const allowsSharing = profile.sharingLevel && profile.sharingLevel !== 'none';

  if (!allowsOutbound || !allowsSharing) {
    auditHelper.logAction('external_share_blocked', userId, {
      reason: 'consent_denied',
      allowsOutbound,
      sharingLevel: profile.sharingLevel
    });
    return res.status(403).json({
      error: 'Consent Denied: Outbound external AI sharing is blocked by local MI policy.',
      policy: {
        allowOutbound: allowsOutbound,
        sharingLevel: profile.sharingLevel,
        requirement: 'Both allowOutbound=true and sharingLevel != "none" are required to share externally.'
      }
    });
  }

  auditHelper.logAction('external_share_permitted', userId, {
    sharingLevel: profile.sharingLevel,
    target: req.body.target || 'external'
  });

  res.json({
    ok: true,
    status: 'shared_with_consent',
    sharingLevel: profile.sharingLevel,
    message: 'Outbound sharing permitted under user consent policy.'
  });
});

// Command interpreter that routes MI commands to K.I.T.T. capabilities via approval gate
router.post('/:user/command', async (req, res) => {
  const userId = req.params.user;
  const text = (req.body && req.body.text) || '';
  const trimmed = text.trim().toLowerCase();

  // Route to capabilities based on intent
  let targetAgent = 'kitt';
  let matchedCapability = 'system_status';
  let commandParams = { commandText: text };

  if (trimmed.includes('scan') || trimmed.includes('network')) {
    targetAgent = 'observer';
    matchedCapability = 'network_scan';
  } else if (trimmed.includes('listen') || trimmed.includes('transcribe')) {
    targetAgent = 'listener';
    matchedCapability = 'transcribe_audio';
  } else if (trimmed.includes('speak') || trimmed.includes('say') || trimmed.includes('talk')) {
    targetAgent = 'talker';
    matchedCapability = 'speak_local';
    commandParams = { text: text.replace(/^(speak|say|talk)/i, '').trim() || 'Hello from K.I.T.T.' };
  } else if (trimmed.includes('plan') || trimmed.includes('decompose') || trimmed.includes('artanis')) {
    targetAgent = 'artanis';
    matchedCapability = 'plan_decomposition';
    commandParams = { taskDescription: text };
  } else if (trimmed.includes('execute') || trimmed.includes('shell') || trimmed.includes('run') || trimmed.includes('reboot')) {
    targetAgent = 'kitt';
    matchedCapability = 'execute_system_command';
    commandParams = { command: text };
  } else if (trimmed.includes('broadcast') || trimmed.includes('external')) {
    targetAgent = 'talker';
    matchedCapability = 'broadcast_remote';
    commandParams = { message: text };
  } else if (trimmed.includes('status') || trimmed.includes('health') || trimmed.includes('check')) {
    targetAgent = 'kitt';
    matchedCapability = 'system_status';
  } else {
    // Default coordination
    targetAgent = 'kitt';
    matchedCapability = 'orchestrate_agents';
  }

  const capabilityMeta = capabilityRouter.getCapability(matchedCapability);
  const requiresApproval = capabilityMeta ? capabilityMeta.requiresApproval : false;

  auditHelper.logAction('mi_command_interpreted', userId, {
    rawCommand: text,
    matchedCapability,
    targetAgent,
    requiresApproval
  });

  if (requiresApproval) {
    const task = requestsStore.createTask({
      title: `MI User [${userId}] command: ${capabilityMeta ? capabilityMeta.label : matchedCapability}`,
      sourceType: 'mi_command',
      agentId: targetAgent,
      command: matchedCapability,
      capability: matchedCapability,
      params: commandParams,
      text,
      requiresApproval: true
    });

    return res.json({
      ok: true,
      status: 'pending_approval',
      requiresApproval: true,
      requestId: task.id,
      matchedCapability,
      targetAgent,
      message: `Command '${text}' mapped to sensitive capability '${matchedCapability}' on agent '${targetAgent}'. Explicit approval required via POST /api/requests/${task.id}/approve.`
    });
  }

  // Non-sensitive: execute immediately via capability router
  const result = await capabilityRouter.executeCapability(targetAgent, matchedCapability, commandParams);
  res.json({
    ok: true,
    status: 'executed',
    matchedCapability,
    targetAgent,
    result
  });
});

// Audit view endpoint
router.get('/:user/audit', (req, res) => {
  const userId = req.params.user;
  const logs = auditHelper.getRecentLogs(100);
  const userLogs = logs.filter((l) => !userId || l.userId === userId || l.actor === userId || (l.details && l.details.userId === userId));
  res.json(userLogs);
});

module.exports = router;
