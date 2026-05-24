import json, random, requests, os
from datetime import datetime, timezone

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
FREQBLOG_KEY   = os.environ.get("FREQBLOG_API_KEY", "")

# Core tracks and gap-fillers for the demo
CORE_SONGS = [
    ("Devil in a New Dress", "Kanye West"),
    ("Supernatural", "NewJeans"),
    ("Kills", "Chief Keef"),
    ("90210", "Travis Scott"),
    ("Do the Dance", "ILLIT"),
    ("delusionalism", "Mass of the Fermenting Dregs"),
    ("Runaway", "Kanye West"),
    ("Flashing Lights", "Kanye West"),
    ("Hotline Bling", "Drake"),
    ("Passionfruit", "Drake"),
    ("Ditto", "NewJeans"),
    ("Hype Boy", "NewJeans"),
    ("Perfect Night", "LE SSERAFIM"),
    ("ANTIFRAGILE", "LE SSERAFIM"),
]

# Random pool for padding to 20 tracks
RANDOM_POOL = [
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
]

VIP_PROFILES = [
  {
    "userId": "vip-001",
    "displayName": "Kanye West",
    "location": "Los Angeles",
    "vector": [88.0, 0.78, 0.12, 0.01, 0.52],
    "topMicroGenres": ["Maximalist Hip-Hop", "Soul Sample", "Progressive Rap"],
    "topArtists": ["Kanye West", "Jay-Z", "Travis Scott"],
    "topSongs": ["Devil in a New Dress", "Runaway", "Flashing Lights"],
    "scanCount": 77
  },
  {
    "userId": "vip-002",
    "displayName": "Drake",
    "location": "Toronto",
    "vector": [115.0, 0.55, 0.22, 0.04, 0.38],
    "topMicroGenres": ["Dark R&B", "Pop Rap", "Melodic Trap"],
    "topArtists": ["Drake", "The Weeknd", "Lil Wayne"],
    "topSongs": ["God's Plan", "Hotline Bling", "Passionfruit"],
    "scanCount": 64
  },
  {
    "userId": "vip-003",
    "displayName": "stvn",
    "location": "Montreal",
    "vector": [135.0, 0.82, 0.08, 0.15, 0.61],
    "topMicroGenres": ["Math Rock", "Jersey Club", "Alternative Hip-Hop"],
    "topArtists": ["Kanye West", "NewJeans", "Mass of the Fermenting Dregs"],
    "topSongs": ["delusionalism", "Supernatural", "90210", "Devil in a New Dress", "Kills", "Do the Dance"],
    "scanCount": 33
  },
  {
    "userId": "vip-004",
    "displayName": "Minji",
    "location": "Seoul",
    "vector": [130.0, 0.76, 0.18, 0.02, 0.72],
    "topMicroGenres": ["Bedroom Pop", "Jersey Club", "2-Step"],
    "topArtists": ["NewJeans", "ILLIT", "Dua Lipa"],
    "topSongs": ["Supernatural", "Ditto", "Hype Boy"],
    "scanCount": 55
  },
  {
    "userId": "vip-005",
    "displayName": "Chaewon",
    "location": "Seoul",
    "vector": [122.0, 0.85, 0.05, 0.01, 0.78],
    "topMicroGenres": ["Dance-Pop", "Afrobeats", "Hyperpop"],
    "topArtists": ["LE SSERAFIM", "NewJeans", "Billie Eilish"],
    "topSongs": ["Perfect Night", "ANTIFRAGILE", "Supernatural"],
    "scanCount": 59
  },
  {
    "userId": "vip-006",
    "displayName": "Michael Jackson",
    "location": "Los Angeles",
    "vector": [118.0, 0.88, 0.10, 0.02, 0.85],
    "topMicroGenres": ["Pop", "Funk", "New Jack Swing"],
    "topArtists": ["Michael Jackson", "Quincy Jones", "Prince"],
    "topSongs": ["Billie Jean", "Thriller", "Beat It"],
    "scanCount": 99
  }
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

def build_tracks(existing_tracks):
    # Map by (title, artist) to avoid duplicates
    tracks_map = {(t["title"], t["artist"]): t for t in existing_tracks}
    
    final_tracks = []
    
    # Process core songs first
    for i, (title, artist) in enumerate(CORE_SONGS):
        if (title, artist) in tracks_map:
            print(f"[Core] {title} — {artist} (found in cache)")
            final_tracks.append(tracks_map[(title, artist)])
        else:
            print(f"[Core] {title} — {artist} (fetching...)")
            f = get_features(title, artist)
            g = get_gemini_analysis(f, title, artist)
            track = {
                "id": f"track-{len(final_tracks)+1:03d}",
                "title": title,
                "artist": artist,
                "album": f"{title} (Single)",
                "albumArt": f"https://picsum.photos/seed/{random.randint(1,1000)}/300/300",
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
                "location": random.choice(["Montreal", "Seoul", "Toronto", "Los Angeles", "Global"]),
                "scannedAt": datetime.now(timezone.utc).isoformat(),
            }
            final_tracks.append(track)

    # Pad with existing or new random tracks to hit 20
    remaining = 20 - len(final_tracks)
    if remaining > 0:
        # First use existing tracks that aren't core
        for (title, artist), track in tracks_map.items():
            if (title, artist) not in [(t[0], t[1]) for t in CORE_SONGS]:
                final_tracks.append(track)
                remaining -= 1
                if remaining == 0: break
        
        # If still need more, use RANDOM_POOL
        if remaining > 0:
            for title, artist in RANDOM_POOL:
                if (title, artist) not in [(t["title"], t["artist"]) for t in final_tracks]:
                    print(f"[Padding] {title} — {artist} (fetching...)")
                    f = get_features(title, artist)
                    g = get_gemini_analysis(f, title, artist)
                    track = {
                        "id": f"track-{len(final_tracks)+1:03d}",
                        "title": title,
                        "artist": artist,
                        "album": f"{title} (Single)",
                        "albumArt": f"https://picsum.photos/seed/{random.randint(1,1000)}/300/300",
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
                        "location": "Global",
                        "scannedAt": datetime.now(timezone.utc).isoformat(),
                    }
                    final_tracks.append(track)
                    remaining -= 1
                    if remaining == 0: break

    # Final slice to ensure exactly 20
    return final_tracks[:20]

def build_profiles(existing_profiles):
    # Clear old profiles matching VIP IDs or Display Names
    vip_ids = {p["userId"] for p in VIP_PROFILES}
    vip_names = {p["displayName"] for p in VIP_PROFILES}
    
    filtered_existing = [
        p for p in existing_profiles 
        if p["userId"] not in vip_ids and p["displayName"] not in vip_names
    ]
    
    # Prepend VIP profiles
    final_profiles = list(VIP_PROFILES)
    
    # Backfill to 30
    needed = 30 - len(final_profiles)
    
    # Use filtered existing profiles first
    final_profiles.extend(filtered_existing[:needed])
    
    # If still need more, generate random ones
    if len(final_profiles) < 30:
        names = ["Alex M", "Jamie R", "Sam K", "Riley B", "Jordan T", "Morgan P", "Casey L"]
        cities = ["Montreal", "Toronto", "New York", "London", "Paris", "Los Angeles", "Berlin", "Tokyo"]
        # Blend new artists/tracks into the pool
        artists = ["Kanye West", "NewJeans", "Chief Keef", "Travis Scott", "ILLIT", "Mass of the Fermenting Dregs", "Drake", "LE SSERAFIM"]
        songs = [s[0] for s in CORE_SONGS]
        
        while len(final_profiles) < 30:
            i = len(final_profiles)
            final_profiles.append({
                "userId": f"user-{i+1:03d}",
                "displayName": random.choice(names) + f" {random.randint(1,99)}",
                "location": random.choice(cities),
                "vector": [
                    round(random.uniform(70, 175), 1),
                    round(random.uniform(0.2, 0.99), 2),
                    round(random.uniform(0.0, 0.8), 2),
                    round(random.uniform(0.0, 0.5), 2),
                    round(random.uniform(0.1, 0.95), 2),
                ],
                "topMicroGenres": ["Pop", "Rap", "Indie"],
                "topArtists": random.sample(artists, 3),
                "topSongs": random.sample(songs, 3),
                "scanCount": random.randint(5, 80),
            })
            
    return final_profiles[:30]

if __name__ == "__main__":
    tracks_path = "assets/data/mock_tracks.json"
    profiles_path = "assets/data/mock_profiles.json"
    sonic_path = "assets/data/sonic_profiles.json"

    # Load existing if available
    existing_tracks = []
    if os.path.exists(tracks_path):
        with open(tracks_path, "r") as f:
            existing_tracks = json.load(f)

    existing_profiles = []
    if os.path.exists(profiles_path):
        with open(profiles_path, "r") as f:
            existing_profiles = json.load(f)

    print("=== Processing mock_tracks.json ===")
    tracks = build_tracks(existing_tracks)
    os.makedirs(os.path.dirname(tracks_path), exist_ok=True)
    with open(tracks_path, "w") as f:
        json.dump(tracks, f, indent=2)
    print(f"✓ {len(tracks)} tracks written")

    print("=== Processing mock_profiles.json ===")
    profiles = build_profiles(existing_profiles)
    with open(profiles_path, "w") as f:
        json.dump(profiles, f, indent=2)
    print(f"✓ {len(profiles)} profiles written")

    print("=== Writing sonic_profiles.json ===")
    with open(sonic_path, "w") as f:
        json.dump(SONIC_PROFILES, f, indent=2)
    print("Done.")
