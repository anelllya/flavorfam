# Generation runs

Every run against the system is logged here, failures included.
The format is in `.claude/skills/generate-screen/SKILL.md`.

---

## Run 0: the hand-built shell (human + agent pairing, before the skill existed)

**What:** tokens, 12 components, Home / Recipes / Recipe / Settings screens, the portfolio site.
**First gate result (raw):**

```
eslint: 13 errors, all GUARDRAIL no-hardcoded-copy in src/site/SystemPage.tsx
  (token names and component names written as JSX text: <code>--color-{k}</code>, <code>Button</code>)
stylelint: 6 errors
  Site.module.css  GUARDRAIL use-tokens  font-size: clamp(var(--text-3xl), 5vw, 3.5rem)
  Site.module.css  GUARDRAIL use-tokens  border-radius: 3rem
  Site.module.css  declaration-block-single-line-max-declarations (x2)
  Layout.module.css  declaration-block-no-redundant-longhand-properties
  base.css  property-no-vendor-prefix
```

**What changed:**
- The display headline needed a size the system didn't have. Added `--text-display` (56px) to `tokens.json` instead of hardcoding 3.5rem. That's a system change, not a screen fix.
- The phone frame radius became `calc(var(--radius-lg) * 2)`. No new token for a one-off.
- Code labels moved into JS expressions. They're identifiers, not copy.

**Takeaway:** the gate doesn't care who wrote the code. The first violations were in the hand-written portfolio page, not in anything generated.

---

## Run 1: Week + Shopping list (generated with `generate-screen`)

**Brief (Week):** plan 7 days × 3 meals. Each slot is empty (add → recipe picker) or holds a recipe (open, remove). Show a count, clear the week, jump to the list.
**Brief (Shopping list):** aggregated list from the plan, grouped by aisle. Tick items off; ticks persist. Progress, untick all, empty state that links to the week.

**Components used:** AppHeader, Page, Stack, SectionHeader, Button, ButtonLink, IconButton, Icon, Checkbox.
**Gaps found:** none. No new components or tokens were needed. That's the system working.

**First gate result (raw):**

```
PASS  tokens
PASS  typecheck
PASS  eslint guardrails
PASS  stylelint guardrails
FAIL  unit                      vitest picked up the Playwright specs (config problem, not the screens)
PASS  build
FAIL  axe + visual + behaviour  4 failed: week/list visual x 2 themes, "A snapshot doesn't exist"
                                40 passed, including axe on both new screens and both behaviour tests
```

**What the gate did not catch (human review of the screenshots):**

1. **Layout broke on long names.** "Red lentils with eggs and spinach" wrapped and pushed the remove button onto its own line. Lint, axe and the behaviour tests all passed.
2. **The agent used `window.location.hash` to navigate** from a second "+" button, bypassing the router. It worked, so nothing failed.
3. **"1 Cucumbers", "1 Lemons".** The data model had no singular/plural.

**What changed:**
- Week slot layout moved to a two-column grid that can't wrap the action away from its meal. One recipe per slot; the duplicate "+" went.
- **New guardrail `use-router`:** `window.location` is now an ESLint error. A review comment became a rule, so the next run can't repeat it.
- `namePlural` added to the ingredient model, with a unit test.
- Two more Figma colours failed WCAG AA in light mode (`success` on a light surface, the red fail label). Fixed at token level and in the token map, not per screen.

**Final:** gate passed, 44 browser checks across dark and light.

**The uncomfortable bit:** visual regression only protects against *change*. The first baseline happily accepted the broken layout. A first render still needs human eyes. That's the job the system can't take over yet.

---

## Run 2: Add recipe (generated with `generate-screen`, driven by a human in Claude Code)

**Brief:** `evals/briefs/add-recipe.md`. Add, edit and delete my own recipes: title, category, servings, optional time, ingredient lines (ingredient + qty + fixed unit), steps, optional notes. Stored in this browser, included in the export. Seed recipes stay read-only. Also: the centre **+** in the tab bar now opens this screen (it used to go to Week).

