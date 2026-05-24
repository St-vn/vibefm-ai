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
KWORB_GLOBAL = "https://kworb.net/spotify/country/global_daily.html"


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
            cells = [td.get_text(separator=" ", strip=True) for td in tr.find_all("td")]
            parsed = None
            for cell in cells:
                parsed = parse_artist_title(cell)
                if parsed:
                    break
            if not parsed:
                continue
            rank += 1
            artist, title = parsed  # kworb format: "Artist - Title"
            rows.append({"rank": rank, "artist": artist, "title": title, "location": location})
        except Exception:
            continue

    print(f"[+] {location}: parsed {len(rows)} rows")
    return rows


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
                return results[0]["artworkUrl100"].replace("100x100", "300x300")
    except Exception as e:
        print(f"[!] iTunes art failed for {title}: {e}")
    seed = re.sub(r"[^a-z0-9]", "", f"{artist}{title}".lower())[:20] or "track"
    return f"https://picsum.photos/seed/{seed}/300/300"


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
