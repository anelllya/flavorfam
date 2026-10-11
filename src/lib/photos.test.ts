import { describe, expect, it } from 'vitest';
import { parsePhotos } from './photos';

const ids = ['banitsa', 'waffles'];
const webp = 'data:image/webp;base64,UklGRg==';

describe('parsePhotos', () => {
  it('keeps valid photos for known recipes', () => {
    expect(parsePhotos({ banitsa: webp }, ids)).toEqual({ banitsa: webp });
  });

  it('drops unknown recipes, non-images and non-strings', () => {
    expect(parsePhotos({ ghost: webp, waffles: 'data:text/html;base64,PGgxPg==', banitsa: 42 }, ids)).toEqual({});
  });

  it('drops oversized photos', () => {
    expect(parsePhotos({ banitsa: webp + 'A'.repeat(4_000_000) }, ids)).toEqual({});
  });

  it('treats anything that is not an object as no photos', () => {
    expect(parsePhotos(null, ids)).toEqual({});
    expect(parsePhotos([webp], ids)).toEqual({});
    expect(parsePhotos('nope', ids)).toEqual({});
  });
});
