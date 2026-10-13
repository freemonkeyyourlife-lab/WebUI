const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'game_state.json');

function defaultState() {
  return {
    player: {
      id: 'player-chief',
      username: 'Chief Monkey',
      level: 1,
      levelTitle: 'Rookie Banana Scout',
      xp: 0,
      coins: 100,
      selectedMonkey: 'go',
      inventory: [
        { id: 'item-scout-whistle', name: 'Brass Scout Whistle', type: 'gear', quantity: 1 },
        { id: 'item-banana-snack', name: 'Golden Energy Banana', type: 'consumable', quantity: 3 }
      ],
      highFivesGiven: 0,
      highFivesReceived: 0
    },
    rewards: {
      lastRewardTick: Date.now(),
      tickIntervalMs: 15 * 60 * 1000, // 15 minutes
      lastReturnDate: new Date().toISOString().split('T')[0],
      returnStreak: 1
    },
    privacy: {
      notificationsEnabled: true,
      notificationFrequency: 'hourly', // 'realtime', 'hourly', 'daily', 'off'
      proactiveMuted: false,
      ghostMode: false,
      mockAnchor: { lat: 48.1375, lon: 11.5756, name: 'Monkey Central Market' },
      localOnly: true,
      sharingLevel: 'none'
    },
    missions: {
      active: null,
      available: [],
      completedCount: 0,
      history: []
    },
    social: {
      activeHighFiveCodes: [],
      invites: []
    }
  };
}

function ensureState() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) {
    const state = defaultState();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return state;
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    const state = defaultState();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return state;
  }
}

function readState() {
  return ensureState();
}

function saveState(state) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

module.exports = {
  readState,
  saveState,
  defaultState
};
