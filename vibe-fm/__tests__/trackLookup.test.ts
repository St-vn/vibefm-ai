import { findTrackByTitle } from '../src/lib/trackLookup';

describe('findTrackByTitle', () => {
  it('returns a full Track for a title that exists in mock_tracks', () => {
    const t = findTrackByTitle('Devil in a New Dress');
    expect(t).not.toBeNull();
    expect(t!.title).toBe('Devil in a New Dress');
    expect(t!.artist).toBe('Kanye West');
    expect(typeof t!.tempo).toBe('number');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(findTrackByTitle('  devil in a new dress  ')).not.toBeNull();
  });

  it('returns null for a title with no matching track', () => {
    expect(findTrackByTitle("God’s Plan")).toBeNull();
    expect(findTrackByTitle('Totally Made Up Song')).toBeNull();
  });
});
