# FREE MONKEYS® GO! — Game Specification & Architecture

## 1. Game Concept & Core Philosophy
**FREE MONKEYS® GO!** is a local-first, privacy-respecting, comic-style urban exploration and micro-adventure game. It turns everyday surroundings into a lighthearted playground of 1- to 3-minute bite-sized missions without requiring external tracking, proprietary cloud backends, or corporate data harvesting.

### Core Directives
- **Local-First & Offline Capable**: All game state, POI data, missions, and rewards are stored on the local machine (`WebUI/KITT/game/data/game_state.json` and browser storage).
- **Consent-First & Opt-In**: Social interactions (High-Five scan codes, invites, co-op help) are strictly opt-in and local-only.
- **Privacy & Notification Controls**: Complete user sovereignty. Push notifications and proactive reminders can be muted or shut off at any time; location tracking can be toggled into Ghost Mode or localized mock coordinates.
- **Micro-Missions (1–3 Minutes)**: Fast loops designed to fit into short breaks, dog walks, or relaxed living-room sessions.

---

## 2. Character Roster — The Three Monkeys
The game features a charismatic comic trio providing diverse playstyles, humorous commentary, and contextual guidance:

1. **Free Monkey GO! (The Hyperactive Explorer)**
   - *Personality*: Athletic, enthusiastic, outdoorsy, always in motion.
   - *Tagline*: *"Run fast, climb trees, find bananas! Let's GO!"*
   - *Specialty*: Fast search, mark, and time-pressure outdoor challenges.
   - *Voice Style*: High energy, upbeat, impatient.

2. **Couchmonkey (The Chill Sofa Strategist)**
   - *Personality*: Relaxed, cozy, humorous, philosophical, coffee-loving.
   - *Tagline*: *"Why sprint when you can think? Even on the sofa, adventure finds us."*
   - *Specialty*: Trivia, useless knowledge, indoor observation, and low-energy micro-tasks.
   - *Voice Style*: Laid-back, deadpan humor, warm and mellow.

3. **MI Companion (The Digital Brain Co-Pilot)**
   - *Personality*: Analytical, witty, supportive, local intelligence co-pilot.
   - *Tagline*: *"Telemetry optimal. Bananas calculated. K.I.T.T. sensors standing by."*
   - *Specialty*: Route optimization, tactical hints, efficiency bonuses, and system status commentary.
   - *Voice Style*: Crisp, authoritative-friendly, subtle technological charm.

---

## 3. Mission System (1–3 Minute Duration)
Missions have a strict time budget of **60 to 180 seconds** to maintain a snappy, rewarding loop.

### Supported Mission Types
1. `search`: Locate a specific visual feature, sign, color, or landmark nearby.
2. `fetch`: Pick up or collect a local collectible (virtual or physical everyday object).
3. `mark`: Tag or verify a local Point of Interest (POI) or check into a milestone.
4. `bring`: Transport a virtual item from one POI to another or bring a supply item to a monkey.
5. `build_care`: Environmental care, water a plant, clean a desk, or build a micro-monument.
6. `time_pressure`: Rapid 60-second dash or speed-reaction challenge.
7. `trivia`: Witty "useless knowledge" questions curated by Couchmonkey and MI Companion.
8. `social_help`: Opt-in cooperative tasks, high-fives, or assisting a neighbor monkey.

---

## 4. Reward Engine
The economic and progression loop is designed for positive reinforcement without addictive dark patterns:
- **Mission Completion Payout**: Awards **Coins** (for cosmetic gear/items) and **XP** (character level).
- **15-Minute Reward Tick**: Every 15 minutes of real-world elapsed time, players can collect an idle "Banana Tick" reward (bonus coins + XP) from the home base.
- **Daily Return Bonus**: Rewarding recurring daily logins with incremental streaks and mystery gift crates.
- **Leveling**: XP progresses through levels (Level 1: Rookie Scout -> Level 10: Supreme Banana Lord).

---

## 5. Map Content Model (GeoJSON POI Engine)
Points of interest are modeled in compliant GeoJSON (`FeatureCollection`), enriched with monkey-specific metadata:
- Real local coordinates (`[lon, lat]`).
- Categories: `market`, `park`, `cafe`, `monument`, `hub`, `nature`, `secret`.
- Monkey Notes: Unique tips left by GO!, Couchmonkey, or MI.
- Discovery State: `unvisited`, `discovered`, `mastered`.

---

## 6. Social & Interaction (Opt-In High-Five)
- **High-Five Code Exchange**: Generates short, cryptographically randomized 6-character tokens (`HF-XXXXXX`) or QR payloads for local physical pass-and-play or peer-to-peer bump.
- **Help Requests**: Opt-in broadcast to local peers for assistance on difficult missions.
- **Invites**: Shareable local code for buddy onboarding.

---

## 7. Privacy & Notification Controls
- **Notification Switch**: Master ON/OFF toggle for sound, visual badges, and proactive companion alerts.
- **Proactive Frequency**: `realtime`, `hourly`, `daily`, or `off`.
- **Ghost Mode**: Suppresses actual GPS coordinates and maps to user-selected mock anchors.
- **Local Isolation**: Zero telemetry transmitted externally.

---

## 8. REST API Specification (`/api/game/*`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/game/profile` | GET | Retrieve player profile, stats, inventory, and settings |
| `/api/game/profile/settings` | POST | Update privacy, ghost mode, and notification preferences |
| `/api/game/monkeys` | GET | Get the 3 monkey companions with current commentary |
| `/api/game/monkeys/:id/comment` | GET | Get real-time dynamic comment for a mission or context |
| `/api/game/pois` | GET | Get GeoJSON FeatureCollection of points of interest |
| `/api/game/pois` | POST | Add or customize a local point of interest |
| `/api/game/missions` | GET | List available and active missions |
| `/api/game/missions/generate` | POST | Generate a 1-3 minute mission (random or specified type) |
| `/api/game/missions/create` | POST | Create a custom mission |
| `/api/game/missions/:id/accept` | POST | Start mission and activate 1-3 minute timer |
| `/api/game/missions/:id/complete` | POST | Complete mission, award rewards, trigger monkey reaction |
| `/api/game/missions/:id/abandon` | POST | Abandon active mission |
| `/api/game/rewards/tick` | POST | Claim 15-minute reward tick bonus |
| `/api/game/rewards/return` | POST | Claim daily return bonus |
| `/api/game/social/highfive` | POST | Generate or redeem a high-five code (opt-in) |
| `/api/game/social/invite` | POST | Generate opt-in invite token |
| `/api/game/history` | GET | Mission audit and completion history |

---

## 9. Mobile-First Comic UI (`public/game.html`)
- **Theme**: Comic book retro-arcade styling with bold borders (`3px solid #111`), vibrant yellows, electric blues, neon greens, speech bubbles, and tactile arcade buttons.
- **Key Views**:
  1. *Mission Command*: Live 1-3 min timer, objective tracker, action buttons.
  2. *Banana Bank*: Coin & XP status, 15-minute tick timer with "Collect" button.
  3. *Trio Lounge*: Interact with GO!, Couchmonkey, and MI Companion.
  4. *Exploration Radar*: Local POI cards and discovery toggles.
  5. *High-Five Scanner*: Code generator and redemption input.
  6. *Privacy Vault*: Notification switches and ghost mode toggles.
