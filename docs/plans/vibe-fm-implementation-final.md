# vibe.fm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) to implement this plan task-by-task.

**Goal:** Build a high-performance Expo (React Native) prototype for vibe.fm focused on sonic intelligence and musical compatibility.

**Architecture:** 4-tab Expo Router app. Data is handled via a local JSON fallback strategy + live API integration (Shazam/freqblog). Components are designed as scientific instruments using technical typography and deep void backgrounds.

**Tech Stack:** Expo SDK 51, NativeWind (Tailwind), Lucide Icons, Moti (Framer Motion for RN), react-native-reanimated, react-native-gesture-handler.

---

### Phase 1: Shell & Brand Foundation
**Goal:** Initialize the environment and establish the visual theme.

- [ ] **Task 1.1: Project Initialization**
  - Setup Expo project with SDK 51 and NativeWind.
  - Install core dependencies: `lucide-react-native`, `moti`, `react-native-reanimated`, `react-native-gesture-handler`.
  - Configure `tailwind.config.js` with the vibe.fm tokens:
    - `void`: #020202
    - `surface`: #0A0A0C
    - `accent-cyan`: #00E5FF
    - `accent-purple`: #9D5CFF
    - `accent-green`: #00F59B
  - Test: Run `npx expo start` and verify color tokens on a test screen.

- [ ] **Task 1.2: Navigation Shell**
  - Create the 4-tab layout using Expo Router.
  - Tabs: Capture (Home), Trending, Matchmaking, History.
  - Implement a custom Bottom Tab Bar with icon + labels and the cyan underline active state.

---

### Phase 2: Capture & Analysis Engine
**Goal:** Build the primary interaction and the reusable data visualization component.

- [ ] **Task 2.1: The Capture Ring**
  - Build the minimalist pulse ring using `Moti` on the Capture screen.
  - Add the source toggle pill (Live Mic / File Upload).
  - Implement the "Listening" state animation.

- [ ] **Task 2.2: The Universal Analysis Modal**
  - Create a reusable `AnalysisModal` component (Sheet-style).
  - Features:
    - Hero Row (Album art + BPM haptic pulse).
    - Sonic Fingerprint (Mono-spaced labels + horizontal bars).
    - Sonic Profile (Archetype name + semantic tag cloud).
    - Qualitative Description block.
  - Ensure background blurs/darkens when active.

---

### Phase 3: Content Feeds
**Goal:** Populate the app with trending tracks and personal history.

- [ ] **Task 3.1: Trending Tab**
  - Implement a `FlatList` with section headers (Global, Montreal, By Property).
  - Create the `TrendingCard` with rank number and property chips.
  - Hook up the card `onPress` to trigger the `AnalysisModal` from Task 2.2.

- [ ] **Task 3.2: History Tab**
  - Implement a reverse-chronological list of track objects.
  - Add date grouping (Today, Yesterday, etc.).
  - Reuse the `AnalysisModal` for row details.

---

### Phase 4: Soulmate Matchmaking
**Goal:** Implement the "stats.fm meets Tinder" discovery experience.

- [ ] **Task 4.1: Swipe Deck Engine**
  - Build the swipeable stack using `react-native-gesture-handler` and `reanimated`.
  - Handle "Commit Match" (Right) and "Skip" (Left) gestures with haptic feedback.

- [ ] **Task 4.2: Soulmate Card UI**
  - Design the `SoulmateCard` component:
    - Compatibility % (Large mono text).
    - Shared Artists (Thumbnail row).
    - Shared Aesthetic (Highlighted tag cloud).
    - Aligned vs. Divergent dimensions.

---

### Phase 5: Data & Simulation (Demo Readiness)
**Goal:** Ensure the app is fully functional for the demo window.

- [ ] **Task 5.1: API Integrations**
  - Setup Shazam (RapidAPI) and freqblog client hooks.
  - Implement the "Simulation Mode" for missing stem/audio data using Gemini Flash 2.5.

- [ ] **Task 5.2: Final Polish & Validation**
  - Run a UX pass for all 8/6/4 baseline constraints.
  - Verify all "Brain/Neuroscience" references are replaced with "Sonic Profile".
  - Perform full regression test on navigation and results reveal.
