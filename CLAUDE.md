# FlavorFam: rules for agents

This repo is a design system that AI generates against. The meal planner is the test subject.
Humans own taste (tokens, components, Figma). Agents own assembly. Evals decide what ships.

## Hard rules (CI fails if you break them)

1. **No raw values.** Colours, spacing, radii, font sizes, weights, line heights and durations come from tokens only:
   `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--border-*)`, `var(--text-*)`, `var(--weight-*)`, `var(--leading-*)`, `var(--motion-*)`, `var(--size-*)`.
   The only file with literals is `src/styles/tokens.css`, which is generated. Never edit it. Edit `tokens/tokens.json` only if a human asked.
2. **No new components in screens.** Build from `src/components/index.ts`. If something is missing, stop and say so in your summary. Do not invent a one-off.
3. **No inline styles.** No `style={{}}`. A screen may have a CSS module for layout only (grid, flex, sizes), still using tokens.
4. **No hardcoded copy.** Every visible string goes through `t()` and lives in `src/i18n/en.json`. Keys are `area.thing`.
5. **Data through `src/data`.** Never import JSON directly in a screen. Shopping maths lives in `src/lib/shopping.ts`.
6. **Accessible by default.** Every page has one `h1` (AppHeader provides it). Icon-only controls need `label`. Form controls need labels. axe must pass with zero violations.
7. **Mobile first.** Design for 393px wide (the Figma frame). The app shell caps width at `--size-content-max`.

## Commands

- `npm run dev`: local app
- `npm run eval`: the full gate (typecheck, lint, stylelint, unit, axe, visual). On demand only: run it when a human asks, or when a skill you were asked to run says to. Don't run it by default at the end of a task; check your change with the narrowest command instead (`npx tsc --noEmit`, `npx stylelint <file>`, `npx eslint <file>`).
- `npm run tokens`: rebuild CSS variables from `tokens/tokens.json`

## Source of truth

- Figma: FlavourFam, variable collection "Let's eat" (Light + Dark modes), local components page.
- Token renames from Figma are listed in `docs/token-map.md`.
- Components, their Figma source and what Figma still lacks are in `docs/components.md`. When you add or change a component, update it and the System page (`src/site/SystemPage.tsx`).
- If Figma and code disagree, ask. Don't pick.

## Skills

- `.claude/skills/generate-screen/SKILL.md`: how to generate a new screen.
