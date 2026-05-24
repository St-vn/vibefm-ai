# Trending Charts (Real Data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Trending tab's handpicked mock tracks with real Spotify top-charting data scraped from kworb.net, enriched maximally (acoustic features + archetype + album art), stored in a NEW `charts.json` that is separate from the profile/matchmaking mock data.

**Architecture:** A new standalone Python script `fetch_charts.py` scrapes kworb.net for Canada-daily (Local/Montreal) and Global-daily Spotify rankings, enriches each track via FreqBlog (acoustic features) → Gemini (archetype + description) → iTunes Search API (album art, free/no-key), and writes `assets/data/charts.json`. The Trending tab is repointed from `mock_tracks.json` to `charts.json`. `mock_tracks.json` stays untouched and continues to provide profile/matchmaking context. The Track shape is reused so no UI component changes are needed beyond the import swap.

**Tech Stack:** Python 3 (requests, beautifulsoup4) for the scraper; existing React Native Trending tab. No new app dependencies. iTunes Search API for album art (public, keyless). FreqBlog + OpenRouter/Gemini reused from existing seed.py with graceful random fallback when keys absent.

---

## CRITICAL CONTEXT (read before Task 1)

1. **charts.json is SEPARATE from mock data.** `mock_tracks.json` (handpicked: Devil in a New Dress, Supernatural, etc.) stays as profile/matchmaking context. `mock_profiles.json` (30 + 6 VIP) stays. The NEW `charts.json` feeds Trending ONLY. Do not overwrite or delete the mock files.

2. **kworb provides title + artist + rank only.** No album art, no acoustic features. Enrichment chain fills the rest: FreqBlog (features) → Gemini (archetype + description) → iTunes Search (album art). Each has a graceful fallback so the script never crashes mid-run.

3. **kworb HTML is brittle.** Artist and title are welded in one `<td>` joined by ` - ` (space-hyphen-space). Split with `split(' - ', 1)` to survive hyphenated names ("Jay-Z"). Wrap every row parse in try/except and DROP failed rows rather than crash.

4. **Canada = Local/Montreal.** kworb has no city granularity. `ca_daily.html` is labeled "LOCAL · MONTREAL" in the UI (Montreal is in Canada — honest enough for a demo). Global from `spotify/global_daily.html`.

5. **Track shape must match `src/types/index.ts` exactly.** charts.json entries are full `Track` objects (same interface the UI already renders). The `location` field is `"Montreal"` for Canada-chart rows, `"Global"` for global rows — this is what the Trending sectioning filters on.

6. **The app is at `C:\Users\megas\Documents\GitHub\HTM2026\vibe-fm`.** Run all `npx`/`npm` commands from there. The Python script lives at the repo root next to the existing `seed.py`.

---

## File Structure

```
vibe-fm/
├── fetch_charts.py              # NEW — kworb scraper + enrichment → charts.json
├── assets/data/
│   ├── charts.json              # NEW — real chart Track objects (Trending source)
│   ├── mock_tracks.json         # UNTOUCHED — profile/matchmaking context
│   ├── mock_profiles.json       # UNTOUCHED
│   └── sonic_profiles.json      # UNTOUCHED — archetypes (read by fetch_charts.py)
└── app/(tabs)/trending.tsx      # MODIFY — import charts.json not mock_tracks.json
```

---

## Test Strategy

Lean, matching the existing project. The risky logic in `fetch_charts.py` is the **kworb row parser** (brittle HTML → title/artist/rank). That gets a pure-function unit test in Python. Everything else (HTTP calls, enrichment) is verified by running the script and inspecting output. The Trending repoint is verified by typecheck + bundle + a one-line shape assertion.

Log any skipped safeguard in `vibe-fm/OMITTED.md`.

---

## Task 1: kworb row parser (TDD, Python)

**Files:**
- Create: `vibe-fm/fetch_charts.py`
- Test: `vibe-fm/test_fetch_charts.py`