**Components used:** AppHeader, Page, Stack, SectionHeader, Button, ButtonLink, IconButton, Select, plus TextField and NumberField (new, see below).

**Gaps found:** text input. The inventory only had SearchField and Select. Proposed before building, as the brief predicted; the human chose two components over one:
- `TextField`: Figma `input (Label, Size=Large)`. Text or `multiline`, optional `suggestions` (native datalist autocomplete), `warning` (advisory) and `error` (sets `aria-invalid`).
- `NumberField`: same Figma component, numeric. Value stays a string so a field can be empty mid-edit.

Both share one CSS module that matches Select. The warning colour fails AA as text, so a warning is a left bar in `--color-warning` with muted text. No new tokens.

**Store:** `UserState` gained `recipes` and `customIngredients`. `parseState` validates both, drops lines that point at unknown ingredients, refuses user recipes that reuse a seed id, and the plan accepts ids from both. Older files without these fields still import.

**First gate result (raw):**

```
PASS  tokens
PASS  typecheck
PASS  eslint guardrails
PASS  stylelint guardrails
PASS  unit                      21 tests, including 9 new for the form logic and parseState
PASS  build
FAIL  axe + visual + behaviour  12 failed, 42 passed
  4  behaviour: getByLabel('Ingredient 1') matched "Remove ingredient 1" too (substring match)
  6  visual: recipe, recipe-mama, settings in both themes, from earlier work in this session
     (photo buttons, Settings copy, softer text tokens), not from the new screen
  2  visual: recipe-new, "A snapshot doesn't exist"
```

**What the gate caught:**

1. **A real state bug, found by a test written to check something else.** With exact labels, the edit test still failed: "Quantity" matched 8 fields. Going from `/recipes/waffles/edit` to `/recipes/new` kept the Waffles draft, because both routes render the same component in the same place, so React reused it with its state. Fixed by keying the form by recipe id. The browser tests run against the last *build*, so the fix only showed up after a rebuild.

**What the gate did not catch (human review of the screenshots):**

2. **An invisible disabled state.** With one row, the remove button was `disabled` but looked identical to an active one. IconButton has no disabled style. Fixed in the screen by hiding the button until there are two rows. The IconButton disabled style is logged as a system gap, not patched here.
3. **The 2% visual tolerance hid that fix.** Removing two × icons is under `maxDiffPixelRatio: 0.02`, so the old baseline still passed, and `--update-snapshots` (which only rewrites *changed* snapshots) left it alone. It took `--update-snapshots=all` and a look at the PNG to see it.
4. **A layout gap from the fix.** With the remove column empty, the grid kept its gap and the fields stopped 12px short of the edge. Fixed with a single-row layout.

**Not done (follow-ups):**
- Focus doesn't move to the first error after a failed save. Screen readers do get the `role="alert"` summary.
- Full-page screenshots capture the sticky header and tab bar mid-page, hiding a strip of content. That's true of every baseline, not just this one.
- `IconButton` needs a disabled style (Figma has no disabled state for it either).

**Final:** gate passed, 54 browser checks across dark and light (axe, visual and behaviour on the new screen, plus 3 behaviour tests: errors on empty save, save → plan → shopping list, edit/delete and seed read-only).

**Takeaway:** the most useful failure was a test failing for the wrong reason. A selector problem hid a real bug, and fixing the selector exposed it. The least useful check was the visual tolerance, which let a removed control through as "no change".

---

## Run 3: Session of human-directed changes (eval run on demand at the end)

**What changed since run 2:** landing page (phone stage, glow, dot grid, site-level theme toggle); one global theme; tab bar rebuilt (neutral container, search row that became a context bar, five plain tabs); search moved out of screens into the tab bar; recipe photos (IndexedDB, travel in the export); softer text tokens + `--color-on-featured`; AI-assisted import (ChatGPT / Claude / Gemini, paste the JSON reply back); editable drafts and Mama's recipes, delete for own recipes and drafts; "All" sorted by most recent; Add to week as a sheet (days × meals); seasonings grouped under Spices & seasonings; smaller header with a back arrow.

