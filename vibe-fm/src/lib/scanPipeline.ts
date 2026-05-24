import { Track } from '../types';
import { detectSong } from './shazam';
import { lookupFeatures } from './freqblog';
import { synthesize } from './gemini';
import { MOCK_TRACK, USE_MOCK_SCAN } from '../data/mockTrack';
import sonicProfiles from '../../assets/data/sonic_profiles.json';

export type ScanResult = { ok: true; track: Track } | { ok: false; reason: string };

export async function runScan(base64Pcm: string): Promise<ScanResult> {
  if (USE_MOCK_SCAN) {
    return { ok: true, track: { ...MOCK_TRACK, scannedAt: new Date().toISOString() } };
  }
  try {
    const id = await detectSong(base64Pcm);
    if (!id) return { ok: false, reason: 'Could not identify' };

    const features = await lookupFeatures(id.title, id.artist).catch(() => null);
    const f = features ?? {
      tempo: 120, energy: 0.5, valence: 0.5, danceability: 0.5, acousticness: 0.2,
      instrumentalness: 0.1, speechiness: 0.1, key: 0, mode: 1, moodLabel: 'Unknown', microGenre: 'Unknown',
    };
    const g = await synthesize(f, sonicProfiles).catch(() => ({
      qualitativeDescription: 'Description unavailable.',
      sonicProfile: { name: 'Unclassified', tags: [] as string[] },
    }));

    const track: Track = {
      id: id.id,
      title: id.title,
      artist: id.artist,
      album: id.album,
      albumArt: id.albumArt,
      tempo: f.tempo, energy: f.energy, valence: f.valence, danceability: f.danceability,
      acousticness: f.acousticness, instrumentalness: f.instrumentalness, speechiness: f.speechiness,
      key: f.key, mode: f.mode, microGenre: f.microGenre, moodLabel: f.moodLabel,
      qualitativeDescription: g.qualitativeDescription, sonicProfile: g.sonicProfile,
      scannedAt: new Date().toISOString(),
    };
    return { ok: true, track };
  } catch (e) {
    return { ok: false, reason: 'Could not identify' };
  }
}