- [ ] **Step 1: Write the failing test**

Create `vibe-fm/test_fetch_charts.py`:
```python
from fetch_charts import parse_artist_title

def test_simple_split():
    assert parse_artist_title("The Weeknd - Blinding Lights") == ("The Weeknd", "Blinding Lights")

def test_hyphenated_artist():
    # Only the FIRST ' - ' (space-hyphen-space) splits; hyphen inside a name survives.
    assert parse_artist_title("Jay-Z - 99 Problems") == ("Jay-Z", "99 Problems")

def test_hyphen_in_title():
    assert parse_artist_title("Artist - Song - Remix") == ("Artist", "Song - Remix")

def test_no_delimiter_returns_none():
    assert parse_artist_title("MalformedRowNoSeparator") is None

def test_empty_returns_none():
    assert parse_artist_title("") is None
```

- [ ] **Step 2: Run test — verify it fails**

Run (from `vibe-fm/`): `python -m pytest test_fetch_charts.py -v`
Expected: FAIL — `ImportError: cannot import name 'parse_artist_title'` (or ModuleNotFound).
(If pytest absent: `pip install pytest`.)

- [ ] **Step 3: Implement the parser**

Create `vibe-fm/fetch_charts.py`:
```python
import json
import os
import random
import re
import sys

import requests
from bs4 import BeautifulSoup

SONIC_PROFILES_PATH = os.path.join("assets", "data", "sonic_profiles.json")
OUTPUT_PATH = os.path.join("assets", "data", "charts.json")

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
FREQBLOG_KEY = os.environ.get("FREQBLOG_API_KEY", "")

KWORB_CA = "https://kworb.net/spotify/country/ca_daily.html"
KWORB_GLOBAL = "https://kworb.net/spotify/global_daily.html"


def parse_artist_title(text):
    """Split a kworb 'Artist - Title' cell. Returns (artist, title) or None.

    Splits on the FIRST ' - ' (space-hyphen-space) so hyphenated artist names
    like 'Jay-Z' survive. Title may itself contain ' - ' (e.g. '... - Remix').
    """
    if not text:
        return None
    parts = re.split(r"\s-\s", text.strip(), maxsplit=1)
    if len(parts) != 2:
        return None
    artist, title = parts[0].strip(), parts[1].strip()
    if not artist or not title:
        return None
    return (artist, title)
```

- [ ] **Step 4: Run test — verify it passes**

Run: `python -m pytest test_fetch_charts.py -v`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add vibe-fm/fetch_charts.py vibe-fm/test_fetch_charts.py
git commit -m "feat: kworb artist/title parser with tests"
```

---

## Task 2: kworb chart fetch + row extraction

**Files:**
- Modify: `vibe-fm/fetch_charts.py`

- [ ] **Step 1: Add the chart fetcher**

Append to `vibe-fm/fetch_charts.py`:
```python
def fetch_chart(url, location, limit=10):
    """Fetch a kworb chart page, parse rows into (rank, artist, title, location) tuples.

    kworb tables: the track cell is welded 'Artist - Title'. Different kworb pages
    put it in different columns, so we scan each row's cells for the first one that
    splits cleanly via parse_artist_title.
    """
    print(f"[*] Fetching {location} chart: {url}")
    rows = []
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"[!] Failed to fetch {url}: {e}")
        return rows

    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table")
    if not table:
        print(f"[!] No table found on {url}")
        return rows

    body = table.find("tbody") or table
    rank = 0
    for tr in body.find_all("tr"):
        if len(rows) >= limit:
            break
        try:
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            parsed = None
            for cell in cells:
                parsed = parse_artist_title(cell)
                if parsed:
                    break
            if not parsed:
                continue
            rank += 1
            artist, title = parsed
            rows.append({"rank": rank, "artist": artist, "title": title, "location": location})
        except Exception:
            # Drop the bad row, keep scraping (kworb DOM is brittle).
            continue

    print(f"[+] {location}: parsed {len(rows)} rows")
    return rows
