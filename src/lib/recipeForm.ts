import { CATEGORIES, UNITS, seedRecipes, type Aisle, type Category, type Ingredient, type Recipe, type Unit } from '../data';

/**
 * Any seed recipe can be edited: the user's version is stored under the same id and keeps the
 * seed's collection and original title, so plans keep pointing at it. Only the placeholders
 * (`draft`) can be deleted; Mama's finished recipes can't be lost by accident.
 */
const seeds = new Map(seedRecipes.map((r) => [r.id, r]));
export const isSeed = (id: string) => seeds.has(id);
export const isSeedDraft = (id: string) => !!seeds.get(id)?.draft;

/** What the add/edit form holds. Numbers stay strings so fields can be empty while typing. */
export interface DraftLine { key: string; name: string; qty: string; unit: Unit }
export interface DraftStep { key: string; text: string }
export interface Draft {
  title: string;
  category: Category;
  servings: string;
  time: string;
  lines: DraftLine[];
  steps: DraftStep[];
  notes: string;
  /** Where an imported recipe came from. Not editable; shown as the recipe's source. */
  source: string;
}

/** Error keys per field. Line and step errors are keyed by the row's `key`. */
export interface DraftErrors {
  title?: 'title';
  servings?: 'servings';
  time?: 'time';
  lines?: 'noIngredients';
  steps?: 'noSteps';
  lineName: Record<string, 'ingredient'>;
  lineQty: Record<string, 'qty'>;
}

let seq = 0;
export const rowKey = () => `row-${(seq += 1)}`;
export const emptyLine = (): DraftLine => ({ key: rowKey(), name: '', qty: '', unit: 'g' });
export const emptyStep = (): DraftStep => ({ key: rowKey(), text: '' });

export function emptyDraft(): Draft {
  return { title: '', category: 'main', servings: '4', time: '', lines: [emptyLine()], steps: [emptyStep()], notes: '', source: '' };
}

export function toDraft(recipe: Recipe, lookup: (id: string) => Ingredient | undefined): Draft {
  return {
    title: recipe.title,
    category: recipe.category,
    servings: String(recipe.servings),
    time: recipe.timeMinutes ? String(recipe.timeMinutes) : '',
    lines: recipe.ingredients.map((l) => ({ key: rowKey(), name: lookup(l.ingredientId)?.name ?? l.ingredientId, qty: String(l.qty), unit: l.unit })),
    steps: recipe.steps.map((text) => ({ key: rowKey(), text })),
    notes: recipe.notes ?? '',
    source: recipe.source ?? '',
  };
}

const norm = (s: string) => s.trim().toLowerCase();

/** Finds a known ingredient by name or plural, ignoring case. */
export function matchIngredient(name: string, known: Ingredient[]): Ingredient | undefined {
  const n = norm(name);
  return n ? known.find((i) => norm(i.name) === n || (i.namePlural && norm(i.namePlural) === n)) : undefined;
}

/** A row the person never touched is ignored rather than reported. */
const isBlankLine = (l: DraftLine) => !l.name.trim() && !l.qty.trim();
const positive = (s: string) => s.trim() !== '' && Number.isFinite(Number(s)) && Number(s) > 0;

export function validate(draft: Draft): DraftErrors {
  const errors: DraftErrors = { lineName: {}, lineQty: {} };
  if (!draft.title.trim()) errors.title = 'title';
  if (!positive(draft.servings) || !Number.isInteger(Number(draft.servings))) errors.servings = 'servings';
  if (draft.time.trim() && !positive(draft.time)) errors.time = 'time';
  const lines = draft.lines.filter((l) => !isBlankLine(l));
  if (lines.length === 0) errors.lines = 'noIngredients';
  for (const l of lines) {
    if (!l.name.trim()) errors.lineName[l.key] = 'ingredient';
    if (!positive(l.qty)) errors.lineQty[l.key] = 'qty';
  }
  if (!draft.steps.some((s) => s.text.trim())) errors.steps = 'noSteps';
  return errors;
}

export function hasErrors(e: DraftErrors): boolean {
  return !!(e.title || e.servings || e.time || e.lines || e.steps) ||
    Object.keys(e.lineName).length > 0 || Object.keys(e.lineQty).length > 0;
}

/**
 * Where a new ingredient goes on the shopping list. Seasonings bought in tiny amounts (tsp,
 * pinches, a leaf) belong together under Spices rather than scattered through Pantry.
 */
