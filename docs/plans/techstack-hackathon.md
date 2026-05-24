# vibe.fm — Tech Stack (Hackathon Sprint)
**Status:** LOCKED — Expo SDK 56, iOS target, 14h window.

---

## Mobile (Expo Managed CNG)

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | `^54.0.0` | Core framework |
| `@siteed/expo-audio-studio` | `^3.0.2` | Real-time PCM mic capture |
| `expo-haptics` | `~13.0.1` | BPM haptic pulse |
| `expo-location` | `~17.0.1` | City-level GPS for trending |
| `expo-file-system` | `~17.0.1` | File upload WAV byte handling |
| `react-native-reanimated` | `~3.10.1` | 60fps spring animations |
| `react-native-gesture-handler` | latest | Swipe deck gestures |
| `moti` | `^0.29.0` | Declarative animated components (waveform ring, staggered reveals) |

**No NativeWind.** Use StyleSheet directly — faster to build, no config overhead.

---

## External APIs

### 1. Shazam — Song Identification
- **Endpoint:** `POST https://shazam.p.rapidapi.com/songs/v2/detect`
- **Headers:** `Content-Type: text/plain`, `X-RapidAPI-Key`, `X-RapidAPI-Host: shazam.p.rapidapi.com`
- **Body:** Raw base64 string (plain text, no JSON wrapper)
- **Returns:** `track.title`, `track.subtitle` (artist), `track.images.coverart` (album art)
- **Critical:** Audio must be 44100Hz, mono, 16-bit PCM LE, raw bytes, < 500KB

### 2. FreqBlog — Acoustic Features
- **Endpoint:** `GET https://api.freqblog.com/lookup?track={title}&artist={artist}`
- **Headers:** `X-API-Key: {FREQBLOG_API_KEY}`
- **Returns:** `bpm`, `key`, `energy`, `valence`, `danceability`, `acousticness`, `instrumentalness`, `speechiness`, `mood`, `genre`
- **Failure:** Graceful — show partial result

### 3. OpenRouter → Gemini 2.5 Flash — LLM synthesis
- **Endpoint:** `POST https://openrouter.ai/api/v1/chat/completions`
- **Model:** `google/gemini-2.5-flash`
- **Required params:** `response_format: { type: "json_object" }`, `reasoning: { exclude: true }`
- **Returns:** `qualitativeDescription` + `sonicProfile` (name + tags)
- **Failure:** Graceful — show fingerprint without description

---

## Data Files (Shipped in `assets/data/`)

| File | Contents |
|------|----------|
| `mock_tracks.json` | 20 fully-populated Track Objects |
| `mock_profiles.json` | 30 User Vector objects |
| `sonic_profiles.json` | 10 named archetypes with tags |

Generated once by `seed.py` before the demo.

---

## Environment Variables

Expo `EXPO_PUBLIC_*` prefix required for client-side access:
```
EXPO_PUBLIC_RAPIDAPI_KEY
EXPO_PUBLIC_RAPIDAPI_HOST=shazam.p.rapidapi.com
EXPO_PUBLIC_FREQBLOG_API_KEY
EXPO_PUBLIC_OPENROUTER_API_KEY
```

---

## What Is NOT Used

| Item | Why dropped |
|------|-------------|
| NativeWind / Tailwind | Config overhead vs time saved — StyleSheet faster to ship |
| Essentia / Librosa / Demucs | Python audio libs, not needed — FreqBlog replaces |
| Conda environment | No audio processing at runtime |
| Any backend server | All calls client-side |
| FFmpeg at runtime | Only needed for pre-batch (seed.py), not in app |
