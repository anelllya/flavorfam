# Component inventory

Everything an agent may build screens from. The code is `src/components/index.ts`, and the site's System page (`/#/system`) shows each component live.
**Status:** *as Figma* = matches the local components page. *Changed* = differs from Figma. *New* = only in code so far. **Changed** and **New** rows still need to go back into Figma (see the to-do at the end).

## Inventory

| Component | Figma source | Status | Props an agent uses | Notes |
|---|---|---|---|---|
| `AppHeader` | App header (Type=Back link) | **Changed** | `title`, `back` (default `true`) | Title is the page `h1`, now `--text-xl` (Figma: 2xl). Back arrow on every screen; Home passes `back={false}` and gets an empty slot (the sparkle is gone). Back with no history goes to Home. |
| `BottomTabs` | Bottom tabs | **Changed** | none | Neutral `--color-surface` container, rounded top. Top row is the **context bar** (search by default, see `TabBarActions`). Five plain tabs: Home, Recipes, Add, Week, List. The raised centre + is gone. |
| `Button`, `ButtonLink` | Button (Size × State × Type) | **Changed** | `variant` primary · secondary · ghost, `size` large · small, `icon`, `block`; `ButtonLink` adds `to`, `newTab`, `newTabHint` | Small is **44px**, the same as `IconButton`, so mixed rows line up (Figma small: 32px). Secondary hover text is `--color-primary-strong` (7.7:1); primary-on-hover failed AA. Outline width is `--border-control` (1px; Figma: 2px), shared with ChipGroup and ToggleGroup. Ghost isn't in Figma. A `newTab` link ends with the `external` icon (↗) and a screen-reader hint. |
| `Checkbox` | none | **New** | `checked`, `onChange`, `children` | The whole row is the hit target. |
| `ChipGroup` | none (from the small secondary Button) | **New** | `label`, `options`, `value`, `onChange` | Single-select filter chips, `aria-pressed`. |
| `Dialog` | none | **New** | `open`, `title`, `onClose`, `actions`, `children` | Bottom sheet on the native `<dialog>`: focus trap, Escape, backdrop click to close. Used by Add to week. |
| `ExternalLink` | none | **New** | `href`, `children` | Inline text link to another site. Always a new tab, with the `external` icon and a screen-reader hint, like a `newTab` ButtonLink. Recipe sources use it, via `sourceLink()` in `src/lib/source.ts`: only http(s) becomes a link, and bare domains get https://. |
| `Icon` | Outline icon set (24px grid, 2px stroke) | **Changed** | `name`, `size` sm · md · lg | Added `sun`, `moon` (site theme), `edit`, `trash` (recipe actions), `external` (new-tab links), `chevron-down` (Select). `ICON_NAMES` lists them all. |
| `IconButton`, `IconLink` | none (from the Figma icon buttons in the header) | **Changed** | `icon`, `label` (required), `filled`, `tonal`; `IconLink` adds `to`; `IconButton` takes `ref` | `tonal` = neutral round button on a surface (`--color-bg` fill), used in the context bar. Still has no disabled style (see to-do). |
| `IngredientRow` | Ingredient | *as Figma* | `qty`, `unit`, `name`, `note` | |
| `Logo` | FlavorFam logo (black / white SVG) | **New** | `size` (default 34), `label` | One drawing for both themes: the ink uses `--color-logo-ink`, the accents `--color-logo-sand / -spice / -herb`. Decorative unless `label` is given. Site header, Home's app header, and `public/favicon.svg` (which follows the OS theme: a tab icon can't see the site toggle). |
| `Notice` | none | **New** | `tone` info · success · warning · danger, `role` (`alert`), `children` | Status message in the page: tinted fill, strong edge and text from the status tokens. Errors after an action use `role="alert"`; polite messages go inside an always-present `role="status"` element. Replaced four hand-styled versions (draft note, form errors, import status, photo error). |
| `NumberField` | input (Label, Size=Large), numeric | **New** | `label`, `value` (string), `onChange`, `min`, `step`, `error`, `required` | Approved gap from run 2. Shares `TextField`'s styles. |
| `Page`, `Stack` | none | *layout* | `Stack`: `gap` 1–6, `row`, `between`, `as` | Layout primitives so screens need no spacing CSS. |
| `RecipeTile` | Recipe-Category-image / Level=Recipe | **Changed** | `recipe`, `to`, `photo`, `caption` | Shows the user's photo when there is one; otherwise a typographic tile tinted by category. Draft badge. `caption` is a muted line under the title ("Mon · Dinner" on Home). |
| `Rail` | none | **New** | `label`, `children` | Horizontal scroller for cards: runs to the screen edge, 2.4 cards per view so the next one is cut off (the scroll cue), snaps card by card. A named list; each child is a list item. Bleeds over the Page's side padding. |
| `SearchField` | input / Size=Large, search | **Changed** | `label`, `placeholder`, `value`, `onChange`, `autoFocus` | Now only used in the tab bar's search row. The browser's own clear × still shows next to the close × (open item). |
| `SectionHeader` | Recipe-head-element | *as Figma* | `title`, `action`, `as`, `id` | |
| `Select` | input (Label, Size=Large), native select | **Changed** | `label`, `value`, `options`, `onChange` | The browser's arrow is replaced by the `chevron-down` icon, inset `--space-4` from the border like the text. |
| `Snackbar`, `SnackbarProvider`, `SnackbarHost`, `useSnackbar` | none | **New** | `useSnackbar().show(message, tone?)` | Confirms a finished action: Recipe saved, Recipe deleted, added to the week, file imported. Solid fill in the status colour, sits just above the tab bar, survives navigation (provider in `AppShell`), announced politely. Stays 5s, paused while hovered or focused, with a Dismiss button. |
| `StatTile` | none (RecipeTile's shape) | **New** | `value`, `label`, `caption`, `to`, `tone` green · orange · brown | A number on a tinted tile. Home uses it for shopping-list aisles. The number is decorative; label and caption carry the meaning. |
| `TabBarActions`, `TabBarProvider` | none | **New** | `children` | A screen's actions in the tab bar's top row (Add to week, Save/Cancel, Edit/Delete). Rendered through a portal; `AppShell` provides it. Without actions, the row shows search. |
| `TextField` | input (Label, Size=Large) | **New** | `label`, `value`, `onChange`, `multiline`, `suggestions`, `warning`, `error`, `required` | Approved gap from run 2. `warning` is an amber tinted bar (`--color-warning-subtle`, `--color-warning` text); `error` is `--color-danger` text and a red outline on the field. |
| `ToggleGroup` | none (from the chip spec) | **New** | `label`, `options` (`value`, `label`, `ariaLabel`), `value[]`, `onChange` | Multi-select toggles in an even grid, `aria-pressed`. `ariaLabel` gives a full name to short labels (Mon → Monday). |

## Patterns that aren't components

- **Context bar:** the tab bar's top row belongs to the screen. One main action fills the row (`flex: 1` in the screen's CSS module); icon actions keep their 44px. All items are 44px tall.
- **Photo in a recipe:** read mode shows it (4:3, `--radius-lg`); add, change and remove only in the edit form, and they apply on Save.
- **Delete:** confirm with `window.confirm`. Only your own recipes and the seed placeholders can be deleted; Mama's recipes can be edited, not deleted.

## Tokens added alongside

`--color-on-featured` (text on featured tiles), the softer `--color-text`, and `--border-control` (outline width of buttons, chips and toggles). Both are recorded in [token-map.md](token-map.md).

## Figma to-do

1. Add **Rail**, **StatTile** and RecipeTile's caption (Home). Add **Notice** and **Snackbar** with the four status tones. Make the logo a component with light and dark variants bound to the logo variables. Add the **New** components: Checkbox, ChipGroup, Dialog (bottom sheet), TextField and NumberField (as `input` variants), ToggleGroup, and the context-bar row.
2. Update **Bottom tabs** to the two-row layout, and **App header** to the smaller title with the back arrow as the default.
3. **Button, chips, toggles:** one outline width (`--border-control`, 1px), small = 44px, add the ghost type, secondary hover text = primary-strong.
4. **Icon buttons:** add the tonal style, and design a **disabled** state (it has none in Figma or code).
5. **Icons:** add sun, moon, edit, trash, external, chevron-down. **Select:** chevron inset from the border. **Button:** a trailing-icon slot for new-tab links.
6. Decide whether destructive actions (Delete) need a warning or error style. Today they're neutral and rely on the confirm step.
