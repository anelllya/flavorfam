import { describe, expect, it } from 'vitest';
import { ingredients, seedRecipes } from '../data';
import { byRecent, inferAisle, emptyDraft, emptyLine, hasErrors, matchIngredient, parseRecipe, recency, toRecipe, validate, type Draft } from './recipeForm';
import { parseState } from './store';

const filled = (): Draft => {
  const d = emptyDraft();
  return {
    ...d, title: 'Garlic eggs',
    lines: [{ ...d.lines[0], name: 'eggs', qty: '3', unit: 'pcs' }, { ...emptyLine(), name: 'Wild garlic', qty: '20', unit: 'g' }],
    steps: [{ ...d.steps[0], text: 'Fry.' }],
  };
};

describe('validate', () => {
  it('reports every missing field on an empty draft', () => {
    const e = validate(emptyDraft());
    expect(e).toMatchObject({ title: 'title', lines: 'noIngredients', steps: 'noSteps' });
    expect(hasErrors(e)).toBe(true);
  });

  it('ignores untouched rows but flags half-filled ones', () => {
    const d = filled();
    d.lines.push(emptyLine());
    expect(hasErrors(validate(d))).toBe(false);
    const half = { ...emptyLine(), name: 'Salt' };
    d.lines.push(half);
    expect(validate(d).lineQty[half.key]).toBe('qty');
  });

  it('rejects zero, negative and fractional servings', () => {
    for (const servings of ['0', '-2', '1.5', '']) expect(validate({ ...filled(), servings }).servings).toBe('servings');
  });
});

describe('toRecipe', () => {
  it('reuses known ingredients by name and creates the rest as custom ones', () => {
    const { recipe, newIngredients } = toRecipe(filled(), ingredients);
    expect(recipe.collection).toBe('mine');
    expect(recipe.ingredients[0].ingredientId).toBe(matchIngredient('Eggs', ingredients)?.id);
    expect(newIngredients).toHaveLength(1);
    expect(newIngredients[0]).toMatchObject({ name: 'Wild garlic', aisle: 'pantry' });
    expect(recipe.ingredients[1].ingredientId).toBe(newIngredients[0].id);
  });

  it('keeps the id when editing', () => {
    expect(toRecipe(filled(), ingredients, 'mine-x').recipe.id).toBe('mine-x');
  });
});

describe('parseRecipe / parseState', () => {
  it('refuses ids that are neither yours nor a seed recipe', () => {
    expect(parseRecipe({ ...seedRecipes[0], id: 'someone-else' }, () => true)).toBeUndefined();
  });

  it('keeps valid user recipes and lets the plan point at them', () => {
    const { recipe, newIngredients } = toRecipe(filled(), ingredients);
    const state = parseState({
      version: 1, checked: [], recipes: [recipe, { id: 'mine-bad' }], customIngredients: newIngredients,
      plan: [{ id: 'p1', day: 'mon', slot: 'dinner', recipeId: recipe.id }, { id: 'p2', day: 'mon', slot: 'lunch', recipeId: 'mine-gone' }],
    });
    expect(state.recipes.map((r) => r.id)).toEqual([recipe.id]);
    expect(state.plan.map((p) => p.id)).toEqual(['p1']);
    expect(state.recipes[0].ingredients).toHaveLength(2);
  });

  it('drops recipe lines whose ingredient is unknown', () => {
    const { recipe } = toRecipe(filled(), ingredients);
    const state = parseState({ version: 1, plan: [], checked: [], recipes: [recipe], customIngredients: [] });
    expect(state.recipes[0].ingredients).toHaveLength(1);
  });

  it('lets a user version replace a seed placeholder, keeping its id and collection', () => {
    const seed = seedRecipes.find((r) => r.draft)!;
    const { recipe } = toRecipe(filled(), ingredients, seed.id);
    expect(recipe).toMatchObject({ id: seed.id, collection: seed.collection });
    expect(recipe.draft).toBeUndefined();
    const state = parseState({ version: 1, checked: [], customIngredients: [], recipes: [recipe],
      plan: [{ id: 'p1', day: 'mon', slot: 'dinner', recipeId: seed.id }] });
    expect(state.recipes[0]).toMatchObject({ id: seed.id, collection: seed.collection, title: 'Garlic eggs' });
    expect(state.plan).toHaveLength(1);
  });

  it('remembers deleted placeholders and drops their plan entries; ignores anything else', () => {
    const draft = seedRecipes.find((r) => r.draft)!;
    const finished = seedRecipes.find((r) => !r.draft)!;
    const state = parseState({ version: 1, checked: [], recipes: [], customIngredients: [],
      deletedSeeds: [draft.id, finished.id, 42, draft.id],
      plan: [{ id: 'p1', day: 'mon', slot: 'dinner', recipeId: draft.id }, { id: 'p2', day: 'mon', slot: 'lunch', recipeId: finished.id }] });
    expect(state.deletedSeeds).toEqual([draft.id]);
    expect(state.plan.map((p) => p.id)).toEqual(['p2']);
  });

  it("lets Mama's recipes be edited, keeping collection and original title whatever the file says", () => {
    const mama = seedRecipes.find((r) => !r.draft && r.originalTitle)!;
    const { recipe } = toRecipe(filled(), ingredients, mama.id);
    expect(recipe).toMatchObject({ id: mama.id, collection: mama.collection, originalTitle: mama.originalTitle });
    const tampered = parseRecipe({ ...recipe, collection: 'mine', originalTitle: 'Fake' }, () => true);
    expect(tampered).toMatchObject({ collection: mama.collection, originalTitle: mama.originalTitle });
  });

  it('accepts files from before recipes existed', () => {
    expect(parseState({ version: 1, plan: [], checked: [] })).toMatchObject({ recipes: [], customIngredients: [], deletedSeeds: [] });
  });
});

