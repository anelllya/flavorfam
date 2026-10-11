# Brief: Add recipe (run 2, to be driven by a human with Claude Code)

**Job:** let me add my own recipe, stored in this browser and included in the export file.

**Data:** title, category, servings, time (optional), ingredient lines, steps, notes (optional).
Ingredient lines are `ingredient + qty + unit`:
- ingredient: pick from `ingredients.json` with autocomplete. A new name is allowed but shows a warning ("this won't merge with existing items on the shopping list").
- unit: fixed list only (`g, ml, pcs, tbsp, tsp, pinch`). No free text.
- qty: number > 0.

**Actions:** add/remove ingredient rows, add/remove steps, save, cancel. Edit and delete my own recipes. Seed recipes stay read-only.

**Expect gaps:** this probably needs a `TextField` and a `NumberField` (the Figma `input` component covers both). Propose them before building. Do not inline them in the screen.

**Store changes:** `UserState` gains `recipes` and `customIngredients`; `parseState` validates them; the plan accepts ids from both seed and user recipes.

Run `npm run eval`, then log the run in `evals/runs.md`.
