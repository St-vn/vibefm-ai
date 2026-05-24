type Vec5 = [number, number, number, number, number];

const TEMPO_MAX = 200;

export function normalizeVector(v: Vec5): Vec5 {
  return [v[0] / TEMPO_MAX, v[1], v[2], v[3], v[4]];
}

export function cosineSimilarityPercent(a: Vec5, b: Vec5): number {
  const na = normalizeVector(a);
  const nb = normalizeVector(b);
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < 5; i++) {
    dot += na[i] * nb[i];
    magA += na[i] * na[i];
    magB += nb[i] * nb[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  const sim = dot / denom;
  return Math.round(Math.max(0, Math.min(1, sim)) * 100);
}
