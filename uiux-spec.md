# vibe.fm — UI/UX Specification

**For:** Design & implementation reference
**Covers:** Information architecture, screen UX, interaction patterns, visual identity
**Excludes:** Implementation code, component libraries, CSS tokens, build instructions

---

## 1. Design Philosophy

vibe.fm is an **audio intelligence instrument** — it measures, visualizes, and connects people through the physics of sound. It is not a music player. It is not a social app with dark mode. The UX must communicate precision, measurement, and signal detection — like a laboratory instrument or a submarine sonar screen.

**Two-sided product, one UI:** The same screens serve consumers discovering music and creators/labels analyzing what's working. The trending feed is where this dual purpose lives — a consumer sees "what's popular," a producer sees "what's the acoustic recipe."

**Tone:** Scientific, precise, minimal. Not playful. Not aggressive. Not warm. Data is the decoration.

---

## 2. Navigation Architecture

### 2.1 Bottom Tab Bar — 4 tabs

| Tab | Purpose | Primary Action |
|-----|---------|----------------|
| Capture | Song identification + full analysis | Scan a track via mic or file upload |
| Trending | Live feed of popular tracks with acoustic overlays | Browse, filter, expand for B2B formula view |
| Matchmaking | Swipe deck of sonic-taste matches | Discover users with aligned acoustic vectors |
| History | Personal scan archive | Review past scans, reopen analysis |

**Tab bar behavior:**
- Always visible, all 4 tabs labeled (icon + text)
- Active tab indicated by accent color + thin underline
- Capture is the default tab on launch
- No tab ever hides or changes

### 2.2 User Flow

```
Launch → Capture (idle)
  ├─ Scan track → Results sheet overlay
  │   ├─ Dismiss → back to Capture idle
  │   └─ Save → auto-logged to History
  │
  ├─ Navigate to Trending
  │   └─ Tap card → Analysis Modal (pop-up)
  │
  ├─ Navigate to Matchmaking
  │   ├─ Has ≥3 scans → swipe deck
  │   └─ Has <3 scans → prompt to scan more
  │
  └─ Navigate to History
      └─ Tap past entry → reopen results sheet
```

---

## 3. Capture Tab — UX

### 3.1 Purpose
Core scanner. Identify a song from live microphone or uploaded audio file, then present a full sonic analysis.

### 3.2 States

**Idle state**
- Full-screen dark canvas. No chrome, no cards, no buttons other than the source toggle.
- Center: a minimalist waveform ring — thin circle, slow ambient pulse, no decorative flourishes.
- Top: source toggle — two labeled options (Live Mic / File Upload) in a pill shape, not a tab bar.
- Bottom: small instructional text, low contrast.
- The screen communicates readiness. Nothing is happening. The user needs to act.

**Active: Listening**
- User taps the center ring (or the mic toggle is already active).
- The waveform ring reacts to live microphone input — expanding and contracting with ambient volume.
- Small listening label appears. Minimal. No spinner.
- Haptic feedback is disabled during mic recording (iOS limitation).

**Active: Uploading**
- User toggles to File Upload and selects a file.
- Native file picker opens. No custom file browser.
- While processing, the center ring pulses slowly. No percentage, no spinner.

**Results (post-identification)**
- The analysis appears as a **slide-up sheet** from the bottom — not a new screen, not a full-page transition.
- Sheet rises to ~75% of screen height. The capture ring remains visible behind it, dimmed.
- Content inside the sheet reveals in a **staggered sequence** — each section appears slightly after the previous, creating a sense of analysis unfolding.
- Sheet is dismissible by dragging downward.

**Sheet content (in reveal order):**

1. **Hero row** — Album art thumbnail, track title, artist name. A small green pulse indicator matching the song's BPM sits in the corner. The BPM value is displayed as a number.

2. **Tag row** — Mood label and micro-genre classification displayed as compact labels. Two tags, side by side. One filled (mood), one outlined (micro-genre).

3. **Sonic fingerprint** — Vertical stack of labeled horizontal bars. Each bar represents one acoustic property: energy, valence, danceability, acousticness, instrumentalness, speechiness. Each bar has a label on the left, a colored bar fill proportional to the value, and the precise value on the right.
   - Bars read like a data dashboard, not a music visualizer.
   - Each property is color-coded by its domain (audio properties vs profile properties).

4. **Description** — 2-3 sentences of LLM-generated qualitative description. Plain text, small size, low contrast. It supplements the data, not replaces it.

