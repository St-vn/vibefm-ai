import json, random, requests, os
from datetime import datetime, timezone

def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    parts = line.strip().split("=", 1)
                    if len(parts) == 2:
                        key, value = parts
                        os.environ[key] = value

load_env()
OPENROUTER_KEY = os.environ.get("EXPO_PUBLIC_OPENROUTER_API_KEY", "")
FREQBLOG_KEY   = os.environ.get("EXPO_PUBLIC_FREQBLOG_API_KEY", "")

# Core tracks for the demo - all songs in mock_profiles.json
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
    ("God's Plan", "Drake"),
    ("Billie Jean", "Michael Jackson"),
    ("Thriller", "Michael Jackson"),
    ("Beat It", "Michael Jackson"),
    ("Kill Bill", "SZA"),
    ("Starboy", "The Weeknd"),
    ("Nights", "Frank Ocean"),
    ("bad guy", "Billie Eilish"),
    ("EARFQUAKE", "Tyler the Creator"),
    ("HUMBLE.", "Kendrick Lamar"),
    ("Blinding Lights", "The Weeknd"),
]

# Ground truth metadata for core songs to ensure accuracy
FIXED_METADATA = {
    "Devil in a New Dress": {"genre": "Chipmunk Soul", "mood": "Grandiose", "bpm": 158, "archetype": "Neo-Soul Drift"},
    "Supernatural": {"genre": "New Jack Swing", "mood": "Nostalgic", "bpm": 109, "archetype": "Meridian Club"},
    "Kills": {"genre": "Drill", "mood": "Aggressive", "bpm": 150, "archetype": "Hard Trap"},
    "90210": {"genre": "Psychedelic Rap", "mood": "Haunting", "bpm": 162, "archetype": "Dark R&B"},
    "Do the Dance": {"genre": "French House", "mood": "Upbeat", "bpm": 130, "archetype": "Meridian Club"},
    "delusionalism": {"genre": "Japanese Shoegaze", "mood": "Driving", "bpm": 188, "archetype": "Japanese Shoegaze"},
    "Runaway": {"genre": "Art Pop", "mood": "Melancholic", "bpm": 85, "archetype": "Atmospheric Pop"},
    "Flashing Lights": {"genre": "Electro-Rap", "mood": "Sophisticated", "bpm": 90, "archetype": "Atmospheric Pop"},
    "Hotline Bling": {"genre": "Dancehall-lite", "mood": "Rhythmic", "bpm": 135, "archetype": "Meridian Club"},
    "Passionfruit": {"genre": "Tropical House", "mood": "Chill", "bpm": 112, "archetype": "Meridian Club"},
    "Ditto": {"genre": "Baltimore Club", "mood": "Dreamy", "bpm": 134, "archetype": "Meridian Club"},
    "Hype Boy": {"genre": "Future Bass", "mood": "Energetic", "bpm": 100, "archetype": "Meridian Club"},
    "Perfect Night": {"genre": "2-step Garage", "mood": "Groovy", "bpm": 136, "archetype": "Meridian Club"},
    "ANTIFRAGILE": {"genre": "Reggaeton", "mood": "Powerful", "bpm": 105, "archetype": "Hard Trap"},
    "God's Plan": {"genre": "Pop-Rap", "mood": "Triumphant", "bpm": 77, "archetype": "Hard Trap"},
    "Billie Jean": {"genre": "Post-Disco", "mood": "Tense", "bpm": 117, "archetype": "Meridian Club"},
    "Thriller": {"genre": "Horror-Pop", "mood": "Theatrical", "bpm": 118, "archetype": "Meridian Club"},
    "Beat It": {"genre": "Dance-Rock", "mood": "Defiant", "bpm": 139, "archetype": "Industrial Grime"},
    "Kill Bill": {"genre": "Boom Bap", "mood": "Vengeful", "bpm": 89, "archetype": "Neo-Soul Drift"},
    "Starboy": {"genre": "Electropop", "mood": "Moody", "bpm": 186, "archetype": "Dark R&B"},
    "Nights": {"genre": "Alternative R&B", "mood": "Reflective", "bpm": 176, "archetype": "Neo-Soul Drift"},
    "bad guy": {"genre": "Electropop", "mood": "Sarcastic", "bpm": 135, "archetype": "Dark R&B"},
    "EARFQUAKE": {"genre": "Neo-Soul", "mood": "Yearning", "bpm": 80, "archetype": "Bedroom Pop"},
    "HUMBLE.": {"genre": "Hardcore Hip Hop", "mood": "Confident", "bpm": 150, "archetype": "Hard Trap"},
    "Blinding Lights": {"genre": "Synth-pop", "mood": "Euphoric", "bpm": 171, "archetype": "Euphoric Rave"},
}

