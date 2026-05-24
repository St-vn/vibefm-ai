import { cosineSimilarityPercent, normalizeVector } from '../src/lib/similarity';

describe('cosineSimilarityPercent', () => {
  it('returns 100 for identical vectors', () => {
    const v: [number, number, number, number, number] = [120, 0.8, 0.1, 0.05, 0.6];
    expect(cosineSimilarityPercent(v, v)).toBe(100);
  });

  it('returns a lower score for divergent vectors', () => {
    const a: [number, number, number, number, number] = [60, 0.1, 0.9, 0.8, 0.1];
    const b: [number, number, number, number, number] = [180, 0.95, 0.0, 0.0, 0.95];
    const score = cosineSimilarityPercent(a, b);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(100);
  });

  it('handles a zero vector without NaN', () => {
    const zero: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    const b: [number, number, number, number, number] = [120, 0.5, 0.5, 0.5, 0.5];
    expect(Number.isNaN(cosineSimilarityPercent(zero, b))).toBe(false);
  });

  it('normalizes tempo onto 0-1 scale alongside other dims', () => {
    expect(normalizeVector([120, 0.5, 0.5, 0.5, 0.5])[0]).toBeCloseTo(0.6, 5);
  });
});