5. **Sonic profile** — The matched semantic archetype name and its associated tags. Small, at the bottom of the sheet. It reads like a classification result.

**Error state**
- If identification fails: compact sheet rises with "Could not identify" message + retry button. No fingerprint.
- If profile match fails: sheet shows all fingerprint data but omits the sonic profile section. Graceful degradation.

### 3.3 Key Interactions
- Tap center ring → start listening (when idle).
- Tap toggle → switch between mic and file upload.
- Drag sheet down → dismiss results.
- BPM indicator pulses at the track's actual BPM using haptic feedback (after identification only).

---

## 4. Trending Tab — UX

### 4.1 Purpose
Live feed of popular tracks, enriched with acoustic property overlays. Serves both consumers (discovery) and creators (acoustic recipe analysis).

### 4.2 States

**Loaded state**
- Scrollable list organized into 3 sections: Local (Montreal), Global, By Sonic Property.
- Each section has a text header — nothing decorative, just a label.
- GPS location is displayed as a small badge near the top. On first launch, a one-time permission sheet asks for city-level location access.

**Card behavior**
- Each track is a horizontal row: rank number, small album art, title + artist stacked, and 2-3 property chips on the right.
- Chips are small compact labels showing dominant properties ("high energy," "instrumental").
- Tapping a card triggers an **Analysis Modal** — a pop-up window that blurs/darkens the background and displays the same detailed suite of measurements as the Capture results sheet.
- This modal displays the "Sonic Formula" (detailed fingerprint bars) and qualitative description.

**Empty / error state**
- If no data: centered text + refresh action.
- If GPS denied: show global data only, indicate location is off.

### 4.3 Key Interactions
- Scroll vertically through sections.
- Tap card → open Analysis Modal.
- Tap close or background → dismiss modal.
- GPS permission is a one-time system dialog, not a custom UI.

---

## 5. Matchmaking Tab — UX

### 5.1 Purpose
Connect users based on sonic taste similarity, including specific artist overlap.

### 5.2 States

**Deck state (≥3 scans in history)**
- A swipeable card deck. One card visible at a time, with the edge of the next card peeking behind.
- Each card shows: avatar placeholder (colored circle with initials), display name, top 3 sonic properties as chips.
- The hero metric on each card is the **match percentage** — a large numeric value expressing cosine similarity as a human-readable percentage.
- Below the percentage, the card displays a scrollable (or compact) details section:
  - **Shared Artists** — A row of circular artist thumbnails or text tags showing musical overlap.
  - **Top Tracks** — 2-3 of the match's most scanned songs.
  - **Aligned** — dimensions where both users share similar values. Shown as compact labels.
  - **Diverges** — dimensions where they differ. Shown as outlined labels.
- At the bottom of the card: small instructional text indicating swipe direction.

**Swipe behavior**
- Swipe right → "match" action. A brief green flash behind the card, then it flies off right.
- Swipe left → "skip" action. Card fades and slides off left with no flourish.
- Swipe is the primary interaction. No buttons.

**Empty / loading state (<3 scans)**
- Not a deck. A centered prompt: "Scan at least 3 tracks to build your sonic profile."
- A button that navigates to the Capture tab.
- The deck is simply not shown until the threshold is met.

**No-match fallback**
- If the algorithm finds no close matches: show the closest match anyway with a lower percentage. Still show the card. Never show an empty deck.

### 5.3 Key Interactions
- Drag card left or right → follows finger in real time.
- Release past threshold → commit to match or skip (with haptic).
- Release before threshold → card springs back to center.
- Swipe through deck until exhausted, then show end state.

---

## 6. History Tab — UX

### 6.1 Purpose
Personal archive of every scanned track. Data source for matchmaking vector.

### 6.2 States

**Populated state**
- Flat list, reverse chronological (newest first).
- Each row: small album art, title + artist, 2 property chips, relative timestamp.
- Tapping a row opens the **same slide-up results sheet** used in Capture — full reuse of that component.
- Rows are simple and minimal. No decorative elements.

**Empty state**
- Centered text: "No scans yet."
- Supporting text: "Scan your first track to start your sonic archive."
- Large button: navigates to Capture tab.

**Date grouping**
- If entries span multiple days, insert date headers (Today, Yesterday, This Week).

### 6.3 Key Interactions
- Scroll through list.
- Tap row → open analysis sheet (identical to Capture results).
- Sheet dismissal same as Capture (drag down).

