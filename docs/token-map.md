# Figma to code token map

Primitives (`🌈 Colors/*`, `↕ Spacing/*`) are copied verbatim from the Figma collection "Let's eat".
Semantic variables are renamed for meaning. **Changed** and **Added** rows are decisions made in code that need to go back into Figma.

| Figma variable | CSS variable | Light | Dark | Status |
|---|---|---|---|---|
| textColor | --color-text | **Gray-800** (Figma: Gray-950) | **Gray-300** (Figma: Gray-100) | **Changed**: by taste, softer text on both backgrounds (15.2:1 light, 13.3:1 dark) |
| backgroundColor | --color-bg | White | Gray-950 | as Figma |
| primary01 | --color-primary | **Brown-600** (Figma: Brown-500) | Brown-400 | **Changed**: white on Brown-500 is 3.4:1, fails AA |
| primary02 | --color-primary-subtle | Brown-300 | Brown-700 | as Figma |
| primary03 | --color-primary-strong | **Brown-800** (Figma: Brown-700) | Brown-300 | **Changed**: hover state for the new primary |
| textColorHover | --color-text-hover | **Brown-700** (Figma: Brown-600) | Brown-400 | **Changed**: tab labels on Brown-200 failed AA |
| textColorHoverBg | --color-hover-bg | Brown-300 | Brown-800 | as Figma |
| secondary01 | --color-secondary | **Green-700** (Figma: Green-500) | Green-400 | **Changed**: contrast |
| accent01 | --color-accent | Orange-500 | Orange-400 | as Figma |
| disabled | --color-disabled | **Gray-500** (Figma: Gray-400) | Gray-400 | **Changed**: contrast |
| headerAndFooter | --color-surface-bar | Brown-200 | Brown-900 | as Figma |
| headerBackground | --color-header-bg | white 72% | Gray-950 72% | as Figma |
| featuredOrange | --color-featured-orange | Orange-300 | **Orange-600** (Figma: Orange-500) | **Changed**: tile labels failed AA in dark |
| featuredGreen | --color-featured-green | Green-300 | **Green-700** (Figma: Green-600) | **Changed**: same |
| featuredBrown | --color-featured-brown | Brown-300 | Brown-600 | as Figma |
| information / success / warning / error | --color-info / -success / -warning / **-danger** | Sky-700 / Lime-800 / **Amber-800** / Red-700 (Figma: #0284c7 / #65a30d / #f97316 / #dc2626) | Sky-300 / Lime-300 / Amber-300 / Red-300 | **Changed**: the Figma values were too faint to read as status (warning failed AA as text). Strong colour for text, icons, edges and fills; AA on bg, surface and its own tint in both modes. Warning moved from orange to amber so it can't be mistaken for the brand's orange accent. `error` is renamed `danger`. |
| (none) | --color-{status}-subtle | Sky / Lime / Amber / Red 100 | same, 900 | **Added**: tinted background for notices |
| (none) | --color-on-{status} | White | Gray-950 | **Added**: text on a solid status fill (e.g. a destructive button) |
| (none) | --color-text-muted | Gray-600 | Gray-400 | **Added** |
| (none) | --color-surface | Gray-100 | Gray-900 | **Added** |
| (none) | --color-border | Gray-500 | Gray-500 | **Added**, from the input stroke |
| (none) | --color-focus | Green-700 | Green-400 | **Added**, from the input focus stroke |
| (none) | --color-on-featured | Gray-800 | Gray-100 | **Added**: text on featured tiles; Gray-300 on Brown-600 is 3.7:1, fails AA |
| (none) | --color-logo-ink | Gray-950 | Gray-100 | **Added**: the logo's main shape (black logo / white logo) |
| (none) | --color-logo-sand / -spice / -herb | Brown-300 / Orange-400 / Green-500 | same | **Added**: logo accents, from the logo SVGs |
| (none) | --color-on-primary | White | Gray-950 | **Added**: white on Brown-400 fails in dark |

Type: Mulish (body) and Source Sans 3 (buttons, tabs), as in Figma. `--text-display` (56px) was **added** for the portfolio headline.
`--border-control` (1px) was **added**: one outline width for every outlined control (Button, ChipGroup, ToggleGroup). Figma's buttons use 2px; change the token to try other widths (0.5 = hairline).
Radii in Figma are bound to spacing variables (24, 12, 8). In code they're their own scale: `--radius-sm|md|lg|pill`.

Every change above was forced by the axe check in the eval gate, except the textColor softening, which was a design call. See `evals/runs.md`.