const SEASONING = /\b(salt|(black|white|ground) pepper|peppercorns?|spices?|seasoning|dried herbs|paprika|cumin|cinnamon|nutmeg|cardamom|oregano|thyme|bay leaf|bay leaves|chil+i flakes|chil+i powder|cayenne|turmeric|coriander seeds?|ground coriander|curry powder|garam masala|allspice|star anise|fennel seeds?|mustard seeds?|saffron|sumac|za'?atar|vanilla pods?)\b/i;
export function inferAisle(name: string, unit: Unit): Aisle {
  if (/\bfresh\b/i.test(name)) return 'pantry';
  return unit === 'tsp' || unit === 'pinch' || SEASONING.test(name) ? 'spices' : 'pantry';
}

const slug = (s: string) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
const stamp = () => Date.now().toString(36);

/**
 * Turns a valid draft into a recipe. Names that don't match a known ingredient become new
 * custom ingredients (returned separately so the store can save them).
 */
export function toRecipe(draft: Draft, known: Ingredient[], id?: string): { recipe: Recipe; newIngredients: Ingredient[] } {
  const replaces = id ? seeds.get(id) : undefined;
  const newIngredients: Ingredient[] = [];
  const ingredients = draft.lines.filter((l) => !isBlankLine(l)).map((l) => {
    let ing = matchIngredient(l.name, [...known, ...newIngredients]);
    if (!ing) {
      ing = { id: `mine-${slug(l.name)}-${stamp()}`, name: l.name.trim(), unit: l.unit, aisle: inferAisle(l.name, l.unit) };
      newIngredients.push(ing);
    }
    return { ingredientId: ing.id, qty: Number(l.qty), unit: l.unit };
  });
  const recipe: Recipe = {
    id: id ?? `mine-${slug(draft.title)}-${stamp()}`,
    title: draft.title.trim(),
    ...(replaces?.originalTitle && { originalTitle: replaces.originalTitle }),
    collection: replaces?.collection ?? 'mine',
    category: draft.category,
    servings: Number(draft.servings),
    ...(draft.time.trim() && { timeMinutes: Number(draft.time) }),
    ingredients,
    steps: draft.steps.map((s) => s.text.trim()).filter(Boolean),
    ...(draft.notes.trim() && { notes: draft.notes.trim() }),
    ...(draft.source && { source: draft.source }),
    updatedAt: Date.now(),
  };
  return { recipe, newIngredients };
}

/** Validates a user recipe from storage or an import. Returns undefined for anything malformed. */
export function parseRecipe(input: unknown, ingredientIds: (id: string) => boolean): Recipe | undefined {
  const r = input as Partial<Recipe>;
  if (!r || typeof r !== 'object') return undefined;
  // Only the user's own ids, or an edited version of a seed recipe.
  if (typeof r.id !== 'string' || !(r.id.startsWith('mine-') || isSeed(r.id))) return undefined;
  if (typeof r.title !== 'string' || !r.title.trim()) return undefined;
  if (!CATEGORIES.includes(r.category as Category)) return undefined;
  if (typeof r.servings !== 'number' || !(r.servings > 0)) return undefined;
  if (!Array.isArray(r.ingredients) || !Array.isArray(r.steps)) return undefined;
  const ingredients = r.ingredients.filter(
    (l) => !!l && typeof l.ingredientId === 'string' && ingredientIds(l.ingredientId) &&
      typeof l.qty === 'number' && l.qty > 0 && UNITS.includes(l.unit),
  ).map((l) => ({ ingredientId: l.ingredientId, qty: l.qty, unit: l.unit }));
  const steps = r.steps.filter((s): s is string => typeof s === 'string' && !!s.trim());
  return {
    id: r.id,
    title: r.title,
    ...(seeds.get(r.id)?.originalTitle && { originalTitle: seeds.get(r.id)?.originalTitle }),
    collection: seeds.get(r.id)?.collection ?? 'mine',
    category: r.category as Category,
    servings: r.servings,
    ...(typeof r.timeMinutes === 'number' && r.timeMinutes > 0 && { timeMinutes: r.timeMinutes }),
    ingredients,
    steps,
    ...(typeof r.notes === 'string' && r.notes && { notes: r.notes }),
    ...(typeof r.updatedAt === 'number' && Number.isFinite(r.updatedAt) && { updatedAt: r.updatedAt }),
    ...(typeof r.source === 'string' && /^https?:\/\//.test(r.source) && { source: r.source.slice(0, 500) }),
  };
}

export function parseIngredient(input: unknown): Ingredient | undefined {
  const i = input as Partial<Ingredient>;
  if (!i || typeof i !== 'object' || typeof i.id !== 'string' || !i.id.startsWith('mine-')) return undefined;
  if (typeof i.name !== 'string' || !i.name.trim() || !UNITS.includes(i.unit as Unit)) return undefined;
  // Re-filed on load, so ingredients saved before seasonings had their own aisle move too.
  return { id: i.id, name: i.name, unit: i.unit as Unit, aisle: inferAisle(i.name, i.unit as Unit) };
}

/**
 * When a recipe was last added or edited. Recipes saved before `updatedAt` existed fall back to
 * the base-36 timestamp at the end of their `mine-…` id; untouched seed recipes have none (0).
 */
export function recency(r: Recipe): number {
  if (r.updatedAt) return r.updatedAt;
  const stamp = r.id.startsWith('mine-') ? parseInt(r.id.slice(r.id.lastIndexOf('-') + 1), 36) : NaN;
  return Number.isFinite(stamp) ? stamp : 0;
}

/** Most recently added or edited first; everything else keeps its order (sort is stable). */
export const byRecent = (recipes: Recipe[]) => [...recipes].sort((a, b) => recency(b) - recency(a));
