const fs = require('fs');
const path = require('path');
const { getMonkeyById, getRandomComment } = require('./monkeys');

const POIS_FILE = path.join(__dirname, 'pois.json');

function getPois() {
  try {
    const data = JSON.parse(fs.readFileSync(POIS_FILE, 'utf8'));
    return data.features || [];
  } catch {
    return [];
  }
}

const TRIVIA_BANK = [
  {
    q: 'What fruit is botanically classified as a radioactive berry containing potassium-40?',
    options: ['Apple', 'Banana', 'Watermelon', 'Strawberry'],
    answer: 'Banana',
    funFact: 'Yes! Bananas are berries and contain harmless trace natural potassium-40!'
  },
  {
    q: 'How many muscles do domestic cats have in each ear?',
    options: ['6', '12', '32', '54'],
    answer: '32',
    funFact: 'Cats can rotate each ear independently up to 180 degrees using 32 muscles!'
  },
  {
    q: 'What everyday item was originally invented as a wallpaper cleaner before becoming a beloved toy?',
    options: ['Play-Doh', 'Slinky', 'Lego', 'Bubble Wrap'],
    answer: 'Play-Doh',
    funFact: 'Kutol Products created it in the 1930s to clean coal soot off wallpaper!'
  },
  {
    q: 'Which animal holds hands while sleeping so they do not drift apart in the current?',
    options: ['Sea Otters', 'Dolphins', 'Penguins', 'Beavers'],
    answer: 'Sea Otters',
    funFact: 'Sea otters wrap themselves in kelp and hold paws to stay together while dozing!'
  },
  {
    q: 'What is the speed of electricity traveling through common copper wiring?',
    options: ['Speed of light (~90%)', '10 meters/sec', 'Speed of sound', '1 km/sec'],
    answer: 'Speed of light (~90%)',
    funFact: 'The electromagnetic signal propagates along wires at roughly 50% to 90% the speed of light!'
  }
];

const MISSION_TEMPLATES = {
  search: [
    {
      title: 'Perimeter Visual Search',
      desc: 'Scan your immediate surroundings and spot an item that is vivid bright yellow (like a banana peel or sign).',
      durationSec: 120,
      difficulty: 'easy',
      reward: { xp: 45, coins: 20 },
      monkeyId: 'go'
    },
    {
      title: 'Architectural Detail Scan',
      desc: 'Locate any circular clock face, gauge, or dial within visible range.',
      durationSec: 180,
      difficulty: 'medium',
      reward: { xp: 60, coins: 25 },
      monkeyId: 'mi_companion'
    }
  ],
  fetch: [
    {
      title: 'Micro-Object Fetch',
      desc: 'Pick up and secure any portable writing utensil (pen or stylus) to log your mission notes.',
      durationSec: 90,
      difficulty: 'easy',
      reward: { xp: 40, coins: 15 },
      monkeyId: 'go'
    },
    {
      title: 'Energy Capsule Retrieval',
      desc: 'Retrieve a glass of water or hot tea to replenish vital neural hydration reserves.',
      durationSec: 120,
      difficulty: 'easy',
      reward: { xp: 50, coins: 20 },
      monkeyId: 'couchmonkey'
    }
  ],
  mark: [
    {
      title: 'Sector Check-In Tag',
      desc: 'Confirm your current checkpoint coordinates on the exploration radar map.',
      durationSec: 90,
      difficulty: 'easy',
      reward: { xp: 35, coins: 15 },
      monkeyId: 'mi_companion'
    },
    {
      title: 'Landmark Verification Mark',
      desc: 'Mark the nearest designated Point of Interest as visited and log the status.',
      durationSec: 150,
      difficulty: 'medium',
      reward: { xp: 65, coins: 30 },
      monkeyId: 'go'
    }
  ],
  bring: [
    {
      title: 'Spare Part Delivery',
      desc: 'Carry a virtual telemetry voucher or clean paper note to your desk terminal.',
      durationSec: 120,
      difficulty: 'easy',
      reward: { xp: 45, coins: 20 },
      monkeyId: 'mi_companion'
    },
    {
      title: 'Snack Transport to Base',
      desc: 'Transport a healthy snack or fruit to your designated lounge base.',
      durationSec: 150,
      difficulty: 'easy',
      reward: { xp: 50, coins: 25 },
      monkeyId: 'couchmonkey'
    }
  ],
  build_care: [
    {
      title: 'Botanical Hydration Care',
      desc: 'Inspect a nearby house plant or tree; check if the soil is dry and show it some love.',
      durationSec: 120,
      difficulty: 'easy',
      reward: { xp: 50, coins: 25 },
      monkeyId: 'couchmonkey'
    },
    {
      title: 'Micro-Workspace Reset',
      desc: 'Tidy exactly one cable, paper pile, or tool on your workspace for better focus.',
      durationSec: 90,
      difficulty: 'easy',
      reward: { xp: 40, coins: 20 },
      monkeyId: 'mi_companion'
    }
  ],
  time_pressure: [
    {
      title: '60-Second Monkey Dash',
      desc: 'Stand up, do 5 jumping jacks or arm rotations, and touch 3 different doorframes before zero!',
      durationSec: 60,
      difficulty: 'hard',
      reward: { xp: 80, coins: 40 },
      monkeyId: 'go'
    },
    {
      title: 'Quick-Draw Reflex Check',
      desc: 'Rapidly verify 3 system telemetry items on the game dashboard in under 60 seconds.',
      durationSec: 60,
      difficulty: 'medium',
      reward: { xp: 75, coins: 35 },
      monkeyId: 'go'
    }
  ],
  trivia: [
    {
      title: 'Useless Knowledge Trivia',
      desc: 'Couchmonkey challenges your neural cortex with an obscure factoid! Select the correct answer.',
      durationSec: 90,
      difficulty: 'medium',
      reward: { xp: 60, coins: 30 },
      monkeyId: 'couchmonkey'
    }
  ],
  social_help: [
    {
      title: 'Opt-In High-Five Broadcast',
      desc: 'Generate or redeem a High-Five code or send positive cheer to a companion.',
      durationSec: 120,
      difficulty: 'easy',
      reward: { xp: 55, coins: 25 },
      monkeyId: 'couchmonkey'
    },
    {
      title: 'Neighborly Micro-Aid',
      desc: 'Leave an encouraging note or check in on a colleague/friend in real life.',
      durationSec: 180,
      difficulty: 'easy',
      reward: { xp: 60, coins: 30 },
      monkeyId: 'go'
    }
  ]
};

