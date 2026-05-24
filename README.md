# vibe.fm 🚀
### The Audio Intelligence Layer for Music

> "vibe.fm tells you what a song *does* — to your body, and to the culture."

[![Demo Video](https://img.shields.io/badge/📽️_Watch-Demo-red)](#)
[![Live Site](https://img.shields.io/badge/🌐_Live-Site-blue)](#)

---

## 💡 Inspiration
Shazam tells you what a song is, but we wanted to know what a song *is made of*. As creators and listeners, we felt there was a gap between identifying a track and understanding its "sonic DNA." We built **vibe.fm** to bridge that gap—turning raw audio into actionable intelligence for producers and a new discovery lens for fans.

## ✨ What it does
vibe.fm identifies tracks and immediately performs a deep-tissue sonic analysis. It doesn't just show metadata; it extracts the track's "formula."
*   **Deep Fingerprinting**: Real-time extraction of energy, valence, danceability, and more.
*   **Semantic Profiling**: Maps tracks to curated "Sonic Archetypes" (e.g., *Industrial Grime*) using LLM-powered routing.
*   **Haptic Pulse**: Syncs your device's taptic engine to the song's BPM post-scan.
*   **Acoustic Matchmaking**: Connects you with others based on shared sonic vectors, regardless of genre.

## 🏗️ How we built it
*   **Frontend**: Expo SDK 56 (CNG), React Native, Reanimated.
*   **AI/LLM**: Gemini Flash 2.5 via OpenRouter for semantic simulation and qualitative synthesis.
*   **Audio Pipeline**: 
    -   **Live**: Shazam (RapidAPI) + freqblog API.
    -   **Pre-batch**: Python (`librosa`, `essentia`, `Demucs`) for source separation (vocals/drums/bass/other).
*   **Native**: `@siteed/expo-audio-stream` for high-fidelity PCM capture.

## 🚧 Challenges we ran into
*   **The Essentia ABI Landmine**: We hit a critical native C-API binding crash when NumPy updated to 2.0. We had to strictly pin the entire Python environment to `numpy<2.0` to maintain stability.
*   **iOS Taptic Conflict**: We discovered the Taptic engine is disabled during active microphone recording on iOS. We solved this by architecting a post-identification "reveal" sequence where haptics fire only after the mic is closed.
*   **Deterministic Routing**: Getting an LLM to reliably map raw data to a local JSON database required complex prompt engineering to act as a deterministic router.

## 🏆 Accomplishments that we're proud of
*   Successfully simulated deep spectral analysis in real-time using LLM inference to bypass client-side GPU limitations.
*   Created a high-performance, 60fps gesture-driven UI that handles complex data visualizations without lag.
*   Built a cross-platform (iOS/Android) PCM stream handler using Expo CNG.

## 📖 What we learned
*   The intricacies of **MIR (Music Information Retrieval)** and how to translate quantitative audio features into qualitative "vibes."
*   How to manage native modules in Expo using the new Continuous Native Generation (CNG) workflow.

## 🔮 What's next for vibe.fm
- [ ] **Live Stem Separation**: Bringing Demucs inference to the edge (on-device).
- [ ] **B2B Creator Tools**: Exporting "Acoustic Recipes" directly into DAW formats.
- [ ] **Social Integration**: Real-time "Sonic Rooms" for matching users.

## 🚀 Getting Started
See [vibefm_setup.md](./vibefm_setup.md) for environment setup and API keys.

---
*Built for Hack the Mountain — Arts + CADUM Mobile Category.*
*Aesthetic: Modern Dark Cinema x Lab Instrument.*