```

- [ ] **Step 2: Verify it runs (live, may print 0 if kworb blocks)**

Run (from `vibe-fm/`):
```bash
python -c "from fetch_charts import fetch_chart, KWORB_CA; print(fetch_chart(KWORB_CA, 'Montreal', 3))"
```
Expected: prints a list of up to 3 dicts with `rank/artist/title/location`, OR an empty list with a `[!] Failed` message if kworb is unreachable. Either is acceptable — Task 5 handles the empty case with a fallback.

- [ ] **Step 3: Commit**

```bash
git add vibe-fm/fetch_charts.py
git commit -m "feat: kworb chart row fetcher with brittle-row drop"
```

---

## Task 3: Enrichment — features, archetype, album art

**Files:**
- Modify: `vibe-fm/fetch_charts.py`

- [ ] **Step 1: Add FreqBlog feature lookup with random fallback**

Append to `vibe-fm/fetch_charts.py`:
```python
def get_features(title, artist):
    if FREQBLOG_KEY:
        try:
            r = requests.get(
                "https://api.freqblog.com/lookup",
                params={"track": title, "artist": artist},
                headers={"X-API-Key": FREQBLOG_KEY},
                timeout=10,
            )
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            print(f"[!] FreqBlog failed for {title}: {e}")
    return {
        "bpm": round(random.uniform(80, 175), 1),
        "energy": round(random.uniform(0.2, 0.99), 2),
        "valence": round(random.uniform(0.1, 0.95), 2),
        "danceability": round(random.uniform(0.3, 0.95), 2),
        "acousticness": round(random.uniform(0.0, 0.8), 2),
        "instrumentalness": round(random.uniform(0.0, 0.5), 2),
        "speechiness": round(random.uniform(0.03, 0.4), 2),
        "key": random.randint(0, 11),
        "mood": random.choice(["Euphoric", "Melancholic", "Aggressive", "Chill", "Tense", "Uplifting"]),
        "genre": random.choice(["Pop", "Hip-Hop", "R&B", "Electronic", "Indie", "Dance"]),
    }
```

- [ ] **Step 2: Add Gemini archetype/description with fallback**

Append:
```python
def get_gemini_analysis(features, title, artist, sonic_profiles):
    if OPENROUTER_KEY:
        try:
            payload = {
                "model": "google/gemini-2.5-flash",
                "response_format": {"type": "json_object"},
                "reasoning": {"exclude": True},
                "messages": [{
                    "role": "user",
                    "content": (
                        f"Track: {title} by {artist}. "
                        f"Acoustic data: {json.dumps(features)}. "
                        f"Sonic archetypes: {json.dumps(sonic_profiles)}. "
                        "Return ONLY JSON: "
                        '{"qualitativeDescription": "2-3 sentences on sonic texture and emotional character", '
                        '"sonicProfile": {"name": "matched archetype name", "tags": ["tag1", "tag2"]}}'
                    ),
                }],
            }
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"},
                json=payload,
                timeout=20,
            )
            if r.status_code == 200:
                return json.loads(r.json()["choices"][0]["message"]["content"])
        except Exception as e:
            print(f"[!] Gemini failed for {title}: {e}")
    profile = random.choice(sonic_profiles)
    return {
        "qualitativeDescription": f"{title} by {artist} delivers a distinctive sonic character with compelling acoustic texture.",
        "sonicProfile": profile,
    }
