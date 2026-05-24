interface FreqblogParsed {
  tempo: number; energy: number; valence: number; danceability: number;
  acousticness: number; instrumentalness: number; speechiness: number;
  key: number; mode: number; moodLabel: string; microGenre: string;
}

export function parseFreqblog(raw: any): FreqblogParsed {
  const n = (v: any, d: number) => (typeof v === 'number' ? v : d);
  return {
    tempo: n(raw?.bpm, 120),
    energy: n(raw?.energy, 0.5),
    valence: n(raw?.valence, 0.5),
    danceability: n(raw?.danceability, 0.5),
    acousticness: n(raw?.acousticness, 0.2),
    instrumentalness: n(raw?.instrumentalness, 0.1),
    speechiness: n(raw?.speechiness, 0.1),
    key: n(raw?.key, 0),
    mode: raw?.mode === 0 ? 0 : 1,
    moodLabel: raw?.mood ?? 'Unknown',
    microGenre: raw?.genre ?? 'Unknown',
  };
}

export async function lookupFeatures(title: string, artist: string): Promise<FreqblogParsed> {
  const url = `https://api.freqblog.com/lookup?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
  const res = await fetch(url, { headers: { 'X-API-Key': process.env.EXPO_PUBLIC_FREQBLOG_API_KEY ?? '' } });
  if (!res.ok) return parseFreqblog({});
  return parseFreqblog(await res.json());
}
