# FlavorFam

**A design system built for AI to generate against, proven on a real meal planner.**

Humans own the taste: tokens, components, rules. An agent assembles screens from them. One command decides what ships:

```bash
npm install
npm run eval
```

## What's in here

| Path | What |
|---|---|
| `tokens/tokens.json` | Source of truth, extracted from the FlavourFam Figma file (light + dark) |
| `src/components/` | The 23 components an agent may use. Nothing else. Inventory and Figma status in `docs/components.md` |
| `CLAUDE.md` | The rules every agent reads first |
| `.claude/skills/generate-screen/` | How an agent generates a screen, and what "done" means |
| `evals/` | Custom stylelint rule, the run log, briefs for future runs |
| `tests/` | axe + visual regression on every route in both themes, plus behaviour tests |
| `content/` | The `/thinking` page (`/status` renders `evals/runs.md`) |
| `src/data/` | 24 recipes (13 of them my mum's) and a canonical ingredient list |
| `docs/` | Token map and component inventory (what still needs to go back into Figma), and a CI workflow ready to enable (`docs/ci/gate.yml`) |

## The gate

| Check | Catches |
|---|---|
| `no-raw-color` | hex, rgb(), named colours outside tokens.css |
| `use-tokens` (custom) | raw px/rem for spacing, radius, type, motion |
| `no-inline-style` | `style={{}}` |
| `no-hardcoded-copy` | UI text outside `en.json` |
| `use-router` | `window.location` navigation (added after run 1) |
| `data-access` | screens importing raw JSON |
| unit | shopping-list maths |
| axe | WCAG 2.1 AA, every route, dark and light |
| visual | screenshot diff, every route, dark and light |

## Your data

Everything lives in your browser: plans and recipes in localStorage, photos (shrunk) in IndexedDB. Settings has **Export** and **Import**: one JSON file, photos included, no account, no server.
