import { describe, expect, it } from 'vitest';
import { getIngredient, seedRecipes, type PlanEntry } from '../data';
import { buildShoppingList, formatQty } from './shopping';

const entry = (recipeId: string, day: PlanEntry['day'] = 'mon'): PlanEntry => ({ id: `${day}-${recipeId}`, day, slot: 'dinner', recipeId });

describe('buildShoppingList', () => {
  it('sums the same ingredient across recipes by id', () => {
    const list = buildShoppingList([entry('tortilla'), entry('lentils-eggs', 'tue')], seedRecipes, getIngredient);
    const eggs = list.dairy.find((i) => i.ingredientId === 'egg' && i.unit === 'pcs');
    expect(eggs?.qty).toBe(9);
    expect(eggs?.recipeIds).toEqual(['tortilla', 'lentils-eggs']);
    expect(eggs?.name).toBe('Eggs');
  });

  it('counts a recipe planned twice twice', () => {
    const list = buildShoppingList([entry('tortilla'), entry('tortilla', 'fri')], seedRecipes, getIngredient);
    expect(list.produce.find((i) => i.ingredientId === 'potato')?.qty).toBe(1200);
  });

  it('keeps different units of the same ingredient on separate rows', () => {
    const list = buildShoppingList([entry('chocolate-yoghurt-cake')], seedRecipes, getIngredient);
    const cocoa = list.baking.filter((i) => i.ingredientId === 'cocoa');
    expect(cocoa).toHaveLength(1);
    expect(cocoa[0].qty).toBe(4);
    const sugar = list.baking.filter((i) => i.ingredientId === 'sugar');
    expect(sugar[0].qty).toBe(350);
  });

  it('groups by aisle and ignores unknown recipes', () => {
    const list = buildShoppingList([entry('does-not-exist'), entry('ginger-elixir')], seedRecipes, getIngredient);
    expect(list.produce.map((i) => i.ingredientId).sort()).toEqual(['ginger', 'lemon']);
    expect(list.pantry.map((i) => i.ingredientId)).toEqual(['honey']);
  });
});

describe('seed data integrity', () => {
  it('every recipe ingredient points at a canonical ingredient', () => {
    for (const r of seedRecipes) for (const l of r.ingredients) expect(getIngredient(l.ingredientId), `${r.id} -> ${l.ingredientId}`).toBeDefined();
  });
  it('has exactly 24 recipes with unique ids', () => {
    expect(new Set(seedRecipes.map((r) => r.id)).size).toBe(24);
  });
});

it('uses the singular name for exactly one piece', () => {
  const list = buildShoppingList([entry('salmon-broccoli')], seedRecipes, getIngredient);
  expect(list.produce.find((i) => i.ingredientId === 'lemon')?.name).toBe('Lemon');
});

describe('formatQty', () => {
  it('renders kitchen fractions', () => {
    expect(formatQty(0.5)).toBe('½');
    expect(formatQty(2.5)).toBe('2½');
    expect(formatQty(0.25)).toBe('¼');
    expect(formatQty(3)).toBe('3');
  });
});
