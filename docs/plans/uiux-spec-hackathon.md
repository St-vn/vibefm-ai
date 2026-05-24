# vibe.fm — UI/UX Spec (Hackathon Sprint)
**Status:** LOCKED — 14h build window. Only what gets built.

---

## 1. Visual Identity (Non-Negotiable)

| Token | Value | Used For |
|-------|-------|----------|
| Background | `#000000` | All screens |
| Surface | `#0D0D0D` | Sheets, cards, modals |
| Surface elevated | `#1A1A1A` | Card interiors |
| Border | `rgba(255,255,255,0.08)` | All separators |
| Accent purple | `#7C3AED` | Sonic profile, archetype, mood tags |
| Accent cyan | `#06B6D4` | Waveform, acoustic bars, audio signal |
| Accent green | `#22C55E` | BPM pulse, match confirm, positive actions |
| Text primary | `#FFFFFF` | Titles, key data |
| Text secondary | `#9CA3AF` | Supporting labels |
| Text tertiary | `#4B5563` | Timestamps, hints |

**Typography:**
- Labels/headers: bold grotesque, tight tracking, UPPERCASE
- All numeric values: monospace font (tabular figures — no layout shift on bar animations)
- Body/descriptions: regular grotesque

**Motion rules:**
- Spring-based everywhere
- Staggered sheet reveal: 80ms delay between each section
- Dismissals faster than appearances
- Waveform ring: slow ambient pulse idle → reactive to mic amplitude during record

---

## 2. Navigation

4-tab bottom bar. Always visible. Labels + icons. Active = cyan underline.
Default tab: Capture.

---

## 3. Capture Tab

**Idle:**
- Full-screen black. Center: waveform ring (thin circle, slow Moti pulse).
- Top: source toggle pill — "Live Mic" / "File Upload"
- Bottom: dim instructional hint text

**Recording:**
- Ring expands/contracts with mic amplitude
- "Listening…" label appears (small, dim)
- No haptics during recording (iOS limitation)

**Result Sheet** (shared component — used here, History, Trending modal):
- Slides up to 75% height. Background dims behind it.
- Drag down to dismiss.
- Staggered reveal order:
  1. Album art + title + artist + BPM (green pulse indicator, monospace number)
  2. Mood tag (filled, purple) + micro-genre tag (outlined, purple)
  3. Horizontal bars: energy, valence, danceability, acousticness, instrumentalness, speechiness. Label left | colored bar | precise value right (monospace, cyan bars)
  4. 2-3 sentence qualitative description (small, dim)
  5. Sonic profile name + tags (purple, bottom)
- Error: compact sheet — "Could not identify" + retry. Show partial data if only some APIs fail.

**BPM Haptic:**
- `setInterval` polls until recording hardware released, then fires `Haptics.impactAsync` at track BPM. Never fires during recording.

---

## 4. Trending Tab

**Layout:**
- 3 section headers: Local (Montreal), Global, By Sonic Property
- GPS badge (city-level). One-time system permission prompt. If denied: show global only.

**Track Row:**
- Rank number | album art thumbnail | title + artist | 2-3 property chips (cyan)
- Tap → Analysis Modal: blurs background, same result sheet content

**Source:** `mock_tracks.json`. Top 10 items flagged `location: "Montreal"`.

---

## 5. Matchmaking Tab

**Gate:** < 3 scans → centered prompt + "Go Scan" button to Capture tab.

**Deck (≥3 scans):**
- One card at a time, next card edge peeking behind
- Card content: colored circle avatar + initials | display name | location | **large mono compatibility %** | shared artists row | top tracks | aligned chips | divergent chips (outlined)
- Swipe right → green flash → fly off right
- Swipe left → fade → slide off left
- Below threshold → spring back
- Haptic at commit

**Source:** `mock_profiles.json` vs user's scan vector.
**Fallback:** Always show closest match — never empty deck.

---

## 6. History Tab

**Populated:**
- Flat reverse-chrono list. Date headers: Today / Yesterday / This Week.
- Row: album art | title + artist | 2 chips | relative timestamp
- Tap → result sheet (same component as Capture)

**Empty:**
- "No scans yet." + "Start your sonic archive." + button → Capture tab

---

## 7. Anti-Patterns — Build None of These

| Don't | Use Instead |
|-------|-------------|
| Emojis as UI icons | Vector icon set |
| White/light surfaces | Deep surfaces with glass edges |
| Skeleton loaders | Staggered content reveal |
| Toast notifications | Visual feedback built into interaction |
| Floating action buttons | Centered ring on Capture |
| Decorative charts | Labeled horizontal bars with exact values |
| Spinner loading indicators | Ring pulse animation |