```

- [ ] **Step 3: Add iTunes album-art lookup (keyless) with fallback**

Append:
```python
def get_album_art(title, artist):
    """iTunes Search API — public, no key. Returns a 300x300 art URL or a placeholder."""
    try:
        r = requests.get(
            "https://itunes.apple.com/search",
            params={"term": f"{artist} {title}", "media": "music", "limit": 1},
            timeout=10,
        )
        if r.status_code == 200:
            results = r.json().get("results", [])
            if results and results[0].get("artworkUrl100"):
                # Upscale the 100x100 to 300x300 by URL convention.
                return results[0]["artworkUrl100"].replace("100x100", "300x300")
    except Exception as e:
        print(f"[!] iTunes art failed for {title}: {e}")
    seed = re.sub(r"[^a-z0-9]", "", f"{artist}{title}".lower())[:20] or "track"
    return f"https://picsum.photos/seed/{seed}/300/300"
```

- [ ] **Step 4: Verify enrichment functions run**

Run (from `vibe-fm/`):
```bash
python -c "from fetch_charts import get_album_art; print(get_album_art('Blinding Lights', 'The Weeknd'))"
```
Expected: an `https://...` URL (iTunes `mzstatic.com` art if reachable, else a picsum placeholder URL). No crash.

- [ ] **Step 5: Commit**

```bash
git add vibe-fm/fetch_charts.py
git commit -m "feat: chart enrichment (features, archetype, album art) with fallbacks"
```

---

## Task 4: Assemble Track objects + write charts.json

**Files:**
- Modify: `vibe-fm/fetch_charts.py`

- [ ] **Step 1: Add the Track assembler**

Append:
```python
def build_track(row, sonic_profiles):
    """Turn a kworb row + enrichment into a full Track object matching src/types/index.ts."""
    title, artist = row["title"], row["artist"]
    f = get_features(title, artist)
    g = get_gemini_analysis(f, title, artist, sonic_profiles)
    art = get_album_art(title, artist)
    return {
        "id": f"chart-{row['location'].lower()}-{row['rank']:02d}",
        "title": title,
        "artist": artist,
        "album": f"{title} (Single)",
        "albumArt": art,
        "tempo": f.get("bpm", 120),
        "energy": f.get("energy", 0.7),
        "valence": f.get("valence", 0.5),
        "danceability": f.get("danceability", 0.6),
        "acousticness": f.get("acousticness", 0.1),
        "instrumentalness": f.get("instrumentalness", 0.05),
        "speechiness": f.get("speechiness", 0.1),
        "key": f.get("key", 0),
        "mode": 1,
        "microGenre": f.get("genre", "Pop"),
        "moodLabel": f.get("mood", "Uplifting"),
        "qualitativeDescription": g["qualitativeDescription"],
        "sonicProfile": g["sonicProfile"],
        "location": row["location"],
        "scannedAt": "",
    }
```

Note: `scannedAt` is empty for chart tracks (they were never "scanned"). The Track type marks it required, but the Trending UI does not render it — only History uses relative time, and chart tracks never enter History. Leaving it `""` keeps the shape valid.

- [ ] **Step 2: Add the main entrypoint**

