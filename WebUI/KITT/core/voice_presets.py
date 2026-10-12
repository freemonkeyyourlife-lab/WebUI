VOICE_PRESETS = {
    "kit_default": {
        "name": "K.I.T.T. Default",
        "description": "Clean, technical, calm, high-trust synthetic voice with a slightly futuristic edge.",
        "pitch": 0.0,
        "speed": 1.0,
        "energy": 58,
        "warmth": 62,
        "reverb": 0.15,
        "style": "neutral_professional",
    },
    "guardian": {
        "name": "Guardian",
        "description": "Lower, more commanding tone for alerts and system-critical messages.",
        "pitch": -1.5,
        "speed": 0.95,
        "energy": 72,
        "warmth": 40,
        "reverb": 0.2,
        "style": "commanding",
    },
    "assistant": {
        "name": "Assistant",
        "description": "Balanced, transparent and supportive voice for normal chat use.",
        "pitch": 0.8,
        "speed": 1.05,
        "energy": 52,
        "warmth": 68,
        "reverb": 0.1,
        "style": "supportive",
    },
    "night_mode": {
        "name": "Night Mode",
        "description": "More subdued, low-latency, quiet voice profile for stealth monitoring and background tasks.",
        "pitch": -2.5,
        "speed": 0.9,
        "energy": 35,
        "warmth": 56,
        "reverb": 0.08,
        "style": "low_profile",
    },
}


def get_preset(name: str | None = None):
    if not name:
        return VOICE_PRESETS["kit_default"]
    return VOICE_PRESETS.get(name, VOICE_PRESETS["kit_default"])


def list_presets():
    return VOICE_PRESETS
