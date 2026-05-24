# vibe.fm — Product Requirements Document
**Version:** 1.3 (Updated Hackathon Scope)
**Event:** Hack the Mountain — Arts + CADUM Mobile Category
**Build Window:** 22h solo + AI agents
**Status:** Cleaned - Removed neuroscience/brain references. Updated Matchmaking.

---

## 1. Product Overview

### 1.1 Concept
vibe.fm is an audio intelligence layer for music. It does what Shazam does — identify a song — then goes significantly deeper: extracting a full sonic fingerprint, identifying the track's semantic sonic profile, and connecting users who share the same acoustic taste and artist preferences.

### 1.2 Pitch Thesis
> "vibe.fm is the audio intelligence layer that music was missing — for listeners it's identity and discovery, for creators and labels it's the signal behind what's actually working."

---

## 2. Core Features

### 2.1 Audio Scanner (Capture)
Identify any song from live mic input or uploaded audio file. Return a full sonic fingerprint including acoustic properties, mood/vibe label, micro-genre classification, LLM-generated qualitative description, and a semantic sonic profile.

### 2.2 Sonic Fingerprint
Tracks are analyzed across two layers:
- **Acoustic metadata:** tempo, energy, valence, danceability, acousticness, instrumentalness, speechiness, key, mode.
- **Semantic Profile Matching:** Maps metadata and tags to curated archetypes in `sonic_profiles.json` via Gemini Flash 2.5.

### 2.3 Trending Dashboard
A live feed of trending tracks. Each trending card is clickable to open an **Analysis Modal** — a pop-up window showing the full acoustic recipe (fingerprint + description). Use GPS for Montreal localization.

### 2.4 Matchmaking (Soulmates)
Users are matched based on an acoustic vector `[tempo, energy, acousticness, instrumentalness, valence]` AND shared artist preferences. 
- **Swipe Deck UX:** Tinder/stats.fm inspired deck.
- **Card content:** Compatibility score, **Shared Artists**, Top Tracks, and Aligned/Divergent sonic properties.

### 2.5 Scan History
Flat list of scanned tracks. Tapping any entry reopens the results sheet.

---

## 3. Architecture

### 3.1 App Type
Expo Managed Workflow (CNG). Targets iOS/Android.

### 3.2 Data Strategy
- **Live:** Shazam RapidAPI (song ID) → freqblog (features) → Gemini Flash 2.5 (synthesis/simulation).
- **Pre-batched:** 20 songs, 10-15 archetypes, trending chart, 30 mock user profiles.

---

## 4. Screens (Detailed)

### 4.1 Capture Tab
- Center: Pulse ring (Moti).
- Results: Staggered reveal slide-up sheet.
- Haptics: BPM-synced pulse post-identification (must ensure OS mic session is fully terminated first due to iOS Taptic limitations).

### 4.2 Trending Tab
- List of ranked tracks.
- Interaction: Tap row → Analysis Modal pop-up (blurs background).

### 4.3 Matchmaking Tab
- Swipe deck (Soulmates).
- Content: User name, Location, **Compatibility %**, **Shared Artists thumbnails**, Shared vibes.

### 4.4 History Tab
- Flat chronological list. Reuse Results Sheet.

---

## 5. Data Models

### 5.1 Track Object
```json
{
  "id": "spotify:track:xxx or ISRC",
  "title": "string",
  "artist": "string",
  "album": "string",
  "albumArt": "url",
  "tempo": 128.4,
  "energy": 0.87,
  "valence": 0.62,
  "danceability": 0.74,
  "acousticness": 0.03,
  "instrumentalness": 0.12,
  "speechiness": 0.08,
  "key": 4,
  "mode": 1,
  "microGenre": "Jersey Club",
  "moodLabel": "Euphoric",
  "qualitativeDescription": "Aggressive electronic textures...",
  "sonicProfile": {
    "name": "Industrial Grime",
    "tags": ["distorted", "synthetic"]
  },
  "scannedAt": "ISO timestamp"
}
```

### 5.2 User Vector
```json
{
  "userId": "mock-uuid",
  "displayName": "string",
  "vector": [128.4, 0.87, 0.03, 0.12, 0.62],
  "topMicroGenres": ["Jersey Club"],
  "topArtists": ["The Weeknd", "Daft Punk"],
  "topSongs": ["Starboy"],
  "scanCount": 12
}
```

---

## 6. Out of Scope (Hackathon)
- User Auth
- Real-time stem generation (pre-batched only)
- Social messaging
- Historical trend charts
