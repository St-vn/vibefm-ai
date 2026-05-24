interface ShazamParsed { id: string; title: string; artist: string; album: string; albumArt: string; }

export function parseShazam(raw: any): ShazamParsed | null {
  const t = raw?.track;
  if (!t || !t.title) return null;
  let album = '';
  const sections = t.sections ?? [];
  for (const s of sections) {
    const meta = s.metadata ?? [];
    const albumRow = meta.find((m: any) => m.title === 'Album');
    if (albumRow) { album = albumRow.text; break; }
  }
  return {
    id: String(t.key ?? Date.now()),
    title: t.title,
    artist: t.subtitle ?? 'Unknown Artist',
    album: album || t.title,
    albumArt: t.images?.coverart ?? '',
  };
}

export async function detectSong(base64Pcm: string): Promise<ShazamParsed | null> {
  const res = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
      'X-RapidAPI-Key': process.env.EXPO_PUBLIC_RAPIDAPI_KEY ?? '',
      'X-RapidAPI-Host': process.env.EXPO_PUBLIC_RAPIDAPI_HOST ?? 'shazam.p.rapidapi.com',
    },
    body: base64Pcm,
  });
  if (res.status === 204) return null;
  const json = await res.json();
  return parseShazam(json);
}