const MISSION_TYPES = [
  'search',
  'fetch',
  'mark',
  'bring',
  'build_care',
  'time_pressure',
  'trivia',
  'social_help'
];

function generateMission(requestedType = null, preferredMonkey = null) {
  const pois = getPois();
  const targetPoi = pois.length > 0 ? pois[Math.floor(Math.random() * pois.length)] : null;

  const type = requestedType && MISSION_TEMPLATES[requestedType]
    ? requestedType
    : MISSION_TYPES[Math.floor(Math.random() * MISSION_TYPES.length)];

  const templates = MISSION_TEMPLATES[type] || MISSION_TEMPLATES.search;
  const tpl = templates[Math.floor(Math.random() * templates.length)];

  const assignedMonkey = preferredMonkey || tpl.monkeyId || 'go';
  const monkey = getMonkeyById(assignedMonkey);

  const missionId = `mis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  let triviaData = null;
  if (type === 'trivia') {
    const item = TRIVIA_BANK[Math.floor(Math.random() * TRIVIA_BANK.length)];
    triviaData = {
      question: item.q,
      options: [...item.options].sort(() => Math.random() - 0.5),
      answer: item.answer,
      funFact: item.funFact
    };
  }

  const durationSec = Math.max(60, Math.min(180, tpl.durationSec || 120));

  return {
    id: missionId,
    type,
    title: tpl.title,
    description: tpl.desc,
    durationSec,
    difficulty: tpl.difficulty,
    reward: tpl.reward,
    assignedMonkey: monkey.id,
    monkeyAvatar: monkey.avatar,
    monkeyComment: getRandomComment(monkey.id, 'mission_start').comment,
    targetPoi: targetPoi ? {
      id: targetPoi.properties.id,
      title: targetPoi.properties.title,
      category: targetPoi.properties.category,
      coordinates: targetPoi.geometry.coordinates
    } : null,
    triviaData,
    status: 'available',
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    expiresAt: null,
    completedAt: null
  };
}

function createCustomMission(data) {
  const type = MISSION_TYPES.includes(data.type) ? data.type : 'search';
  const durationSec = Math.max(60, Math.min(180, Number(data.durationSec) || 120));
  const monkey = getMonkeyById(data.assignedMonkey || 'go');

  const missionId = `mis-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: missionId,
    type,
    title: String(data.title || 'Custom Urban Micro-Mission').trim(),
    description: String(data.description || 'Custom exploration task created by player.').trim(),
    durationSec,
    difficulty: data.difficulty || 'medium',
    reward: {
      xp: Number(data.rewardXp) || 50,
      coins: Number(data.rewardCoins) || 25
    },
    assignedMonkey: monkey.id,
    monkeyAvatar: monkey.avatar,
    monkeyComment: getRandomComment(monkey.id, 'mission_start').comment,
    targetPoi: data.targetPoi || null,
    triviaData: data.triviaData || null,
    status: 'available',
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    expiresAt: null,
    completedAt: null
  };
}

module.exports = {
  MISSION_TYPES,
  generateMission,
  createCustomMission,
  TRIVIA_BANK
};
