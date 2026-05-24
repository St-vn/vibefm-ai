import { Track } from '../types';
import tracksJson from '../../assets/data/mock_tracks.json';

const tracks = tracksJson as Track[];

const byTitle = new Map<string, Track>(
  tracks.map((t) => [t.title.trim().toLowerCase(), t]),
);

export function findTrackByTitle(title: string): Track | null {
  return byTitle.get(title.trim().toLowerCase()) ?? null;
}
