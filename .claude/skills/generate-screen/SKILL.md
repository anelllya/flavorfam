---
name: generate-screen
description: Generate a new FlavorFam app screen from a short brief, using only the existing tokens and components, and prove it with the eval gate.
---

# Generate a screen

## Input
A brief from a human: the job of the screen, the data it shows, the actions it allows.
If the brief is missing any of the three, ask before writing code.

## Steps

1. **Read the inventory.** Open `src/components/index.ts` and each component's header comment. List which ones you'll use.
2. **Check for gaps.** If the brief needs something the inventory doesn't have, stop. Write the gap down as a proposal (name, props, which Figma component it extends). Don't build it inside the screen.
3. **Add strings first.** Add every string to `src/i18n/en.json` under one prefix (`week.*`, `list.*`). Plurals get their own keys.
4. **Write the screen** in `src/app/screens/<Name>.tsx`:
   - Start with `<AppHeader title=... />` then `<Page>`.
   - Use `Stack` for spacing. Reach for a CSS module only when Stack can't express the layout.
   - Read and write state only through `useStore()`.
5. **Register the route** in `src/main.tsx` under `/app`.
6. **Add a test** in `tests/screens.spec.ts`: one axe check, one visual snapshot, one behaviour check.
7. **Run `npm run eval`.** Fix every failure. Don't silence a rule. If a rule is wrong, say so in the summary and leave it failing for a human.
8. **Log the run.** Append to `evals/runs.md`: brief, components used, gaps found, first eval result (raw), what you fixed, final result.

## Done means
- `npm run eval` exits 0.
- Zero new components, zero new tokens, unless a human approved the gap.
- The run is logged, including the failures. A clean log with no failures is suspicious, not impressive.
