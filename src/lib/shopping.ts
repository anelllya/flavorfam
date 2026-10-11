import { AISLES, ingredientLabel, type Aisle, type Ingredient, type PlanEntry, type Recipe, type Unit } from '../data';

export interface ShoppingItem {
  /** ingredientId + unit. Same ingredient in two units stays two rows, on purpose. */
  key: string;
  ingredientId: string;
  name: string;
  qty: number;
  unit: Unit;
  aisle: Aisle;
  recipeIds: string[];
}

/**
 * Turns a week plan into an aggregated shopping list.
 * Aggregation is by ingredient id, never by name, so "2 cebollas" and "onion x1" can't diverge.
 */
export function buildShoppingList(
  plan: PlanEntry[],
  recipes: Recipe[],
  lookup: (id: string) => Ingredient | undefined,
): Record<Aisle, ShoppingItem[]> {
  const byKey = new Map<string, ShoppingItem>();
  for (const entry of plan) {
    const recipe = recipes.find((r) => r.id === entry.recipeId);
    if (!recipe) continue;
    for (const line of recipe.ingredients) {
      const ing = lookup(line.ingredientId);
      if (!ing) continue;
      const key = `${line.ingredientId}:${line.unit}`;
      const item = byKey.get(key) ?? {
        key, ingredientId: ing.id, name: ing.name, qty: 0, unit: line.unit, aisle: ing.aisle, recipeIds: [],
      };
      item.qty = round(item.qty + line.qty);
      if (!item.recipeIds.includes(recipe.id)) item.recipeIds.push(recipe.id);
      byKey.set(key, item);
    }
  }
  const grouped = Object.fromEntries(AISLES.map((a) => [a, [] as ShoppingItem[]])) as Record<Aisle, ShoppingItem[]>;
  for (const item of byKey.values()) {
    const ing = lookup(item.ingredientId);
    if (ing) item.name = ingredientLabel(ing, item.qty, item.unit);
    grouped[item.aisle].push(item);
  }
  for (const a of AISLES) grouped[a].sort((x, y) => x.name.localeCompare(y.name));
  return grouped;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function formatQty(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  const fractions: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };
  const whole = Math.floor(qty);
  const frac = fractions[String(round(qty - whole))];
  if (frac) return whole ? `${whole}${frac}` : frac;
  return String(round(qty));
}
