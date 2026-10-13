const crypto = require('crypto');

function generateCode(prefix = 'HF') {
  const bytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${bytes}`;
}

function createHighFiveCode(state, creatorId = 'player-chief') {
  const code = generateCode('HF');
  const record = {
    code,
    creatorId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    redeemed: false,
    reward: {
      coins: 20,
      xp: 35
    }
  };

  state.social.activeHighFiveCodes = (state.social.activeHighFiveCodes || [])
    .filter((c) => c.expiresAt > Date.now() && !c.redeemed);

  state.social.activeHighFiveCodes.push(record);
  return record;
}

function redeemHighFiveCode(state, code, redeemerId = 'player-chief') {
  const clean = String(code || '').trim().toUpperCase();
  state.social.activeHighFiveCodes = state.social.activeHighFiveCodes || [];

  const found = state.social.activeHighFiveCodes.find((c) => c.code === clean);

  if (!found) {
    return {
      ok: false,
      error: 'High-Five code is invalid or has expired.'
    };
  }

  if (found.redeemed) {
    return {
      ok: false,
      error: 'High-Five code was already redeemed.'
    };
  }

  if (Date.now() > found.expiresAt) {
    return {
      ok: false,
      error: 'High-Five code has expired (10-minute validity).'
    };
  }

  found.redeemed = true;
  found.redeemedBy = redeemerId;
  found.redeemedAt = Date.now();

  state.player.coins += found.reward.coins;
  state.player.xp += found.reward.xp;
  state.player.highFivesReceived = (state.player.highFivesReceived || 0) + 1;

  return {
    ok: true,
    code: clean,
    reward: found.reward,
    message: 'High-Five successfully exchanged! Golden energy unlocked!'
  };
}

function createInviteCode(state) {
  const inviteCode = generateCode('INV');
  const invite = {
    code: inviteCode,
    createdAt: new Date().toISOString(),
    status: 'active',
    note: 'Opt-in local peer invite token'
  };
  state.social.invites = state.social.invites || [];
  state.social.invites.push(invite);
  return invite;
}

module.exports = {
  createHighFiveCode,
  redeemHighFiveCode,
  createInviteCode
};
