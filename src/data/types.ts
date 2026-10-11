export type Unit = 'g' | 'ml' | 'pcs' | 'tbsp' | 'tsp' | 'pinch';
export const UNITS: readonly Unit[] = ['g', 'ml', 'pcs', 'tbsp', 'tsp', 'pinch'];

export type Aisle = 'produce' | 'dairy' | 'meat' | 'fish' | 'baking' | 'pantry' | 'spices' | 'frozen' | 'drinks';
export const AISLES: readonly Aisle[] = ['produce', 'dairy', 'meat', 'fish', 'frozen', 'baking', 'pantry', 'spices', 'drinks'];

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  aisle: Aisle;
  /** Used when unit is pcs and qty is not 1. */
  namePlural?: string;
  /** Weight of one piece, for future calorie maths. Not used yet. */
  gramsPerUnit?: number;
  /** Reserved for the calories feature (see LATER.md). Not used yet. */
  kcalPer100g?: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  qty: number;
  unit: Unit;
  note?: string;
}

export type Category = 'breakfast' | 'main' | 'salad-soup' | 'baking' | 'dessert' | 'drink';
export const CATEGORIES: readonly Category[] = ['main', 'salad-soup', 'breakfast', 'baking', 'dessert', 'drink'];

export interface Recipe {
  id: string;
  title: string;
  originalTitle?: string;
  collection: 'mama' | 'everyday' | 'mine';
  category: Category;
  servings: number;
  timeMinutes?: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  notes?: string;
  source?: string;
  /** Seed recipe written by an agent, waiting for a human to replace it. */
  draft?: boolean;
  /** When the user last saved it (ms). Seed recipes don't have one until edited. */
  updatedAt?: number;
}

export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const DAYS: readonly Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export type Slot = 'breakfast' | 'lunch' | 'dinner';
export const SLOTS: readonly Slot[] = ['breakfast', 'lunch', 'dinner'];

export interface PlanEntry {
  id: string;
  day: Day;
  slot: Slot;
  recipeId: string;
}
