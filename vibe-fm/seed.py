import json, random, requests, os
from datetime import datetime, timezone

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
FREQBLOG_KEY   = os.environ.get("FREQBLOG_API_KEY", "")

SONGS = [
    ("Blinding Lights", "The Weeknd"),
    ("HUMBLE.", "Kendrick Lamar"),
    ("bad guy", "Billie Eilish"),
    ("Starboy", "The Weeknd"),
    ("Levitating", "Dua Lipa"),
    ("Peaches", "Justin Bieber"),
    ("Montero", "Lil Nas X"),
    ("drivers license", "Olivia Rodrigo"),
    ("Stay", "The Kid LAROI"),
    ("Good 4 U", "Olivia Rodrigo"),
    ("Industry Baby", "Lil Nas X"),
    ("Heat Waves", "Glass Animals"),
    ("Shivers", "Ed Sheeran"),
    ("Take My Breath", "The Weeknd"),
    ("Ghost", "Justin Bieber"),
    ("Love Story (Taylor's Version)", "Taylor Swift"),
    ("Positions", "Ariana Grande"),
    ("Dynamite", "BTS"),
    ("Watermelon Sugar", "Harry Styles"),
    ("Save Your Tears", "The Weeknd"),
]

SONIC_PROFILES = [
    {"name": "Industrial Grime", "tags": ["distorted", "synthetic", "aggressive"]},
    {"name": "Bedroom Pop", "tags": ["lo-fi", "intimate", "warm"]},
    {"name": "Meridian Club", "tags": ["driving", "rhythmic", "electronic"]},
    {"name": "Euphoric Rave", "tags": ["energetic", "euphoric", "synthetic"]},
    {"name": "Dark R&B", "tags": ["brooding", "smooth", "layered"]},
    {"name": "Hyperpop", "tags": ["glitchy", "maximalist", "digital"]},
    {"name": "Neo-Soul Drift", "tags": ["soulful", "organic", "textured"]},
    {"name": "Atmospheric Pop", "tags": ["cinematic", "spacious", "ethereal"]},
    {"name": "Hard Trap", "tags": ["heavy", "percussive", "dark"]},
    {"name": "Indie Folk", "tags": ["acoustic", "intimate", "natural"]},
]

def get_features(title, artist):
    if FREQBLOG_KEY:
        r = requests.get(
            "https://api.freqblog.com/lookup",
            params={"track": title, "artist": artist},
            headers={"X-API-Key": FREQBLOG_KEY},
            timeout=10
        )
        if r.status_code == 200:
            return r.json()
    # Fallback: plausible random values
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

def get_gemini_analysis(features, title, artist):
    if OPENROUTER_KEY:
        payload = {
            "model": "google/gemini-2.5-flash",
            "response_format": {"type": "json_object"},
            "reasoning": {"exclude": True},
            "messages": [{
                "role": "user",
                "content": (
                    f"Track: {title} by {artist}. "
                    f"Acoustic data: {json.dumps(features)}. "
                    f"Sonic archetypes: {json.dumps(SONIC_PROFILES)}. "
                    "Return ONLY JSON: "
                    '{"qualitativeDescription": "2-3 sentences on sonic texture and emotional character", '
                    '"sonicProfile": {"name": "matched archetype name", "tags": ["tag1", "tag2"]}}'
                )
            }]
        }
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=20
        )
        if r.status_code == 200:
            content = r.json()["choices"][0]["message"]["content"]
            return json.loads(content)
    # Fallback
    profile = random.choice(SONIC_PROFILES)
    return {
        "qualitativeDescription": f"{title} by {artist} delivers a distinctive sonic character with compelling acoustic texture.",
        "sonicProfile": profile
    }

def build_tracks():
    tracks = []
    for i, (title, artist) in enumerate(SONGS):
        print(f"[{i+1}/20] {title} — {artist}")
        f = get_features(title, artist)
        g = get_gemini_analysis(f, title, artist)
        track = {
            "id": f"track-{i+1:03d}",
            "title": title,
            "artist": artist,
            "album": f"{title} (Single)",
            "albumArt": f"https://picsum.photos/seed/{i+1}/300/300",
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
            "location": "Montreal" if i < 10 else "Global",
            "scannedAt": datetime.now(timezone.utc).isoformat(),
        }
        tracks.append(track)
    return tracks

def build_profiles():
    names = [
        "Alex M", "Jamie R", "Sam K", "Riley B", "Jordan T",
        "Morgan P", "Casey L", "Drew N", "Quinn A", "Blake S",
        "Avery F", "Dakota W", "Skyler H", "Reese C", "Finley D",
        "Rowan G", "Peyton V", "Sage O", "River Z", "Phoenix Y",
        "Taylor X", "Hayden I", "Emery J", "Shiloh U", "Lennon E",
        "Harlow Q", "Marlowe T", "Arlo N", "Wren M", "Indigo P",
    ]
    cities = ["Montreal", "Toronto", "New York", "London", "Paris", "Los Angeles", "Berlin", "Tokyo"]
    genres = ["Jersey Club", "Dark R&B", "Hyperpop", "Bedroom Pop", "Neo-Soul", "Hard Trap", "Indie Folk", "Electronic"]
    artists = ["The Weeknd", "Daft Punk", "Kendrick Lamar", "Billie Eilish", "Frank Ocean", "SZA", "Tyler the Creator", "Drake"]
    songs = ["Blinding Lights", "Starboy", "HUMBLE.", "bad guy", "Nights", "Kill Bill", "EARFQUAKE", "God's Plan"]

    profiles = []
    for i, name in enumerate(names):
        profiles.append({
            "userId": f"user-{i+1:03d}",
            "displayName": name,
            "location": random.choice(cities),
            "vector": [
                round(random.uniform(70, 175), 1),
                round(random.uniform(0.2, 0.99), 2),
                round(random.uniform(0.0, 0.8), 2),
                round(random.uniform(0.0, 0.5), 2),
                round(random.uniform(0.1, 0.95), 2),
            ],
            "topMicroGenres": random.sample(genres, 3),
            "topArtists": random.sample(artists, 3),
            "topSongs": random.sample(songs, 3),
            "scanCount": random.randint(5, 80),
        })
    return profiles

if __name__ == "__main__":
    print("=== Building mock_tracks.json ===")
    tracks = build_tracks()
    with open("mock_tracks.json", "w") as f:
        json.dump(tracks, f, indent=2)
    print(f"✓ {len(tracks)} tracks written")

    print("=== Building mock_profiles.json ===")
    profiles = build_profiles()
    with open("mock_profiles.json", "w") as f:
        json.dump(profiles, f, indent=2)
    print(f"✓ {len(profiles)} profiles written")

    print("=== Writing sonic_profiles.json ===")
    with open("sonic_profiles.json", "w") as f:
        json.dump(SONIC_PROFILES, f, indent=2)
    print("Done.")
