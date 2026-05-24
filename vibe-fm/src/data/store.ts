import { create } from 'zustand';
import { Track } from '../types';

interface AppState {
  history: Track[];
  addScan: (track: Track) => void;
  userVector: () => [number, number, number, number, number];
  scanCount: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  history: [],
  addScan: (track) => set((s) => ({ history: [track, ...s.history] })),
  scanCount: () => get().history.length,
  userVector: () => {
    const h = get().history;
    if (h.length === 0) return [120, 0.5, 0.3, 0.1, 0.5];
    const sum = h.reduce<[number, number, number, number, number]>(
      (acc, t) => [
        acc[0] + t.tempo,
        acc[1] + t.energy,
        acc[2] + t.acousticness,
        acc[3] + t.instrumentalness,
        acc[4] + t.valence,
      ],
      [0, 0, 0, 0, 0],
    );
    return [sum[0] / h.length, sum[1] / h.length, sum[2] / h.length, sum[3] / h.length, sum[4] / h.length];
  },
}));