**New system pieces (human-requested):** TextField, NumberField (run 2), TabBarActions, Dialog, ToggleGroup, IconButton `tonal`, icons sun/moon/edit/trash. Small buttons now share the 44px tap height. None are in Figma yet.

**Eval policy change:** `npm run eval` is now on demand (CLAUDE.md). During the session, changes were checked with typecheck, lint, unit and the axe + behaviour browser tests, skipping visuals.

**First gate result (raw):**

```
PASS  tokens, typecheck, eslint guardrails, stylelint guardrails, unit (40), build
FAIL  axe + visual + behaviour  56 passed, 14 failed
  14  visual: home, recipes, recipe, recipe-mama, week, list, recipe-new in both themes
      (all intended redesigns; every axe and behaviour test passed)
```

**What the checks caught during the session (not at the end):**
1. axe: the secondary Button's hover state was 3.4:1 in light mode, everywhere. Fixed in the component.
2. A real paste from a chat app used curly quotes and failed to import. It's now a fixture test, and the parser repairs structural smart quotes.
3. Lint caught a literal non-breaking space written into a regex, and `setState` inside an effect (the search was rebuilt to read the URL only).

**What the gate did not catch:**
- **Settings passed** although its tab bar was redesigned: the diff was under the 2% tolerance. That's the second time (see run 2). The tolerance is a known blind spot for small but real changes.
- **Week mixes a ghost "Clear week" with an outlined "Shopping list"** in one row, the same inconsistency the human called a "cacophony" in the tab bar. No rule checks for mixed button variants in a row.
- Full-page screenshots still capture the sticky header and tab bar mid-page.

**Final:** gate passed after reviewing all 14 new screenshots and refreshing every baseline (`--update-snapshots=all`, so Settings too). 70 browser checks across dark and light, 40 unit tests.

---

## Run 4: Status colours, Notice, Snackbar, Home rails (human-directed, eval on demand)

**What changed since run 3:**
- **Status colours:** info, success, warning and danger became full sets (strong, subtle, on-), passing AA in both modes. Warning moved to amber, and `error` was renamed `danger`.
- **New components:** Notice, Snackbar (confirmations after a save or delete), Rail, StatTile, ExternalLink and Logo. RecipeTile gained a caption.
- **Home:** rebuilt as three sideways rails with counters.
- **Week:** one dish per slot.
- **Smaller changes:** the Select chevron is inset from the border; one outline token (`--border-control`) for buttons, chips and toggles; spaced ingredient dots; recipe sources are real links; the logo is in place.
- **Site:** "On this page" contents on Thinking, Status (formerly Proof) and System; a stack summary on System.

**First gate result (raw):**

```
PASS  tokens, typecheck, eslint guardrails, stylelint guardrails, unit (43), build
FAIL  axe + visual + behaviour  74 passed, 6 failed
  6  visual: home, recipe, recipe-mama in both themes (all intended: new Home, draft Notice, spaced dots)
```

**What the checks caught during the session:**
1. **Snackbar announcement:** the first version put the Dismiss button inside the live region, so screen readers would say "Recipe saved. Dismiss". A behaviour test failed on the extra text, which exposed it. Announcements now come from a separate region that holds only the message.
2. **Invalid fields:** a focused, invalid field drew a doubled red ring. Found in screenshot review. The error line now sits inside the border, and the focus ring stays separate.
3. **Notes markers:** the Thinking page's contents list showed raw markdown backticks. Found in browser review.

**What the gate did not catch:**
- **The 2% tolerance again:** recipe-new, week, list, recipes and settings all changed (logo, select chevron, outline width, colours) and still "passed". This is the third run where the tolerance hid real changes. Every baseline was refreshed anyway, after looking at them.
- **Doubled dishes in one slot:** an old saved plan could hold two dishes in one meal slot. Nothing failed; it was a human looking at the Week screen. It's now a rule in the data layer (the newest dish wins) with a unit test.

**Final:** gate passed. 80 browser checks across dark and light, 43 unit tests.
