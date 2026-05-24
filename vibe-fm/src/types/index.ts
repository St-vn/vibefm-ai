export interface SonicProfile {
  name: string;
  tags: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  tempo: number;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  key: number;
  mode: number;
  microGenre: string;
  moodLabel: string;
  qualitativeDescription: string;
  sonicProfile: SonicProfile;
  location?: string;
  scannedAt: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

export interface UserVector {
  userId: string;
  displayName: string;
  avatar?: string;
  location: string;
  vector: [number, number, number, number, number];
  topMicroGenres: string[];
  topArtists: string[];
  topSongs: string[];
  scanCount: number;
}
