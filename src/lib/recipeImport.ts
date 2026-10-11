import { CATEGORIES, UNITS, type Category, type Unit } from '../data';
import { t } from '../i18n';
import { emptyDraft, emptyLine, emptyStep, rowKey, type Draft } from './recipeForm';

/**
 * "Bring your own AI" recipe import. FlavorFam has no server, so it can't fetch other sites
 * (CORS). Instead it writes a request for the person's own AI, which can open the page, and
 * reads the JSON reply back into the add-recipe form. Nothing is saved until they press Save.
 */

export type AiTarget = 'chatgpt' | 'claude' | 'gemini';

/**
 * Where each button goes. ChatGPT and Claude accept a prompt in the link (not officially
 * documented, so it may stop working); Gemini doesn't, so it relies on the copied request.
 * Long prompts are left out of the URL rather than risk a broken link.
 */
const MAX_URL = 7000;
export function aiUrl(target: AiTarget, prompt: string): string {
  const q = encodeURIComponent(prompt);
  if (target === 'gemini') return 'https://gemini.google.com/app';
  const base = target === 'chatgpt' ? 'https://chatgpt.com/' : 'https://claude.ai/new';
  return q.length <= MAX_URL ? `${base}?q=${q}` : base;
}

export function buildPrompt(link: string, ingredientNames: string[]): string {
  return t('recipeImport.prompt', {
    link: link.trim() || t('recipeImport.promptNoLink'),
    categories: CATEGORIES.join(', '),
    units: UNITS.join(', '),
    ingredients: ingredientNames.join(', '),
  });
}

const UNIT_ALIASES: Record<string, Unit> = {
  g: 'g', gram: 'g', grams: 'g', gr: 'g',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  pcs: 'pcs', pc: 'pcs', piece: 'pcs', pieces: 'pcs', whole: 'pcs', '': 'pcs',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tbs: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  pinch: 'pinch', pinches: 'pinch',
};

/**
 * Chat apps and copy-paste often turn the JSON's quotes into “smart” ones, and sometimes add
 * non-breaking spaces or trailing commas. Only curly double quotes next to JSON punctuation
 * are straightened, so quotation marks and apostrophes inside the text are left alone.
 */
export function repairJson(json: string): string {
  return json
    .replace(/\u00a0/g, ' ')
    .replace(/([{[,:]\s*)[“”„‟″]/g, '$1"')
    .replace(/[“”„‟″](\s*[:,}\]])/g, '"$1')
    .replace(/,(\s*[}\]])/g, '$1');
}

/** AIs often wrap JSON in prose or ``` fences; take the outermost object. Strict first, repaired second. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return undefined;
  const json = text.slice(start, end + 1);
  for (const candidate of [json, repairJson(json)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try the next one */
    }
  }
  return undefined;
}

/** Notes are a short aside, not the recipe's blog post. Keep whole sentences up to the limit. */
export const NOTES_MAX = 300;
export function trimNotes(text: string): string {
  if (text.length <= NOTES_MAX) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > NOTES_MAX) break;
    out += s;
  }
  return out.trim() || `${text.slice(0, NOTES_MAX - 1).trimEnd()}…`;
}

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * Turns an AI reply into a form draft. Lenient on shape (unknown units fall back to pcs,
 * unknown categories to main) because the person reviews the form before saving; strict on
 * types, so nothing but plain strings and numbers reaches the form.
 */
export function parseAiReply(text: string): Draft | undefined {
  const o = extractJson(text) as Record<string, unknown> | undefined;
  if (!o || typeof o !== 'object' || !str(o.title)) return undefined;

  const rawLines = Array.isArray(o.ingredients) ? o.ingredients.slice(0, 80) : [];
  const lines = rawLines.flatMap((l) => {
    const line = l as Record<string, unknown>;
    const name = str(line?.name, 120);
    if (!name) return [];
    const qty = num(line.qty);
    const unit = UNIT_ALIASES[str(line.unit).toLowerCase()] ?? 'pcs';
    return [{ key: rowKey(), name, qty: qty ? String(Math.round(qty * 100) / 100) : '', unit }];
  });
  const rawSteps = Array.isArray(o.steps) ? o.steps.slice(0, 60) : [];
  const steps = rawSteps.map((s) => str(s)).filter(Boolean).map((text) => ({ key: rowKey(), text }));
  const category = CATEGORIES.includes(o.category as Category) ? (o.category as Category) : 'main';
  const servings = num(o.servings);
  const time = num(o.timeMinutes);
  const source = str(o.source, 500);

  return {
    ...emptyDraft(),
    title: str(o.title, 120),
    category,
    servings: servings ? String(Math.max(1, Math.round(servings))) : '4',
    time: time ? String(Math.round(time)) : '',
    lines: lines.length ? lines : [emptyLine()],
    steps: steps.length ? steps : [emptyStep()],
    notes: trimNotes(str(o.notes)),
    source: /^https?:\/\//.test(source) ? source : '',
  };
}
