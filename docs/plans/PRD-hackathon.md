# vibe.fm — PRD (Hackathon Sprint)
**Version:** 2.0 — 14h build window
**Status:** LOCKED — no scope creep

---

## 1. What It Is

Song identifier → sonic fingerprint → user matchmaking. Four tabs. No backend. All data client-side or pre-baked JSON.

---

## 2. Features (Ship Order)

### P0 — Must ship (demo core)
**2.1 Capture Tab**
- Record 5s via `@siteed/expo-audio-studio` → Shazam ID → FreqBlog features → Gemini description + archetype
- Slide-up result sheet: album art, BPM, tags, bar graph, description, sonic profile
- Error path: partial data OK, never block the sheet

**2.2 Trending Tab**
- Reads `mock_tracks.json`. 3 sections: Local (Montreal), Global, By Sonic Property
- Tap card → Analysis Modal (same sheet component, blurred background)

### P1 — Ship if time
**2.3 History Tab**
- Reverse-chrono list of scanned tracks. Tap → reopen result sheet.
- Empty state + date group headers

**2.4 Matchmaking Tab**
- Swipe deck from `mock_profiles.json`. Cosine similarity score.
- Card: compatibility %, shared artists, aligned/divergent properties
- Requires ≥3 scans; otherwise prompt to scan more

---

## 3. Architecture

- Expo SDK 56, Managed Workflow (CNG), targets iOS
- No backend server. No Python at runtime.
- API calls: client-side only (Shazam, FreqBlog, OpenRouter)
- Pre-baked: `mock_tracks.json`, `mock_profiles.json`, `sonic_profiles.json`

---

## 4. Data Pipeline (Live Scan)

```
mic recording (5s, 44100Hz mono 16-bit PCM)
  → base64 raw PCM → Shazam /songs/v2/detect
  → title + artist → FreqBlog /lookup
  → features → OpenRouter/Gemini 2.5 Flash
  → qualitativeDescription + sonicProfile
  → Track Object → result sheet + History append
```

---

## 5. Data Models

### Track Object
```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  tempo: number;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  key: number;
  mode: number;
  microGenre: string;
  moodLabel: string;
  qualitativeDescription: string;
  sonicProfile: { name: string; tags: string[] };
  scannedAt: string;
}
```

### User Vector
```typescript
interface UserVector {
  userId: string;
  displayName: string;
  location: string;
  vector: [number, number, number, number, number]; // [tempo, energy, acousticness, instrumentalness, valence]
  topMicroGenres: string[];
  topArtists: string[];
  topSongs: string[];
  scanCount: number;
}
```

### Compatibility
Cosine similarity on `vector` arrays → 0–100%.

---

## 6. Out of Scope — Hard No

- User auth
- Real-time stem separation / Essentia / Librosa / Demucs
- Social messaging
- Historical trend charts
- Any backend server
- Android-specific testing (demo on iOS only)
