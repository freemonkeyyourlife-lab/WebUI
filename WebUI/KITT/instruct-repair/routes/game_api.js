const express = require('express');
const fs = require('fs');
const path = require('path');
const { audit } = require('../audit_helper');
const { readState, saveState } = require('../../game/game_state');
const { getAllMonkeys, getMonkeyById, getRandomComment } = require('../../game/monkeys');
const { generateMission, createCustomMission, MISSION_TYPES } = require('../../game/mission_generator');
const { checkRewardTick, claimRewardTick, checkReturnBonus, claimReturnBonus, calculateLevel } = require('../../game/rewards');
const { createHighFiveCode, redeemHighFiveCode, createInviteCode } = require('../../game/social_optin');

const router = express.Router();
const POIS_FILE = path.join(__dirname, '..', '..', 'game', 'pois.json');

function getPoisData() {
  try {
    return JSON.parse(fs.readFileSync(POIS_FILE, 'utf8'));
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}

function writePoisData(data) {
  fs.writeFileSync(POIS_FILE, JSON.stringify(data, null, 2));
}

// Ensure state has some initial available missions if empty
function ensureInitialMissions(state) {
  if (!state.missions.available || state.missions.available.length === 0) {
    state.missions.available = [
      generateMission('search', 'go'),
      generateMission('trivia', 'couchmonkey'),
      generateMission('time_pressure', 'go')
    ];
    saveState(state);
  }
}

// GET /api/game/profile
router.get('/profile', (req, res) => {
  const state = readState();
  ensureInitialMissions(state);

  const lvl = calculateLevel(state.player.xp);
  state.player.level = lvl.level;
  state.player.levelTitle = lvl.title;

  const tick = checkRewardTick(state.rewards);
  const returnBonus = checkReturnBonus(state.rewards);

  res.json({
    ok: true,
    player: state.player,
    rewards: {
      tick,
      returnBonus
    },
    privacy: state.privacy,
    activeMission: state.missions.active,
    availableMissionsCount: state.missions.available.length,
    completedMissionsCount: state.missions.completedCount || 0
  });
});

// POST /api/game/profile/settings
router.post('/profile/settings', (req, res) => {
  const state = readState();
  const updates = req.body || {};

  state.privacy = {
    ...state.privacy,
    ...(updates.privacy || updates)
  };

  if (updates.selectedMonkey) {
    state.player.selectedMonkey = updates.selectedMonkey;
  }

  saveState(state);
  audit({
    type: 'game_settings_update',
    privacy: state.privacy,
    selectedMonkey: state.player.selectedMonkey
  });

  res.json({
    ok: true,
    privacy: state.privacy,
    selectedMonkey: state.player.selectedMonkey
  });
});

// GET /api/game/monkeys
router.get('/monkeys', (req, res) => {
  const monkeys = getAllMonkeys();
  res.json(monkeys);
});

// GET /api/game/monkeys/:id/comment
router.get('/monkeys/:id/comment', (req, res) => {
  const situation = req.query.situation || 'idle';
  const comment = getRandomComment(req.params.id, situation);
  res.json(comment);
});

// GET /api/game/pois
router.get('/pois', (req, res) => {
  const pois = getPoisData();
  res.json(pois);
});

// POST /api/game/pois
router.post('/pois', (req, res) => {
  const pois = getPoisData();
  const { title, description, category, coordinates, monkeyNote } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const id = `poi-${Date.now()}`;
  const feature = {
    type: 'Feature',
    id,
    geometry: {
      type: 'Point',
      coordinates: Array.isArray(coordinates) ? coordinates : [11.5756, 48.1375]
    },
    properties: {
      id,
      title: String(title).trim(),
      category: category || 'custom',
      description: String(description || '').trim(),
      monkeyNote: String(monkeyNote || 'Discovered by local monkey explorer.').trim(),
      secretBonus: 20,
      discovered: true
    }
  };

  pois.features.push(feature);
  writePoisData(pois);
  audit({ type: 'game_poi_create', poiId: id, title });

  res.status(201).json({ ok: true, feature });
});

// GET /api/game/missions
router.get('/missions', (req, res) => {
  const state = readState();
  ensureInitialMissions(state);

  res.json({
    ok: true,
    active: state.missions.active,
    available: state.missions.available,
    types: MISSION_TYPES
  });
});

// POST /api/game/missions/generate
router.post('/missions/generate', (req, res) => {
  const state = readState();
  const { type, monkey } = req.body || {};

  const mission = generateMission(type, monkey || state.player.selectedMonkey);
  state.missions.available.unshift(mission);
  if (state.missions.available.length > 10) {
    state.missions.available = state.missions.available.slice(0, 10);
  }

  saveState(state);
  audit({ type: 'game_mission_generate', missionId: mission.id, missionType: mission.type });

  res.status(201).json({ ok: true, mission });
});

// POST /api/game/missions/create
router.post('/missions/create', (req, res) => {
  const state = readState();
  const mission = createCustomMission(req.body || {});

  state.missions.available.unshift(mission);
  saveState(state);
  audit({ type: 'game_mission_create_custom', missionId: mission.id, title: mission.title });

  res.status(201).json({ ok: true, mission });
});

// POST /api/game/missions/:id/accept
router.post('/missions/:id/accept', (req, res) => {
  const state = readState();
  const missionId = req.params.id;

  const idx = state.missions.available.findIndex((m) => m.id === missionId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Mission not found in available list' });
  }

  const [mission] = state.missions.available.splice(idx, 1);
  const now = Date.now();
  mission.status = 'active';
  mission.acceptedAt = new Date(now).toISOString();
  mission.expiresAt = new Date(now + mission.durationSec * 1000).toISOString();

  // If there was an active mission, put it back or abandon
  if (state.missions.active) {
    state.missions.active.status = 'abandoned';
    state.missions.history.unshift(state.missions.active);
  }

  state.missions.active = mission;
  saveState(state);

  const comment = getRandomComment(mission.assignedMonkey, 'mission_start');
  audit({ type: 'game_mission_accept', missionId: mission.id });

  res.json({
    ok: true,
    mission,
    comment
  });
});

// POST /api/game/missions/:id/complete
router.post('/missions/:id/complete', (req, res) => {
  const state = readState();
  const missionId = req.params.id;

  const active = state.missions.active;
  if (!active || active.id !== missionId) {
    return res.status(400).json({ error: 'Specified mission is not currently active' });
  }

  const now = Date.now();
  const isExpired = active.expiresAt && now > new Date(active.expiresAt).getTime();

  // For trivia, check answer if provided
  const { answer } = req.body || {};
  let triviaCorrect = true;
  if (active.type === 'trivia' && active.triviaData) {
    if (answer && answer.toLowerCase() !== active.triviaData.answer.toLowerCase()) {
      triviaCorrect = false;
    }
  }

  if (!triviaCorrect) {
    return res.status(400).json({
      ok: false,
      error: `Incorrect trivia answer! The correct answer was "${active.triviaData.answer}".`,
      funFact: active.triviaData.funFact
    });
  }

  active.status = 'completed';
  active.completedAt = new Date(now).toISOString();
  if (isExpired) {
    active.expiredPenalty = true;
  }

  // Award rewards (with 20% penalty if expired)
  let xpAward = active.reward.xp;
  let coinsAward = active.reward.coins;
  if (isExpired) {
    xpAward = Math.floor(xpAward * 0.8);
    coinsAward = Math.floor(coinsAward * 0.8);
  }

  state.player.xp += xpAward;
  state.player.coins += coinsAward;
  state.missions.completedCount = (state.missions.completedCount || 0) + 1;

  const lvl = calculateLevel(state.player.xp);
  state.player.level = lvl.level;
  state.player.levelTitle = lvl.title;

  state.missions.history.unshift(active);
  if (state.missions.history.length > 50) {
    state.missions.history = state.missions.history.slice(0, 50);
  }
  state.missions.active = null;

  saveState(state);

  const comment = getRandomComment(active.assignedMonkey, 'mission_complete');
  audit({
    type: 'game_mission_complete',
    missionId: active.id,
    xpAward,
    coinsAward,
    expired: isExpired
  });

  res.json({
    ok: true,
    mission: active,
    awarded: { xp: xpAward, coins: coinsAward },
    player: {
      xp: state.player.xp,
      coins: state.player.coins,
      level: state.player.level,
      levelTitle: state.player.levelTitle
    },
    comment,
    funFact: active.triviaData ? active.triviaData.funFact : null
  });
});

// POST /api/game/missions/:id/abandon
router.post('/missions/:id/abandon', (req, res) => {
  const state = readState();
  const missionId = req.params.id;

  const active = state.missions.active;
  if (!active || active.id !== missionId) {
    return res.status(400).json({ error: 'Specified mission is not currently active' });
  }

  active.status = 'abandoned';
  active.abandonedAt = new Date().toISOString();
  state.missions.history.unshift(active);
  state.missions.active = null;

  saveState(state);
  audit({ type: 'game_mission_abandon', missionId });

  res.json({ ok: true, message: 'Mission abandoned' });
});

// POST /api/game/rewards/tick
router.post('/rewards/tick', (req, res) => {
  const state = readState();
  const result = claimRewardTick(state);

  if (result.ok) {
    saveState(state);
    audit({ type: 'game_claim_reward_tick', claimed: result.claimed });
  }

  res.json(result);
});

// POST /api/game/rewards/return
router.post('/rewards/return', (req, res) => {
  const state = readState();
  const result = claimReturnBonus(state);

  if (result.ok) {
    saveState(state);
    audit({ type: 'game_claim_return_bonus', bonus: result.bonus, streak: result.streak });
  }

  res.json(result);
});

// POST /api/game/social/highfive
router.post('/social/highfive', (req, res) => {
  const state = readState();
  const { action, code } = req.body || {};

  if (action === 'redeem') {
    if (!code) return res.status(400).json({ error: 'High-Five code is required' });
    const result = redeemHighFiveCode(state, code);
    if (result.ok) {
      saveState(state);
      audit({ type: 'game_highfive_redeemed', code });
    }
    return res.json(result);
  }

  // Otherwise generate code
  const record = createHighFiveCode(state);
  saveState(state);
  audit({ type: 'game_highfive_generate', code: record.code });

  res.json({
    ok: true,
    code: record.code,
    expiresAt: new Date(record.expiresAt).toISOString(),
    validMinutes: 10,
    note: 'Scan or enter this code with a fellow monkey to exchange High-Five energy!'
  });
});

// POST /api/game/social/invite
router.post('/social/invite', (req, res) => {
  const state = readState();
  const invite = createInviteCode(state);
  saveState(state);
  audit({ type: 'game_invite_generate', code: invite.code });

  res.json({
    ok: true,
    invite
  });
});

// GET /api/game/history
router.get('/history', (req, res) => {
  const state = readState();
  res.json({
    ok: true,
    history: state.missions.history || [],
    completedCount: state.missions.completedCount || 0
  });
});

module.exports = router;
