import { describe, expect, it } from 'vitest';
import { NOTES_MAX, aiUrl, buildPrompt, parseAiReply, repairJson, trimNotes } from './recipeImport';
import curlyReply from './fixtures/ai-reply-curly-quotes.txt?raw';

const reply = {
  title: 'Shakshuka', category: 'breakfast', servings: 2, timeMinutes: 25,
  ingredients: [
    { name: 'Eggs', qty: 4, unit: 'pcs' },
    { name: 'Chopped tomatoes (tin)', qty: '400', unit: 'grams' },
    { name: 'Olive oil', qty: 2, unit: 'tablespoons' },
    { name: 'Salt', unit: 'pinch' },
  ],
  steps: ['Soften the onion.', '  ', 'Crack in the eggs.'],
  notes: 'Serve with bread.', source: 'https://example.com/shakshuka',
};

describe('parseAiReply', () => {
  it('reads a clean reply into a draft', () => {
    const d = parseAiReply(JSON.stringify(reply));
    expect(d).toMatchObject({ title: 'Shakshuka', category: 'breakfast', servings: '2', time: '25', notes: 'Serve with bread.', source: 'https://example.com/shakshuka' });
    expect(d?.lines.map((l) => [l.name, l.qty, l.unit])).toEqual([
      ['Eggs', '4', 'pcs'], ['Chopped tomatoes (tin)', '400', 'g'], ['Olive oil', '2', 'tbsp'], ['Salt', '', 'pinch'],
    ]);
    expect(d?.steps.map((s) => s.text)).toEqual(['Soften the onion.', 'Crack in the eggs.']);
  });

  it('finds the JSON inside prose and code fences', () => {
    const wrapped = `Sure! Here it is:\n\`\`\`json\n${JSON.stringify(reply, null, 2)}\n\`\`\`\nEnjoy.`;
    expect(parseAiReply(wrapped)?.title).toBe('Shakshuka');
  });

  it('falls back safely on unknown category, unit and bad numbers', () => {
    const d = parseAiReply(JSON.stringify({ ...reply, category: 'brunch', servings: -1, timeMinutes: 'soon', ingredients: [{ name: 'Flour', qty: 1, unit: 'cups' }] }));
    expect(d).toMatchObject({ category: 'main', servings: '4', time: '' });
    expect(d?.lines[0]).toMatchObject({ name: 'Flour', qty: '1', unit: 'pcs' });
  });

  it('drops a source that is not a web link', () => {
    expect(parseAiReply(JSON.stringify({ ...reply, source: 'javascript:alert(1)' }))?.source).toBe('');
  });

  it('reads a real reply whose quotes were turned into smart quotes (run 3 bug report)', () => {
    const d = parseAiReply(curlyReply);
    expect(d).toMatchObject({ title: 'Triple Chocolate Layer Cake', category: 'baking', servings: '12', time: '240' });
    expect(d?.lines).toHaveLength(16);
    expect(d?.lines[5]).toMatchObject({ name: 'Salt', qty: '1.25', unit: 'tsp' });
    expect(d?.steps).toHaveLength(19);
    // The real reply's notes ran to ~1,500 characters; only the opening sentences are kept.
    expect(d?.notes.startsWith('Cocoa: use natural (not Dutch-process) cocoa in the cake;')).toBe(true);
    expect(d?.notes.length).toBeLessThanOrEqual(NOTES_MAX);
    expect(d?.notes.endsWith('.')).toBe(true);
    expect(d?.source).toBe('https://sallysbakingaddiction.com/triple-chocolate-layer-cake/');
  });

  it('repairs only structural smart quotes, not quotes inside the text', () => {
    const fixed = repairJson('{ “title”: “Mum’s “best” cake”, “steps”: [“Mix.”, ], }');
    expect(JSON.parse(fixed)).toEqual({ title: 'Mum’s “best” cake', steps: ['Mix.'] });
  });

  it('keeps short notes as they are and cuts long ones at a sentence', () => {
    expect(trimNotes('Use ripe tomatoes.')).toBe('Use ripe tomatoes.');
    const long = 'First sentence. ' + 'Filler words go here. '.repeat(30);
    const trimmed = trimNotes(long);
    expect(trimmed.startsWith('First sentence.')).toBe(true);
    expect(trimmed.length).toBeLessThanOrEqual(NOTES_MAX);
    expect(trimNotes('x'.repeat(400))).toHaveLength(NOTES_MAX);
  });

  it('rejects replies that are not a recipe', () => {
    for (const text of ['', 'I cannot open links.', '{"foo": 1}', '{not json}', '[1,2]']) expect(parseAiReply(text)).toBeUndefined();
  });

  it('still gives an editable draft when ingredients or steps are missing', () => {
    const d = parseAiReply('{"title": "Toast"}');
    expect(d?.lines).toHaveLength(1);
    expect(d?.steps).toHaveLength(1);
  });
});

describe('buildPrompt / aiUrl', () => {
  it('puts the link, units and known ingredients in the request', () => {
    const p = buildPrompt(' https://example.com/r ', ['Eggs', 'Flour']);
    expect(p).toContain('https://example.com/r');
    expect(p).toContain('g, ml, pcs, tbsp, tsp, pinch');
    expect(p).toContain('Eggs, Flour');
    expect(p).toContain('at most 2 short sentences');
    expect(p).not.toMatch(/\{\w+\}/);
  });

  it('pre-fills ChatGPT and Claude, opens Gemini plain', () => {
    expect(aiUrl('chatgpt', 'hi there')).toBe('https://chatgpt.com/?q=hi%20there');
    expect(aiUrl('claude', 'hi')).toBe('https://claude.ai/new?q=hi');
    expect(aiUrl('gemini', 'hi')).toBe('https://gemini.google.com/app');
  });

  it('leaves very long requests out of the URL', () => {
    expect(aiUrl('claude', 'x'.repeat(8000))).toBe('https://claude.ai/new');
  });
});
