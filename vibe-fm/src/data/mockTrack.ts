import { Track } from '../types';

export const MOCK_TRACK: Track = {
  id: 'mock-001',
  title: 'Blinding Lights',
  artist: 'The Weeknd',
  album: 'After Hours',
  albumArt: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
  tempo: 171,
  energy: 0.73,
  valence: 0.33,
  danceability: 0.51,
  acousticness: 0.0,
  instrumentalness: 0.0,
  speechiness: 0.06,
  key: 1,
  mode: 1,
  microGenre: 'Synthwave',
  moodLabel: 'Euphoric',
  qualitativeDescription:
    'A relentless synthwave pulse drives icy retro textures over a propulsive beat. The track balances melancholic vocals against bright neon synths, landing somewhere between nostalgia and adrenaline.',
  sonicProfile: { name: 'Euphoric Rave', tags: ['energetic', 'synthetic', 'driving'] },
  scannedAt: new Date().toISOString(),
};

// Hybrid: use mock when explicitly forced, key absent, OR running on web.
// RapidAPI/Shazam blocks browser-origin CORS — real scan only works on native.
import { Platform } from 'react-native';
const FORCE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_SCAN === 'true';
const HAS_SHAZAM_KEY = !!process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const IS_WEB = Platform.OS === 'web';
export const USE_MOCK_SCAN = FORCE_MOCK || !HAS_SHAZAM_KEY || IS_WEB;
