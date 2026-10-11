import { describe, expect, it } from 'vitest';
import { sourceLink } from './source';

describe('sourceLink', () => {
  it('turns bare domains and full URLs into links named after the site', () => {
    expect(sourceLink('recepti.gotvach.bg/r-58545')).toEqual({ href: 'https://recepti.gotvach.bg/r-58545', label: 'recepti.gotvach.bg' });
    expect(sourceLink('https://www.sallysbakingaddiction.com/triple-chocolate-layer-cake/')).toEqual({
      href: 'https://www.sallysbakingaddiction.com/triple-chocolate-layer-cake/', label: 'sallysbakingaddiction.com',
    });
  });

  it('leaves plain text and unsafe schemes as text', () => {
    for (const s of ["Mama's notebook", 'javascript:alert(1)', 'data:text/html,hi', 'mailto:me@example.com', '', 'ftp://x.org']) {
      expect(sourceLink(s), s).toBeUndefined();
    }
  });
});
