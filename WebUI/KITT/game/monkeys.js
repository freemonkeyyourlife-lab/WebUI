const MONKEYS = [
  {
    id: 'go',
    name: 'Free Monkey GO!',
    nickname: 'GO!',
    bio: 'Hyperactive explorer, speed runner, and parkour banana scout.',
    catchphrase: "Run fast, climb trees, find bananas! Let's GO!",
    avatar: '🐒⚡',
    badge: 'Scout Vanguard',
    style: 'energetic',
    specialties: ['search', 'mark', 'time_pressure'],
    voicePreset: 'KITT Primary',
    comments: {
      idle: [
        'Sitting around burns zero calories! Let us go explore!',
        'I sense ripe bananas 200 meters north-west!',
        'Quick stretch, deep breath, and sprint!'
      ],
      mission_start: [
        'Timer is ticking! Pump those legs!',
        'Full speed ahead! Nothing can slow us down!'
      ],
      mission_complete: [
        'BOOM! Finished like a champion! Have some bananas!',
        'Record time! You move like a real monkey!'
      ],
      time_warning: [
        'Under 30 seconds left! SPRINT SPRINT SPRINT!'
      ],
      highfive: [
        'SLAP! That was a high-voltage high-five! Let is rock!'
      ]
    }
  },
  {
    id: 'couchmonkey',
    name: 'Couchmonkey',
    nickname: 'Couchie',
    bio: 'Chill sofa strategist, trivia philosopher, and relaxed micro-adventurer.',
    catchphrase: 'Why sprint when you can think? Even on the sofa, adventure finds us.',
    avatar: '🛋️🐵',
    badge: 'Zen Philosopher',
    style: 'relaxed',
    specialties: ['trivia', 'build_care', 'social_help'],
    voicePreset: 'KITT Friendly',
    comments: {
      idle: [
        'Did you know sea otters hold hands while sleeping? Majestic.',
        'A good cup of tea increases mission intelligence by 42%.',
        'Take it easy. Great discoveries require comfortable cushions.'
      ],
      mission_start: [
        'No rush. Mind over muscle. Read the fine print first.',
        'Sip your coffee, analyze the problem, then strike calmly.'
      ],
      mission_complete: [
        'Brilliantly solved with minimal unnecessary movement. Respect.',
        'Quality work. Now we have earned a well-deserved snack.'
      ],
      time_warning: [
        'Keep calm, don’t spill your tea, wrap it up gracefully.'
      ],
      highfive: [
        'Gentle high-five, nice and smooth. Peace to you, fellow monkey.'
      ]
    }
  },
  {
    id: 'mi_companion',
    name: 'MI Companion',
    nickname: 'MI',
    bio: 'Tactical intelligence co-pilot, sensor analyst, and K.I.T.T. liaison.',
    catchphrase: 'Telemetry optimal. Bananas calculated. K.I.T.T. sensors standing by.',
    avatar: '🤖✨',
    badge: 'Cyber Tactician',
    style: 'tactical',
    specialties: ['fetch', 'bring', 'search'],
    voicePreset: 'KITT Authoritative',
    comments: {
      idle: [
        'Local loopback secure. Sensor telemetry at 99.8% precision.',
        'All three monkey subroutines operating within normal parameters.',
        'K.I.T.T. radar detects 3 exploration opportunities in sector.'
      ],
      mission_start: [
        'Mission sequence engaged. Tactical timer active.',
        'Telemetry locked on target coordinates. Proceed with confidence.'
      ],
      mission_complete: [
        'Mission objectives confirmed. XP and coin registers updated.',
        'Optimal execution route verified. High efficiency rating achieved.'
      ],
      time_warning: [
        'Temporal alert: Time reserve below 25%. Accelerate execution.'
      ],
      highfive: [
        'Tactical handshake verified. Neural handshake acknowledged.'
      ]
    }
  }
];

function getAllMonkeys() {
  return MONKEYS;
}

function getMonkeyById(id) {
  return MONKEYS.find((m) => m.id === id) || MONKEYS[0];
}

function getRandomComment(monkeyId, situation) {
  const monkey = getMonkeyById(monkeyId);
  const pool = monkey.comments[situation] || monkey.comments.idle;
  const idx = Math.floor(Math.random() * pool.length);
  return {
    monkeyId: monkey.id,
    monkeyName: monkey.nickname,
    avatar: monkey.avatar,
    situation,
    comment: pool[idx]
  };
}

module.exports = {
  MONKEYS,
  getAllMonkeys,
  getMonkeyById,
  getRandomComment
};
