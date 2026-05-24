import { parseShazam } from '../src/lib/shazam';
import { parseFreqblog } from '../src/lib/freqblog';
import { parseGemini } from '../src/lib/gemini';

describe('parseShazam', () => {
  it('extracts title, artist, album art from a v2 detect response', () => {
    const raw = {
      track: {
        key: '12345',
        title: 'Blinding Lights',
        subtitle: 'The Weeknd',
        images: { coverart: 'https://img/cover.jpg' },
        sections: [{ metadata: [{ title: 'Album', text: 'After Hours' }] }],
      },
    };
    const r = parseShazam(raw);
    expect(r).toEqual({
      id: '12345',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      albumArt: 'https://img/cover.jpg',
    });
  });

  it('returns null when no track present (HTTP 204 / no match)', () => {
    expect(parseShazam({})).toBeNull();
  });
});

describe('parseFreqblog', () => {
  it('maps bpm->tempo and copies acoustic fields with defaults', () => {
    const raw = { bpm: 171, energy: 0.73, valence: 0.33, danceability: 0.51,
      acousticness: 0, instrumentalness: 0, speechiness: 0.06, key: 1, mood: 'Euphoric', genre: 'Synthwave' };
    const r = parseFreqblog(raw);
    expect(r.tempo).toBe(171);
    expect(r.moodLabel).toBe('Euphoric');
    expect(r.microGenre).toBe('Synthwave');
    expect(r.mode).toBe(1);
  });

  it('fills safe defaults for missing fields', () => {
    const r = parseFreqblog({});
    expect(r.tempo).toBe(120);
    expect(r.energy).toBe(0.5);
    expect(r.microGenre).toBe('Unknown');
  });
});

describe('parseGemini', () => {
  it('parses a JSON-string content into description + profile', () => {
    const content = JSON.stringify({
      qualitativeDescription: 'Bright and driving.',
      sonicProfile: { name: 'Euphoric Rave', tags: ['energetic', 'synthetic'] },
    });
    const r = parseGemini(content);
    expect(r.qualitativeDescription).toBe('Bright and driving.');
    expect(r.sonicProfile.name).toBe('Euphoric Rave');
  });

  it('returns graceful defaults on malformed JSON', () => {
    const r = parseGemini('not json {{{');
    expect(r.qualitativeDescription).toContain('unavailable');
    expect(r.sonicProfile.name).toBe('Unclassified');
  });
});