Append:
```python
def main():
    if not os.path.exists(SONIC_PROFILES_PATH):
        print(f"[!] Missing {SONIC_PROFILES_PATH}. Run from the vibe-fm/ directory.")
        sys.exit(1)
    with open(SONIC_PROFILES_PATH, "r", encoding="utf-8") as fp:
        sonic_profiles = json.load(fp)

    ca_rows = fetch_chart(KWORB_CA, "Montreal", limit=10)
    global_rows = fetch_chart(KWORB_GLOBAL, "Global", limit=10)
    all_rows = ca_rows + global_rows

    if not all_rows:
        print("[!] No chart rows scraped (kworb unreachable). Writing nothing — keeping existing charts.json.")
        sys.exit(2)

    tracks = []
    for i, row in enumerate(all_rows):
        print(f"  [{i + 1}/{len(all_rows)}] {row['location']} #{row['rank']}: {row['title']} — {row['artist']}")
        tracks.append(build_track(row, sonic_profiles))

    with open(OUTPUT_PATH, "w", encoding="utf-8") as fp:
        json.dump(tracks, fp, indent=2)
    print(f"[+] Wrote {len(tracks)} chart tracks to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit**

```bash
git add vibe-fm/fetch_charts.py
git commit -m "feat: assemble chart Track objects and write charts.json"
```

---

## Task 5: Seed charts.json (run the script, or fallback seed)

**Files:**
- Create: `vibe-fm/assets/data/charts.json`

- [ ] **Step 1: Run the script**

Run (from `vibe-fm/`):
```bash
pip install requests beautifulsoup4
python fetch_charts.py
```
Expected: prints progress per track, writes `assets/data/charts.json` with up to 20 tracks (10 Montreal/Canada + 10 Global). If kworb is unreachable it exits code 2 without writing — in that case do Step 2.

- [ ] **Step 2: If kworb failed — write a minimal valid fallback so the app compiles**

ONLY if Step 1 exited without writing. Create `vibe-fm/assets/data/charts.json`:
```json
[
  {
    "id": "chart-montreal-01",
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "album": "Blinding Lights (Single)",
    "albumArt": "https://picsum.photos/seed/blindinglights/300/300",
    "tempo": 171,
    "energy": 0.73,
    "valence": 0.33,
    "danceability": 0.51,
    "acousticness": 0.0,
    "instrumentalness": 0.0,
    "speechiness": 0.06,
    "key": 1,
    "mode": 1,
    "microGenre": "Pop",
    "moodLabel": "Euphoric",
    "qualitativeDescription": "A relentless synthwave pulse drives icy retro textures over a propulsive beat.",
    "sonicProfile": { "name": "Euphoric Rave", "tags": ["energetic", "synthetic", "driving"] },
    "location": "Montreal",
    "scannedAt": ""
  },
  {
    "id": "chart-global-01",
    "title": "Espresso",
    "artist": "Sabrina Carpenter",
    "album": "Espresso (Single)",
    "albumArt": "https://picsum.photos/seed/espresso/300/300",
    "tempo": 104,
    "energy": 0.69,
    "valence": 0.72,
    "danceability": 0.78,
    "acousticness": 0.12,
    "instrumentalness": 0.0,
    "speechiness": 0.05,
    "key": 5,
    "mode": 1,
    "microGenre": "Pop",
    "moodLabel": "Uplifting",
    "qualitativeDescription": "Bright, danceable pop with a glossy hook and a warm, confident groove.",
    "sonicProfile": { "name": "Atmospheric Pop", "tags": ["cinematic", "spacious"] },
    "location": "Global",
    "scannedAt": ""
  }
]
```

- [ ] **Step 3: Verify the output shape**

Run (from `vibe-fm/`):
```bash
node -e "const c=require('./assets/data/charts.json'); console.log('count', c.length); const t=c[0]; const req=['id','title','artist','albumArt','tempo','energy','valence','danceability','acousticness','instrumentalness','speechiness','key','mode','microGenre','moodLabel','qualitativeDescription','sonicProfile','location']; const missing=req.filter(k=>!(k in t)); console.log('missing keys:', missing.length?missing:'none'); console.log('locations', [...new Set(c.map(x=>x.location))])"
```
Expected: `count` ≥ 2, `missing keys: none`, `locations` includes `Montreal` and `Global`.

- [ ] **Step 4: Commit**

```bash
git add vibe-fm/assets/data/charts.json
git commit -m "feat: seed charts.json with real chart data"
```

---

## Task 6: Repoint Trending to charts.json

**Files:**
- Modify: `vibe-fm/app/(tabs)/trending.tsx`

- [ ] **Step 1: Swap the import**

In `vibe-fm/app/(tabs)/trending.tsx`, change the data import line:
```tsx
import tracks from '../../assets/data/mock_tracks.json';
```
to:
```tsx
import tracks from '../../assets/data/charts.json';
```
Leave everything else unchanged — the sectioning (`location === 'Montreal'` → Local, else Global, plus the energy-sorted "By Sonic Property" slice) works identically because charts.json uses the same Track shape and the same `location` values.

- [ ] **Step 2: Typecheck**

Run (from `vibe-fm/`): `npx tsc --noEmit`
Expected: EXIT 0, no errors. (charts.json matches the Track shape, so the `tracks as Track[]` cast holds.)

- [ ] **Step 3: Verify the bundle builds**

Run (from `vibe-fm/`):
```bash
npx expo export --platform ios --output-dir /tmp/charts-verify --clear 2>&1 | grep -iE "bundled|error|failed"
```
Expected: a `iOS Bundled ... modules` line, no `error`/`failed`. Then `rm -rf /tmp/charts-verify`.

- [ ] **Step 4: Commit**

```bash
git add "vibe-fm/app/(tabs)/trending.tsx"
git commit -m "feat: point Trending at real chart data (charts.json)"
```

---

## Task 7: Update OMITTED.md + .gitignore note

**Files:**
- Modify: `vibe-fm/OMITTED.md`

- [ ] **Step 1: Log the data-source separation + scraper brittleness**

Append to `vibe-fm/OMITTED.md`:
```markdown
## Trending charts (real data)
- Trending now reads assets/data/charts.json (real kworb Spotify charts), NOT mock_tracks.json.
- mock_tracks.json + mock_profiles.json remain as profile/matchmaking context — separate concern.
- charts.json regenerated by fetch_charts.py (kworb scrape + FreqBlog/Gemini/iTunes enrichment).
- BRITTLENESS: kworb HTML can change without notice; fetch_charts.py drops unparseable rows and exits code 2 (writing nothing) if the whole scrape fails — existing charts.json is preserved. Re-run fetch_charts.py to refresh.
- Canada daily chart is labeled "LOCAL · MONTREAL" (kworb has no city granularity).
- Album art via iTunes Search API (keyless); picsum placeholder if iTunes misses.
- Enrichment uses random feature fallback when FREQBLOG_API_KEY / OPENROUTER_API_KEY absent — chart tracks still render, values are plausible-but-fake without keys.
```

- [ ] **Step 2: Commit**

```bash
git add vibe-fm/OMITTED.md
git commit -m "docs: log trending chart data source and scraper caveats"
```

---

## Self-Review

**Spec coverage:**
- Real top-charting data for Trending → Tasks 1–5 (kworb scrape + enrich → charts.json) ✓
- Charting data SEPARATE from mock data → new charts.json; mock_tracks/profiles untouched (Task 6 swaps import only) ✓
- Maximalist enrichment (features + archetype + album art) → Task 3 (FreqBlog + Gemini + iTunes) ✓
- Canada = Local/Montreal → Task 4 main() fetches ca_daily as "Montreal", global as "Global" ✓
- Trending repoint → Task 6 ✓

**Placeholder scan:** No TBD/TODO. Every code step shows full code. Fallbacks are concrete (random feature dict, picsum URL, minimal charts.json). kworb-failure path is explicit (exit code 2, preserve existing file).

**Type consistency:** `parse_artist_title` returns `(artist, title)` tuple — used consistently in Tasks 1, 2, 4. `build_track` emits every field in `src/types/index.ts` Track (verified against the interface: id, title, artist, album, albumArt, tempo, energy, valence, danceability, acousticness, instrumentalness, speechiness, key, mode, microGenre, moodLabel, qualitativeDescription, sonicProfile, location, scannedAt). `location` values `"Montreal"`/`"Global"` match Trending's existing filter in `trending.tsx`. The Trending import swap (Task 6) is the only app change and needs no other edits because the shape is identical.

**Note on the hybrid-scan change already made (not part of this plan):** `src/data/mockTrack.ts` `USE_MOCK_SCAN` was already updated to `FORCE_MOCK || !HAS_SHAZAM_KEY`, and `.env` set `EXPO_PUBLIC_USE_MOCK_SCAN=false`. That governs the Capture *scan* path and is independent of this Trending-charts work.
