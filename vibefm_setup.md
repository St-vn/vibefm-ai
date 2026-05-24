# vibe.fm Setup & Pre-batch Playbook
**Version:** 1.0 (Hackathon Deploy)
**Status:** Production-ready — strict environment and data pipeline specifications

This document provides the exhaustive, step-by-step technical orchestration required to initialize the vibe.fm environment and execute the pre-batch data pipeline. This setup is designed for 100% developer control in a hackathon/demo environment.

---

## 1. Environment Initialization Playbook

The vibe.fm analysis pipeline requires a specific orchestration of Python dependencies. **Strict sequencing is mandatory** to prevent NumPy 2.x from breaking the Essentia module.

**Note for Windows Users:** The `essentia` library is not natively available via pip for Windows. It is highly recommended to run this environment within **WSL (Ubuntu)** or a Linux-based dev container to ensure compatibility with the MIR toolchain.

### Conda Bootstrapping Flow
Run these commands in order. Do not use a single `pip install -r requirements.txt`.

```bash
# 1. Create and activate the environment
conda create -n vibe-fx python=3.11 -y
conda activate vibe-fx

# 2. Pin NumPy and install core ML primitives FIRST
pip install "numpy<2.0" torch==2.2.2 torchaudio==2.2.2 --index-url https://download.pytorch.org/whl/cu118

# 3. Install Audio MIR and Stem Separation tools
pip install librosa cjm-demucs-v4 essentia==2.1b6.dev1438 yt-dlp beautifulsoup4 requests

# 4. Install FFmpeg (System dependency)
# MacOS: brew install ffmpeg
# Windows: choco install ffmpeg
# Ubuntu: sudo apt install ffmpeg

# 5. Verify Essentia (If this fails, NumPy 2.x leaked in)
python -c "import essentia.standard as es; print('Essentia Loaded Successfully')"
```

---

## 2. API Credential Onboarding

Create a `.env` file in the project root. All keys must be active for the pre-batch script and frontend to function.

```env
# --- OpenRouter (Gemini Flash 2.5) ---
OPENROUTER_API_KEY=your_openrouter_key_here

# --- RapidAPI (Shazam & Spotify Charts) ---
# Get from: rapidapi.com/apidojo/api/shazam
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=shazam.p.rapidapi.com

# --- FreqBlog API (Spotify Audio Features Replacement) ---
# Get from: freqblog.com
FREQBLOG_API_KEY=your_freqblog_key_here

# --- DeepSeek (NLP Tasks) ---
DEEPSEEK_API_KEY=your_deepseek_key_here
```

---

## 3. Automated Processing Pipeline (`extract_prebatch.py`)

This script orchestrates the full extraction flow: download, normalize, separate, and analyze.