---

## 7. Common Interaction Patterns

### 7.1 Results Sheet / Analysis Modal
Used for post-scan capture, history details, and trending discovery:
- Elements reveal in staggered sequence.
- Handle bar or close button for dismissal.
- Background dim/blur when active.

### 7.2 BPM Haptic Pulse
After track identification, a green indicator pulses at the track's BPM. Haptic feedback fires with each pulse. Only activates post-identification — ensure the OS recording session has fully terminated before firing to bypass iOS Taptic engine restrictions.

### 7.3 Staggered Reveal
When content appears, elements reveal in sequence rather than all at once. Each section waits briefly after the previous one. This communicates that analysis is happening and gives the UI a sense of depth.

### 7.4 Swipe Gesture (Matchmaking)
Cards follow the finger in real time during a swipe. A movement threshold determines whether the swipe commits (past threshold) or cancels (springs back). Haptic at commit moment.

---

## 8. Visual Identity

### 8.1 Aesthetic
**Modern Dark Cinema + Precision Lab Instrument.**
- Deep void black backgrounds — infinite depth, OLED black.
- Surface elements are nearly black with micro-lift from the void.
- Glass-like edges — elements are separated by faint translucent borders, not shadows.
- Data visualizations are the primary visual element. When the app is not showing data, it communicates readiness and calm.

### 8.2 Color Logic
Three accent colors, each mapped to one domain. They never overlap roles:
- **Purple** — sonic profile matching, semantic archetypes, mood classification. Used for acoustic properties that relate to feeling and qualitative matching.
- **Cyan** — audio signal, waveform, frequency. Used for acoustic measurements, energy, danceability.
- **Green** — heartbeat, pulse, positive confirmation. Used exclusively for BPM indicator and match confirmation.

Background: deep black with two elevated darkness levels for surfaces and sheets.
Text: bright white for primary, muted gray for secondary, dim gray for tertiary.
Borders: ultra-fine translucent white — barely visible, just enough to separate.

### 8.3 Typography Logic
- **Display and headers:** A single bold grotesque font with tight letter-spacing and uppercase treatment for labels. Technical and cool — reads like instrumentation labels.
- **Measurements and numbers:** A monospace font for all numeric values. Tabular figures prevent layout shift. Using monospace signals "this is measured data."
- **Body text:** The same grotesque font at regular weight for descriptions and qualitative content.

No font serves a decorative role. Every typographic choice communicates precision.

### 8.4 Motion Philosophy
- Animations exist to communicate cause and effect, not to decorate.
- Content appears in response to user action, never unprompted.
- Staggered reveals make the UI feel like analysis is unfolding.
- Spring-based motion for natural, physical feel.
- Swipe and drag provide real-time visual feedback.
- Dismissals are faster than appearances.

---

## 9. UX Anti-Patterns

| Pattern | Problem | Replace With |
|---------|---------|--------------|
| Emojis as interface icons | Inconsistent across platforms, informal | Vector icon set |
| Full-white surfaces | Destroys dark immersion | Deep surfaces with glass edges |
| Charts that are decorative rather than readable | Hides the data | Horizontal labeled bars with precise values |
| Music streaming aesthetics | Misleading — this is not a player | Lab instrument / data visualization identity |
| Skeleton loading screens | Over-engineered, adds visual noise | Staggered content reveal |
| Toast notifications for success | Unnecessary interruption | Visual feedback built into the interaction |
| Floating action buttons | Ambiguous purpose in this context | Primary action is always the centered ring on Capture |

---

## 10. Edge Cases & States Coverage

Every screen handles:
- **Loading** — Never show a blank screen or frozen state. The UI always indicates progress through motion (ring pulse, content stagger).
- **Empty** — Never show an empty list without context. Always explain why and provide an action.
- **Error** — Never show raw error messages. Translate to user-facing language with a recovery path (retry, alternative action).
- **Partial data** — If some data loads but other data fails, show what's available rather than nothing.

---

## 11. Key UX Principles

1. **One primary action per screen.** Capture = scan. Trending = browse. Matchmaking = swipe. History = review.
2. **Data is the interface.** Measurements, bars, and visualizations replace decorative UI elements.
3. **Direct manipulation.** Swipe cards, drag sheets, tap to open modals.
4. **Stay out of the way.** The app is a window into sonic data. The UI frame recedes.
5. **Never guess the user's intent.** Actions are explicit and intentional.