VIP_PROFILES = [
  {
    "userId": "vip-001",
    "displayName": "Kanye West",
    "avatar": "local:kanye.jpg",
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
    "avatar": "local:drake.jpg",
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
    "avatar": "local:stvn.jpg",
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
    "avatar": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.nCQ7biGbw5RG2MkWqxBtWAHaKX%3Fpid%3DApi&f=1&ipt=6dbf1a30b21e651af2d27b090f39039879667374f7a77a29e1589bc7bad1f9f4",
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
    "avatar": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fpreview.redd.it%2F230701-le-sserafim-weverse-update-chaewon-v0-5dr3fxw42a9b1.jpg%3Fwidth%3D1333%26format%3Dpjpg%26auto%3Dwebp%26s%3D2403bdf219316ef5b51a0c4d7f915d67ee93fa73&f=1&nofb=1&ipt=6402b93192ec25456dde3f71caa3b6809dca916c60482c9ee60892147c7032a9",
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
    "avatar": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2F76%2F66%2Fb6%2F7666b632afc1c497e580eaab75b431bc.jpg&f=1&nofb=1&ipt=02dd4bc957caef23e7253353945a8b090f9779e6ff4bb5f1c46cdd2d8c62a281",
    "location": "Los Angeles",
    "vector": [118.0, 0.88, 0.1, 0.02, 0.85],
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
    {"name": "Japanese Shoegaze", "tags": ["ethereal", "distorted", "dynamic"]},
]

def get_features(title, artist):
    if FREQBLOG_KEY:
        try:
            r = requests.get(
                "https://api.freqblog.com/lookup",
                params={"track": title, "artist": artist},
                headers={"X-API-Key": FREQBLOG_KEY},
                timeout=10
            )
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            print(f"Error fetching features for {title}: {e}")
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
    # Check if we have fixed data for this title
    fixed = FIXED_METADATA.get(title)
    if fixed:
        # We still might want qualitative description from Gemini, but we'll force the profile
        pass

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
                analysis = json.loads(content)
                # Override profile if fixed exists
                if fixed:
                    profile_name = fixed["archetype"]
                    profile_obj = next((p for p in SONIC_PROFILES if p["name"] == profile_name), None)
                    if profile_obj:
                        analysis["sonicProfile"] = profile_obj
                return analysis
        except Exception as e:
            print(f"Error fetching analysis for {title}: {e}")
    
    # Fallback
    profile_name = fixed["archetype"] if (fixed and "archetype" in fixed) else random.choice(SONIC_PROFILES)["name"]
    profile = next((p for p in SONIC_PROFILES if p["name"] == profile_name), random.choice(SONIC_PROFILES))
    
    return {
        "qualitativeDescription": f"{title} by {artist} delivers a distinctive sonic character with compelling acoustic texture.",
        "sonicProfile": profile
    }

def get_itunes_metadata(title, artist):
    """iTunes Search API — public, no key. Returns art, appleMusicUrl, and generated spotify link."""
    metadata = {
        "art": "https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452",
        "appleMusicUrl": f"https://music.apple.com/search?term={requests.utils.quote(f'{artist} {title}')}",
        "spotifyUrl": f"https://open.spotify.com/search/{requests.utils.quote(f'{artist} {title}')}"
    }
    try:
        r = requests.get(
            "https://itunes.apple.com/search",
            params={"term": f"{artist} {title}", "media": "music", "limit": 1},
            timeout=10,
        )
        if r.status_code == 200:
            results = r.json().get("results", [])
            if results:
                res = results[0]
                if res.get("artworkUrl100"):
                    metadata["art"] = res["artworkUrl100"].replace("100x100", "300x300")
                if res.get("trackViewUrl"):
                    metadata["appleMusicUrl"] = res["trackViewUrl"]
    except Exception as e:
        print(f"iTunes metadata failed for {title}: {e}")
    return metadata

def get_val(d, key, fallback):
    v = d.get(key)
    return fallback if v is None else v

def build_tracks(existing_tracks):
    # Map by (title, artist) to avoid duplicates
    tracks_map = {(t["title"], t["artist"]): t for t in existing_tracks}
    
    final_tracks = []
    
    # Process core songs first
    for i, (title, artist) in enumerate(CORE_SONGS):
        fixed = FIXED_METADATA.get(title)
        cached = tracks_map.get((title, artist))
        
        # Check if cache is still valid (no nulls and matches fixed metadata if present)
        is_valid = cached and all(cached.get(k) is not None for k in ["energy", "valence", "speechiness", "tempo", "appleMusicUrl"])
        if fixed and cached:
            # Force update if BPM is significantly different or genre/mood changed
            if abs(cached.get("tempo", 0) - fixed["bpm"]) > 5:
                is_valid = False
            if cached.get("microGenre") != fixed["genre"]:
                is_valid = False
            if cached.get("moodLabel") != fixed["mood"]:
                is_valid = False
            if cached.get("sonicProfile", {}).get("name") != fixed["archetype"]:
                is_valid = False

        if is_valid:
            print(f"[Core] {title} — {artist} (found in cache)")
            final_tracks.append(cached)
        else:
            print(f"[Core] {title} — {artist} ({'fetching...' if not cached else 'updating metadata...'})")
            f = get_features(title, artist)
            
            # Apply fixed overrides
            if fixed:
                f["bpm"] = fixed["bpm"]
                f["genre"] = fixed["genre"]
                f["mood"] = fixed["mood"]
            
            g = get_gemini_analysis(f, title, artist)
            m = get_itunes_metadata(title, artist)
            
            track = {
                "id": f"track-{len(final_tracks)+1:03d}",
                "title": title,
                "artist": artist,
                "album": f"{title} (Single)",
                "albumArt": m["art"],
                "tempo": get_val(f, "bpm", 120),
                "energy": get_val(f, "energy", 0.7),
                "valence": get_val(f, "valence", 0.5),
                "danceability": get_val(f, "danceability", 0.6),
                "acousticness": get_val(f, "acousticness", 0.1),
                "instrumentalness": get_val(f, "instrumentalness", 0.05),
                "speechiness": get_val(f, "speechiness", 0.1),
                "key": get_val(f, "key", 0),
                "mode": 1,
                "microGenre": f.get("genre") or "Pop",
                "moodLabel": f.get("mood") or "Uplifting",
                "qualitativeDescription": g["qualitativeDescription"],
                "sonicProfile": g["sonicProfile"],
                "location": random.choice(["Montreal", "Seoul", "Toronto", "Los Angeles", "Global"]),
                "scannedAt": datetime.now(timezone.utc).isoformat(),
                "appleMusicUrl": m["appleMusicUrl"],
                "spotifyUrl": m["spotifyUrl"],
            }
            final_tracks.append(track)

    return final_tracks

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
        artists = ["Kanye West", "NewJeans", "Chief Keef", "Travis Scott", "ILLIT", "Mass of the Fermenting Dregs", "Drake", "LE SSERAFIM"]
        songs = [s[0] for s in CORE_SONGS]
        
        while len(final_profiles) < 30:
            i = len(final_profiles)
            final_profiles.append({
                "userId": f"user-{i+1:03d}",
                "displayName": random.choice(names) + f" {random.randint(1,99)}",
                "avatar": "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpapers.com%2Fimages%2Fhd%2Fbasic-default-pfp-pxi77qv5o0zuz8j3.jpg&f=1&nofb=1&ipt=062a758d87f9dbb62839dda904eda513d0dc75c91b22c862b9eb98b550165f40",
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