```python
import os
import sys
import json
import base64
import subprocess
import requests
import numpy as np
import librosa
import essentia.standard as es
from bs4 import BeautifulSoup

# Configuration
SONGS_JSON_PATH = "songs.json"
SONIC_PROFILES_PATH = "sonic_profiles.json"
TEMP_DIR = "temp_audio"
STEMS_DIR = "separated/htdemucs"

def download_track(url, track_id):
    """Downloads audio via yt-dlp and normalizes to 44.1kHz 16-bit WAV."""
    print(f"[*] Downloading {track_id}...")
    raw_path = os.path.join(TEMP_DIR, f"{track_id}_raw.m4a")
    wav_path = os.path.join(TEMP_DIR, f"{track_id}.wav")
    
    # Download
    subprocess.run([
        "yt-dlp", "-x", "--audio-format", "m4a", 
        "-o", raw_path, url
    ], check=True)
    
    # Normalize via FFmpeg
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_path, 
        "-ar", "44100", "-ac", "2", "-acodec", "pcm_s16le", 
        wav_path
    ], check=True)
    
    return wav_path

def separate_stems(wav_path):
    """Executes Demucs separation."""
    print(f"[*] Separating stems...")
    subprocess.run([
        "python", "-m", "demucs.separate", "-n", "htdemucs", wav_path
    ], check=True)
    
    # Returns path to stems dir
    track_name = os.path.basename(wav_path).replace(".wav", "")
    return os.path.join(STEMS_DIR, track_name)

def get_shazam_payload(wav_path):
    """
    Strips the 44-byte WAV header to avoid HTTP 204 Silence.
    Shazam RapidAPI requires raw PCM bytes.
    """
    with open(wav_path, "rb") as f:
        f.seek(44)  # Skip Header
        raw_pcm = f.read()
    return base64.b64encode(raw_pcm).decode("utf-8")

def extract_features(stems_dir, master_wav):
    """MIR analysis via Librosa and Essentia."""
    print(f"[*] Extracting features...")
    
    # 1. Master Analysis (Essentia)
    loader = es.MonoLoader(filename=master_wav, sampleRate=44100)
    audio = loader()
    key_extractor = es.KeyExtractor()
    key, scale, strength = key_extractor(audio)
    
    # 2. Stem Analysis (Librosa)
    stems = ["bass.wav", "drums.wav", "other.wav", "vocals.wav"]
    stem_energy = {}
    
    for s in stems:
        s_path = os.path.join(stems_dir, s)
        y, sr = librosa.load(s_path, sr=44100)
        stem_energy[s.replace(".wav", "")] = float(np.mean(librosa.feature.rms(y=y)))
        
    return {
        "key": key,
        "mode": 1 if scale == "major" else 0,
        "stem_energy": stem_energy,
        "spectral_centroid": float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    }

def run_pipeline(track_id, url):
    if not os.path.exists(TEMP_DIR): os.makedirs(TEMP_DIR)
    
    wav_path = download_track(url, track_id)
    stems_path = separate_stems(wav_path)
    features = extract_features(stems_path, wav_path)
    shazam_payload = get_shazam_payload(wav_path)
    
    # Final Track Object Construction
    track_data = {
        "id": track_id,
        "features": features,
        "shazam_ready_payload": shazam_payload[:100] + "..." # Truncated for log
    }
    
    print(f"[+] Success: {track_id} processed.")
    return track_data

if __name__ == "__main__":
    # Example usage: python extract_prebatch.py <id> <youtube_url>
    if len(sys.argv) > 2:
        run_pipeline(sys.argv[1], sys.argv[2])
```

---

## 4. Mock Data Seeding Algorithms

### 4.1 Mock Data Seeding (`seed.py`)
The combined `seed.py` script orchestrates the generation of tracks and profiles for the demo environment. It includes a sophisticated merge logic to ensure data consistency without wiping out previous work.

**Merge Logic Highlights:**
1. **Core Tracks:** Explicitly includes 14 curated tracks (e.g., "Devil in a New Dress", "Supernatural") and fetches missing ones via FreqBlog/Gemini APIs.
2. **VIP Profiles:** Injects 6 VIP profiles (Kanye West, Drake, Michael Jackson, etc.) with precise 5D acoustic vectors locked for demo matchmaking.
3. **Data Padding:** Automatically pads tracks to exactly 20 and profiles to exactly 30, blending new artists/tracks into the random pool.

**Run:**
```bash
python seed.py
```
This produces `mock_tracks.json`, `mock_profiles.json`, and `sonic_profiles.json` in the `assets/data/` folder.

---

## 5. Critical Technical Caveats

### Shazam Silent HTTP 204 Avoidance
When sending audio to the Shazam RapidAPI endpoint, you MUST strip the 44-byte native WAV header.
- **Problem:** If the header is included in the base64 payload, the server interprets the header as corrupted audio signal and returns an `HTTP 204 No Content`.
- **Solution:** Always `f.seek(44)` before reading bytes for the `shazam_ready_payload`.

### NumPy Version Conflict (Essentia)
The `essentia` package has a hard dependency on NumPy 1.x. If your environment automatically upgrades to NumPy 2.x (default in recent pip versions), Essentia will crash on import with a `C-API version mismatch`. 
- **Solution:** Always pin `numpy<2.0` and install it before any other package.

### Kworb Joined-Text
Kworb merges artist and title. Example: `<td>Artist Name - Song Title</td>`.
- **Parsing Trap:** If the artist name contains a hyphen (e.g., "The-Dream"), a simple `.split('-')` will break. 
- **Solution:** Use `.split(' - ')` with surrounding spaces to target the delimiter reliably.
