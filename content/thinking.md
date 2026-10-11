# The thinking

> **DRAFT.** Facts are filled in. The opinions are Anelia's to write, in her own words. Every `[ ]` is a question to answer before this ships. Quoted blocks below are Anelia's own words.

## 1. Constrain the inputs and the output can't drift

The system has 23 components, one token file, and a lint rule for every way I've seen generated UI go wrong. The agent can't pick a colour, because there are no colours to pick, only roles. It started with 12. Each of the eleven added since (text and number fields, a bottom sheet, toggles, the tab bar's context row, notices, snackbars, rails, stat tiles, external links and the logo) came from a gap the agent had to stop and propose, or that I asked for. None was invented inside a screen.

The same idea runs through the data. Recipes reference ingredient ids, not names, so "2 cebollas" and "onion x1" can never become two lines on a shopping list. When a recipe comes in from the web, its ingredients are matched to the known list. A name that doesn't match is kept but flagged: "this won't merge with existing items on the shopping list."

[ ] Where did you first learn this the hard way? (TankNET? A past team?)

## 2. What "production-ready" means for generated UI

My bar, in the order the gate checks it:

1. It only uses the system: tokens, components, strings, data access.
2. It's accessible: WCAG 2.1 AA on every route, dark and light.
3. It doesn't change what it wasn't asked to change: visual diff.
4. It does the job: behaviour tests written from the brief.
5. A human looked at it. Every run since run 1 has shown why that's on the list.

The gate runs on demand, not after every change. Between runs, each change is checked with the narrowest command that covers it. The full gate is for when a human asks, or when a skill says to.

[ ] What would you add for a payroll product like Deel? (money, compliance, audit trail)

## 3. The design system disagreed with itself

Six of my own Figma colours failed contrast in light mode, including the brand primary with white text. The gate found it on the first run. I fixed it in the tokens, not in the screens, and wrote every change down in `docs/token-map.md` so it goes back into Figma.

It kept happening. The warning colour fails as text, so warnings became a coloured bar beside muted text. The secondary button's hover state was 3.4:1 in light mode, on every screen. The gate never hovers, so it only showed up when a check happened to leave the mouse on a button. It's fixed in the component.

Not every change was forced. I softened the text colour in both modes because the contrast was too harsh, which is a call the gate can't make. It's the one token change marked as taste, not contrast. Components follow the same rule: what changed in code is listed in `docs/components.md`, waiting to go back into Figma.

[ ] How did it feel to have the gate flag your own brand colour? What did you decide, and why?

## 4. Failures become rules

Run 1 navigated with `window.location`. It worked, so nothing failed. Now it's a lint error. Every review comment that could be a rule should become one, so the next run can't make the same mistake and nobody has to remember to check.

Tests do the same job. In run 2, a test failing for the wrong reason exposed a real bug: going from editing one recipe straight to adding a new one kept the old recipe in the form. That path is a test now. A recipe pasted back from a chat app came with "smart" quotes and wouldn't import. That exact reply is a test fixture now.

[ ] Which rule do you expect to need next?

## 5. Where the evals stop

Visual regression protects against *change*. It can't judge a first render: the first baseline happily accepted a broken layout. Taste, hierarchy and "is this the right screen at all" still need a person.

It isn't airtight against change either. The diff allows 2% of pixels to differ, so a removed button passed in run 2, and a redesigned tab bar passed on one screen in run 3. Nothing checks for consistency: a row of buttons in three different sizes passed every check. I called it a cacophony and it was fixed by hand.

[ ] Where do you think generative UI belongs inside a product, and where should it never go?

## 6. Local-first on purpose

No account, no backend. Your plan, your recipes and their photos live in the browser and leave as one JSON file you can carry to another computer. Photos are shrunk before they're stored, so the file stays small. For a meal planner, that's enough, and it kept the scope honest.

It held even for importing recipes from the web, which normally needs a server to fetch the page. Instead, FlavorFam writes a request for the person's own AI (ChatGPT, Claude or Gemini), the AI reads the page, and the reply is pasted back into the form to check before saving. No API keys, nothing to host, and nothing passes through FlavorFam.

[ ] Why bring-your-own-AI rather than building AI into the product?

## Why a meal planner

> I never thought I'd use this one. But I've always wanted a place, a notebook, for the recipes I find useful: the ones that turned out well when I cooked them, kept together with their source, so I can come back and make them again.
>
> So here they are: a way to write a recipe down, a way to pull one in from the internet and add it to the mix, and a way to put it on the weekly menu, so I can buy everything at once, sorted by supermarket section. It's still imperfect, but it's a start in the right direction.
