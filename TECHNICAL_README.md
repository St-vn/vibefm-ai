# VibeFM: Audio Intelligence & MIR Pipeline
### Real-Time Music Information Retrieval (MIR) & Semantic Synthesis

VibeFM is a mobile platform built for deep-tissue audio analysis. It implements a multi-stage pipeline to transform raw PCM audio into structured acoustic metadata and high-level semantic profiles.

---

## 🏗 System Architecture

### 1. Mobile Frontend (React Native / Expo CNG)
The application is architected using **Expo SDK 54** with **Continuous Native Generation (CNG)**. This allows for a managed developer experience while maintaining the ability to integrate custom native modules required for high-performance audio processing.
*   **Audio Capture**: Utilizes `@siteed/expo-audio-stream` for low-latency, real-time PCM (Pulse-Code Modulation) mic capture.
*   **Animation Engine**: 60fps gesture-driven UI powered by **React Native Reanimated** and **Moti**, utilizing declarative animations to offload work from the JS thread.
*   **State Management**: **Zustand** for lightweight, reactive store management across the capture and matchmaking modules.

### 2. Audio Processing Pipeline
The MIR pipeline is split between live inference and offline batch processing:
*   **Live Identification**: Raw PCM data is encoded to Base64 (with 44-byte WAV header stripping to ensure API compatibility) and sent to the **Shazam (RapidAPI)** endpoint for track identification.
*   **Feature Extraction**: Identified tracks are passed through the **freqblog API** to retrieve quantitative acoustic features:
    *   **Temporal**: Tempo (BPM).
    *   **Energy/Dynamics**: Loudness, Energy, Danceability.
    *   **Tonal**: Key, Mode, Valence.
    *   **Spectral**: Acousticness, Instrumentalness, Speechiness.

### 3. LLM-Powered Semantic Synthesis
Quantitative vectors are synthesized into qualitative profiles using **Gemini Flash 2.5 (OpenRouter)**.
*   **Routing Logic**: The model acts as a deterministic router, mapping raw acoustic features and micro-genre tags to a curated local database of **Sonic Archetypes** (`sonic_profiles.json`).
*   **Output**: Enforces a strict JSON schema via `response_format` to provide qualitative descriptions and "Acoustic Recipes" without the overhead of heavy client-side MIR libraries.

### 4. Acoustic Matchmaking (Vector Similarity)
Users are matched using **Cosine Similarity** across a 5-dimensional acoustic vector: `[Tempo, Energy, Acousticness, Instrumentalness, Valence]`.
*   **Algorithm**: Normalizes the tempo (BPM) scale before calculating the dot product of normalized user and profile vectors.
*   **Compatibility Scoring**: Translates the resulting similarity coefficient into a percentage-based score, identifying "Sonic Soulmates" based on acoustic taste rather than historical metadata.

---

## 🛠 Engineering Challenges & Solutions

### iOS Taptic Conflict Resolution
On iOS, the Taptic engine (haptics) is disabled by the OS when the microphone session is active.
*   **Solution**: Implemented an asynchronous "reveal" sequence. A `setInterval` poller monitors the hardware status; haptic pulses (synced to the track's BPM) are only triggered once the `Audio.Recording` instance is fully destroyed and the OS releases the hardware lock.

### Python MIR Environment (NumPy 2.0 Conflict)
The offline analysis pipeline (using `librosa`, `essentia`, and `Demucs`) experienced critical ABI crashes due to NumPy's 2.0 release.
*   **Solution**: Hard-pinned the environment to `numpy<2.0` and `essentia==2.1b6.dev1110` to maintain stability for spectral feature extraction and stem separation.

### Base64 Overhead & API Payload Trimming
Standard WAV files include a 44-byte header that causes HTTP 204 errors with certain identification APIs when passed as raw Base64.
*   **Solution**: Manually trim the first 59 characters of the Base64 string (calculated as $44 \text{ bytes} \times 1.33 \text{ overhead} \approx 59 \text{ chars}$) to ensure only PCM data is transmitted.

---

## 📊 Data Models

### Track Intelligence Object
```json
{
  "id": "ISRC / Spotify ID",
  "acoustic_vector": [tempo, energy, valence, danceability, acousticness],
  "tonal_data": { "key": 4, "mode": 1 },
  "semantic_profile": "Industrial Grime",
  "spectral_description": "Aggressive textures with synthetic transients"
}
```

---
*Built for Hack the Mountain — Arts + CADUM Mobile Category.*
*Tech Stack: React Native, Expo SDK 54, Gemini Flash 2.5, Librosa, Demucs.*