describe('byRecent', () => {
  it('puts the latest saved first and keeps untouched seeds in their order after', () => {
    const [a, b, c] = seedRecipes;
    const edited = { ...b, updatedAt: 2000 };
    const mine = { ...c, id: `mine-soup-${(1000).toString(36)}`, collection: 'mine' as const };
    expect(byRecent([a, edited, mine, seedRecipes[3]]).map((r) => r.id)).toEqual([edited.id, mine.id, a.id, seedRecipes[3].id]);
  });

  it('reads the date from older ids and stamps new saves', () => {
    expect(recency({ ...seedRecipes[0], id: `mine-x-${(123456).toString(36)}` })).toBe(123456);
    expect(recency(seedRecipes[0])).toBe(0);
    expect(toRecipe(filled(), ingredients).recipe.updatedAt).toBeGreaterThan(0);
  });
});

describe('inferAisle', () => {
  it('files seasonings together, by unit or by name', () => {
    expect(inferAisle('Espresso powder', 'tsp')).toBe('spices');
    expect(inferAisle('Sea salt', 'g')).toBe('spices');
    expect(inferAisle('Bay leaf', 'pcs')).toBe('spices');
    expect(inferAisle('Chilli flakes', 'g')).toBe('spices');
    expect(inferAisle('Ground black pepper', 'g')).toBe('spices');
  });

  it('does not grab look-alikes', () => {
    for (const [name, unit] of [['Red pepper', 'pcs'], ['Garlic clove', 'pcs'], ['Ground beef', 'g'], ['Dried apricots', 'g'],
      ['Milk powder', 'g'], ['Lettuce leaves', 'g'], ['Fresh thyme', 'g'], ['Oat flakes', 'g']] as const) {
      expect(inferAisle(name, unit), name).toBe('pantry');
    }
  });
});

describe('plan: one dish per slot', () => {
  it('keeps only the last dish when a saved plan has several in one slot', () => {
    const [a, b] = seedRecipes;
    const state = parseState({ version: 1, checked: [], plan: [
      { id: 'p1', day: 'wed', slot: 'lunch', recipeId: a.id },
      { id: 'p2', day: 'wed', slot: 'breakfast', recipeId: a.id },
      { id: 'p3', day: 'wed', slot: 'lunch', recipeId: b.id },
    ] });
    expect(state.plan.map((p) => p.id)).toEqual(['p2', 'p3']);
  });
});
