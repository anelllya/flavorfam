import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { blobToDataUrl, dataUrlToBlob, deletePhoto, loadPhotos, parsePhotos, replacePhotos, savePhoto, shrinkImage } from './photos';
import { builtInPhoto, getIngredient, ingredients as seedIngredients, seedRecipes, type Day, type Ingredient, type PlanEntry, type Recipe, type Slot, DAYS, SLOTS } from '../data';
import { isSeed, isSeedDraft, parseIngredient, parseRecipe } from './recipeForm';

/** Everything that belongs to the user. Exported as one plain JSON file, Fontello-style. */
export interface UserState {
  version: 1;
  plan: PlanEntry[];
  checked: string[];
  /** The user's own recipes (collection 'mine'). Seed recipes stay read-only in src/data. */
  recipes: Recipe[];
  /** Ingredients typed in the add-recipe form that aren't in ingredients.json. */
  customIngredients: Ingredient[];
  /** Seed placeholders (drafts) the user deleted. Finished seed recipes can't be deleted. */
  deletedSeeds: string[];
}

export const STORAGE_KEY = 'flavorfam:v1';
const EMPTY: UserState = { version: 1, plan: [], checked: [], recipes: [], customIngredients: [], deletedSeeds: [] };

function load(): UserState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseState(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Validates anything coming from storage or an imported file. Throws on garbage. */
export function parseState(input: unknown): UserState {
  const o = input as Partial<UserState> & { app?: string };
  if (!o || typeof o !== 'object' || o.version !== 1) throw new Error('not-a-flavorfam-file');
  const customIngredients = Array.isArray(o.customIngredients)
    ? o.customIngredients.map(parseIngredient).filter((i): i is Ingredient => !!i)
    : [];
  const knownIngredient = (id: string) => !!getIngredient(id, customIngredients);
  const recipes = Array.isArray(o.recipes)
    ? o.recipes.map((r) => parseRecipe(r, knownIngredient)).filter((r): r is Recipe => !!r)
    : [];
  const deletedSeeds = Array.isArray(o.deletedSeeds)
    ? [...new Set(o.deletedSeeds.filter((id): id is string => typeof id === 'string' && isSeedDraft(id)))]
    : [];
  const recipeIds = new Set([...seedRecipes, ...recipes].map((r) => r.id).filter((id) => !deletedSeeds.includes(id)));
  // (A replaced draft shares its seed id, so it's already in the set.)
  const valid = Array.isArray(o.plan)
    ? o.plan.filter(
        (p): p is PlanEntry =>
          !!p && typeof p.id === 'string' && DAYS.includes(p.day) && SLOTS.includes(p.slot) &&
          recipeIds.has(p.recipeId),
      )
    : [];
  // One dish per slot. Older saves could hold several; the last one added wins.
  const plan = valid.filter((p, i) => !valid.slice(i + 1).some((q) => q.day === p.day && q.slot === p.slot));
  const checked = Array.isArray(o.checked) ? o.checked.filter((c): c is string => typeof c === 'string') : [];
  return { version: 1, plan, checked, recipes: recipes.filter((r) => !deletedSeeds.includes(r.id)), customIngredients, deletedSeeds };
}

interface Store {
  state: UserState;
  /** Seed recipes followed by the user's own. */
  recipes: Recipe[];
  /** Every known ingredient: ingredients.json plus the user's custom ones. */
  allIngredients: Ingredient[];
  lookupIngredient: (id: string) => Ingredient | undefined;
  saveRecipe: (recipe: Recipe, newIngredients: Ingredient[]) => void;
  /** Removes the recipe, its plan entries and its photo. Works on your own recipes and on seed placeholders. */
  deleteRecipe: (id: string) => void;
  /** Every recipe: your own, and any seed recipe (your edit replaces it in place). */
  canEdit: (id: string) => boolean;
  /** Your own recipes and seed placeholders. Mama's finished recipes can be edited, not deleted. */
  canDelete: (id: string) => boolean;
  addToPlan: (day: Day, slot: Slot, recipeId: string) => void;
  /**
   * Puts the recipe in every day × meal chosen. One dish per slot: a slot holding another dish
   * gets this one instead (counted as replaced); slots that already hold it are skipped.
   */
  planRecipe: (recipeId: string, days: Day[], slots: Slot[]) => { added: number; replaced: number };
  removeFromPlan: (entryId: string) => void;
  clearPlan: () => void;
  toggleChecked: (key: string) => void;
  clearChecked: () => void;
  /** Object URLs of recipe photos, keyed by recipe id. Kept in IndexedDB, not in UserState. */
  photos: Record<string, string>;
  /** Only the photos this browser added (IndexedDB), without the built-in ones. */
  ownPhotos: Record<string, string>;
  setPhoto: (recipeId: string, file: Blob) => Promise<void>;
  removePhoto: (recipeId: string) => Promise<void>;
  exportFile: () => Promise<string>;
  /** Replaces plan and ticks. Replaces photos only if the file has a photos field (older exports don't). */
  importFile: (text: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(load);
  const [ownPhotos, setPhotos] = useState<Record<string, string>>({});

  const showPhotos = useCallback((blobs: Map<string, Blob>) => {
    setPhotos((old) => {
      Object.values(old).forEach((url) => URL.revokeObjectURL(url));
      return Object.fromEntries([...blobs].map(([id, blob]) => [id, URL.createObjectURL(blob)]));
    });
  }, []);

  useEffect(() => {
    loadPhotos().then(showPhotos).catch(() => { /* no IndexedDB (private mode): no photos */ });
  }, [showPhotos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode: state still works in memory */
    }
  }, [state]);

  const addToPlan = useCallback((day: Day, slot: Slot, recipeId: string) => {
    const id = `${day}-${slot}-${recipeId}-${Date.now().toString(36)}`;
    // One dish per slot: whatever was there is replaced.
    setState((s) => ({ ...s, plan: [...s.plan.filter((p) => !(p.day === day && p.slot === slot)), { id, day, slot, recipeId }] }));
  }, []);
  const planRecipe = useCallback((recipeId: string, days: Day[], slots: Slot[]) => {
    const stamp = Date.now().toString(36);
    const wanted = DAYS.filter((d) => days.includes(d)).flatMap((day) =>
      SLOTS.filter((sl) => slots.includes(sl)).map((slot) => ({ day, slot })));
    const inSlot = (day: Day, slot: Slot) => state.plan.find((p) => p.day === day && p.slot === slot);
    const fresh = wanted.filter(({ day, slot }) => inSlot(day, slot)?.recipeId !== recipeId);
    const replaced = fresh.filter(({ day, slot }) => inSlot(day, slot)).length;
    if (fresh.length) {
      setState((s) => ({
        ...s,
        plan: [
          ...s.plan.filter((p) => !fresh.some((f) => f.day === p.day && f.slot === p.slot)),
          ...fresh.map(({ day, slot }) => ({ id: `${day}-${slot}-${recipeId}-${stamp}`, day, slot, recipeId })),
        ],
      }));
    }
    return { added: fresh.length, replaced };
  }, [state.plan]);
  const removeFromPlan = useCallback((entryId: string) => {
    setState((s) => ({ ...s, plan: s.plan.filter((p) => p.id !== entryId) }));
  }, []);
  const clearPlan = useCallback(() => setState((s) => ({ ...s, plan: [], checked: [] })), []);
  const toggleChecked = useCallback((key: string) => {
    setState((s) => ({
      ...s,
      checked: s.checked.includes(key) ? s.checked.filter((k) => k !== key) : [...s.checked, key],
    }));
  }, []);
  const clearChecked = useCallback(() => setState((s) => ({ ...s, checked: [] })), []);
  const setPhoto = useCallback(async (recipeId: string, file: Blob) => {
    const blob = await shrinkImage(file);
    await savePhoto(recipeId, blob);
    setPhotos((p) => {
      if (p[recipeId]) URL.revokeObjectURL(p[recipeId]);
      return { ...p, [recipeId]: URL.createObjectURL(blob) };
    });
  }, []);
  const removePhoto = useCallback(async (recipeId: string) => {
    await deletePhoto(recipeId);
    setPhotos((p) => {
      const { [recipeId]: old, ...rest } = p;
      if (old) URL.revokeObjectURL(old);
      return rest;
    });
  }, []);
  // A user version of a seed placeholder takes its place in the list; the rest follow the seeds.
  const recipes = useMemo(() => {
    const mine = new Map(state.recipes.map((r) => [r.id, r]));
    const seeds = seedRecipes.filter((r) => !state.deletedSeeds.includes(r.id)).map((r) => mine.get(r.id) ?? r);
    return [...seeds, ...state.recipes.filter((r) => !isSeed(r.id))];
  }, [state.recipes, state.deletedSeeds]);
  const canEdit = useCallback((id: string) => id.startsWith('mine-') || isSeed(id), []);
  const canDelete = useCallback((id: string) => id.startsWith('mine-') || isSeedDraft(id), []);
  const allIngredients = useMemo(() => [...seedIngredients, ...state.customIngredients], [state.customIngredients]);
  const lookupIngredient = useCallback((id: string) => getIngredient(id, state.customIngredients), [state.customIngredients]);
  const saveRecipe = useCallback((recipe: Recipe, newIngredients: Ingredient[]) => {
    setState((s) => ({
      ...s,
      recipes: s.recipes.some((r) => r.id === recipe.id)
        ? s.recipes.map((r) => (r.id === recipe.id ? recipe : r))
        : [...s.recipes, recipe],
      customIngredients: [...s.customIngredients, ...newIngredients],
    }));
  }, []);
  const deleteRecipe = useCallback((id: string) => {
    if (!(id.startsWith('mine-') || isSeedDraft(id))) return;
    // A deleted placeholder (replaced or not) is remembered, so the seed doesn't come back.
    setState((s) => ({
      ...s,
      recipes: s.recipes.filter((r) => r.id !== id),
      plan: s.plan.filter((p) => p.recipeId !== id),
      deletedSeeds: isSeedDraft(id) && !s.deletedSeeds.includes(id) ? [...s.deletedSeeds, id] : s.deletedSeeds,
    }));
    removePhoto(id).catch(() => { /* no photo, or no IndexedDB */ });
  }, [removePhoto]);
  const exportFile = useCallback(async () => {
    const blobs = await loadPhotos().catch(() => new Map<string, Blob>());
    const photoData = Object.fromEntries(
      await Promise.all([...blobs].map(async ([id, blob]) => [id, await blobToDataUrl(blob)] as const)),
    );
    return JSON.stringify({ app: 'flavorfam', exportedAt: new Date().toISOString(), ...state, photos: photoData }, null, 2);
  }, [state]);
  const importFile = useCallback(async (text: string) => {
    const data: unknown = JSON.parse(text);
    const next = parseState(data);
    if (data && typeof data === 'object' && 'photos' in data) {
      const valid = parsePhotos(data.photos, [...seedRecipes, ...next.recipes].map((r) => r.id));
      const blobs = new Map(await Promise.all(Object.entries(valid).map(async ([id, url]) => [id, await dataUrlToBlob(url)] as const)));
      await replacePhotos(blobs);
      showPhotos(blobs);
    }
    setState(next);
  }, [showPhotos]);

  // Built-in photos ship with the site (public/recipes/); a photo added in this browser wins.
  const photos = useMemo(() => ({
    ...Object.fromEntries(seedRecipes.flatMap((r) => { const url = builtInPhoto(r.id); return url ? [[r.id, url]] : []; })),
    ...ownPhotos,
  }), [ownPhotos]);

  const value = useMemo<Store>(
    () => ({ state, recipes, allIngredients, lookupIngredient, saveRecipe, deleteRecipe, canEdit, canDelete, addToPlan, planRecipe, removeFromPlan, clearPlan, toggleChecked, clearChecked, photos, ownPhotos, setPhoto, removePhoto, exportFile, importFile }),
    [state, recipes, allIngredients, lookupIngredient, saveRecipe, deleteRecipe, canEdit, canDelete, addToPlan, planRecipe, removeFromPlan, clearPlan, toggleChecked, clearChecked, photos, ownPhotos, setPhoto, removePhoto, exportFile, importFile],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
