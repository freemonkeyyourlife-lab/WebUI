const TICK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const LEVEL_TITLES = [
  'Rookie Banana Scout',
  'Urban Branch Climber',
  'Couch Philosopher',
  'Telemetry Specialist',
  'Rapid Dash Master',
  'Banana Guild Officer',
  'Master Explorer',
  'High-Five Legend',
  'Supreme Monkey Champion',
  'Lord of the Golden Bananas'
];

function calculateLevel(xp) {
  const level = Math.max(1, Math.min(10, Math.floor(xp / 150) + 1));
  const title = LEVEL_TITLES[level - 1] || LEVEL_TITLES[LEVEL_TITLES.length - 1];
  const nextLevelXp = level >= 10 ? null : level * 150;
  return { level, title, currentXp: xp, nextLevelXp };
}

function checkRewardTick(rewardsState) {
  const now = Date.now();
  const lastTick = rewardsState.lastRewardTick || 0;
  const elapsed = now - lastTick;
  const canClaim = elapsed >= TICK_INTERVAL_MS;
  const timeRemainingMs = canClaim ? 0 : TICK_INTERVAL_MS - elapsed;

  return {
    canClaim,
    timeRemainingMs,
    timeRemainingSec: Math.ceil(timeRemainingMs / 1000),
    tickReward: {
      coins: 35,
      xp: 50
    }
  };
}

function claimRewardTick(state) {
  const check = checkRewardTick(state.rewards);
  if (!check.canClaim) {
    return {
      ok: false,
      error: `Tick cooldown active. Try again in ${check.timeRemainingSec}s.`,
      timeRemainingSec: check.timeRemainingSec
    };
  }

  state.rewards.lastRewardTick = Date.now();
  state.player.coins += check.tickReward.coins;
  state.player.xp += check.tickReward.xp;

  const lvl = calculateLevel(state.player.xp);
  state.player.level = lvl.level;
  state.player.levelTitle = lvl.title;

  return {
    ok: true,
    claimed: check.tickReward,
    player: {
      coins: state.player.coins,
      xp: state.player.xp,
      level: state.player.level,
      levelTitle: state.player.levelTitle
    },
    nextClaimInSec: Math.ceil(TICK_INTERVAL_MS / 1000)
  };
}

function checkReturnBonus(rewardsState) {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = rewardsState.lastReturnDate;
  const canClaim = lastDate !== today;

  const streak = rewardsState.returnStreak || 1;
  const bonusCoins = 50 + Math.min(10, streak) * 10;
  const bonusXp = 100;

  return {
    canClaim,
    today,
    lastDate,
    streak,
    bonus: { coins: bonusCoins, xp: bonusXp }
  };
}

function claimReturnBonus(state) {
  const check = checkReturnBonus(state.rewards);
  if (!check.canClaim) {
    return {
      ok: false,
      error: 'Daily return bonus already claimed for today! Check back tomorrow.'
    };
  }

  const today = new Date().toISOString().split('T')[0];
  state.rewards.lastReturnDate = today;
  state.rewards.returnStreak = (state.rewards.returnStreak || 0) + 1;

  state.player.coins += check.bonus.coins;
  state.player.xp += check.bonus.xp;

  const lvl = calculateLevel(state.player.xp);
  state.player.level = lvl.level;
  state.player.levelTitle = lvl.title;

  return {
    ok: true,
    bonus: check.bonus,
    streak: state.rewards.returnStreak,
    player: {
      coins: state.player.coins,
      xp: state.player.xp,
      level: state.player.level,
      levelTitle: state.player.levelTitle
    }
  };
}

module.exports = {
  TICK_INTERVAL_MS,
  calculateLevel,
  checkRewardTick,
  claimRewardTick,
  checkReturnBonus,
  claimReturnBonus
};
