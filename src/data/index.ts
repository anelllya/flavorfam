// The only module allowed to import raw data. Screens read through these functions.
import ingredientsJson from './ingredients.json';
import recipesJson from './recipes.json';
import type { Ingredient, Recipe } from './types';

export * from './types';

export const ingredients = ingredientsJson as Ingredient[];
export const seedRecipes = recipesJson as Recipe[];

const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

export function getIngredient(id: string, extra: Ingredient[] = []): Ingredient | undefined {
  return ingredientById.get(id) ?? extra.find((i) => i.id === id);
}

/** "1 Egg", "3 Eggs", "200 g Flour". */
export function ingredientLabel(ing: Ingredient, qty: number, unit: Ingredient['unit']): string {
  return unit === 'pcs' && qty !== 1 && ing.namePlural ? ing.namePlural : ing.name;
}

/** URL of a recipe's built-in photo (public/recipes/), looked up in the seed data so edits keep it. */
export function builtInPhoto(id: string): string | undefined {
  const image = seedRecipes.find((r) => r.id === id)?.image;
  return image ? `${import.meta.env.BASE_URL}recipes/${image}` : undefined;
}
