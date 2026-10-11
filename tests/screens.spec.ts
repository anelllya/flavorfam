import { expect, test } from '@playwright/test';
import seedRecipesJson from '../src/data/recipes.json' with { type: 'json' };
import { expectNoA11yViolations, samplePlan, seedPlan } from './helpers';

const routes = [
  { name: 'home', path: '/#/app' },
  { name: 'recipes', path: '/#/app/recipes' },
  { name: 'recipe', path: '/#/app/recipes/lentils-eggs' },
  { name: 'recipe-mama', path: '/#/app/recipes/kozunak' },
  { name: 'settings', path: '/#/app/settings' },
  { name: 'week', path: '/#/app/week' },
  { name: 'list', path: '/#/app/list' },
  { name: 'recipe-new', path: '/#/app/recipes/new' },
];

for (const r of routes) {
  test.describe(r.name, () => {
    test.beforeEach(async ({ page }) => { await seedPlan(page, samplePlan); });

    test('axe', async ({ page }) => {
      await page.goto(r.path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expectNoA11yViolations(page);
    });

    test('visual', async ({ page }) => {
      await page.goto(r.path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${r.name}.png`, { fullPage: true });
    });
  });
}

test('recipe search filters the grid', async ({ page }) => {
  await page.goto('/#/app/recipes');
  await page.getByRole('button', { name: 'Search recipes' }).click();
  await page.getByRole('searchbox', { name: 'Search recipes' }).fill('banitsa');
  await expect(page.getByRole('link', { name: /Macedonian banitsa/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '1 recipes' })).toBeVisible();
});

test('add to week from a recipe persists across reload', async ({ page }) => {
  await page.goto('/#/app/recipes/waffles');
  await page.getByRole('button', { name: 'Add to week' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add to week' });
  await sheet.getByRole('button', { name: 'Friday' }).click();
  await sheet.getByRole('button', { name: 'Dinner' }).click();
  await sheet.getByRole('button', { name: 'Breakfast' }).click();
  await sheet.getByRole('button', { name: 'Add to 1 meal' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Added' })).toHaveText('Added to 1 meal this week.');
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flavorfam:v1') ?? '{}'));
  expect(saved.plan).toHaveLength(1);
  expect(saved.plan[0]).toMatchObject({ day: 'fri', slot: 'breakfast', recipeId: 'waffles' });
});

test('week: pick a recipe for an empty slot, then it shows up on the list', async ({ page }) => {
  await page.goto('/#/app/week');
  await page.getByRole('link', { name: 'Add a recipe to Sunday lunch' }).click();
  await page.getByRole('link', { name: /Shopska salad/ }).click();
  await page.getByRole('button', { name: 'Add to Sunday lunch' }).click();
  await expect(page.getByRole('link', { name: 'Shopska salad' })).toBeVisible();
  await page.goto('/#/app/list');
  await expect(page.getByText('Sirene (white brine cheese)')).toBeVisible();
});

test('list: ticks persist and aggregate across recipes', async ({ page }) => {
  await seedPlan(page, samplePlan);
  await page.goto('/#/app/list');
  const eggs = page.getByRole('checkbox', { name: /Eggs/ });
  await expect(page.getByText(/^4\s+Eggs/)).toBeVisible();
  await eggs.check();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Eggs/ })).toBeChecked();
});

test('add recipe: the + opens the form, empty save shows errors and stays accessible', async ({ page }) => {
  await page.goto('/#/app');
  await page.getByRole('link', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New recipe' })).toBeVisible();
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByText('Give the recipe a name.')).toBeVisible();
  await expect(page.getByText('Add at least one ingredient.')).toBeVisible();
  await expect(page.getByLabel('Recipe name', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expectNoA11yViolations(page);
});

test('add recipe: save, plan it, and its ingredients reach the shopping list', async ({ page }) => {
  await page.goto('/#/app/recipes/new');
  await page.getByLabel('Recipe name', { exact: true }).fill('Garlic eggs');
  await page.getByLabel('Category', { exact: true }).selectOption('breakfast');
  await page.getByLabel('Ingredient 1', { exact: true }).fill('Eggs');
  await expect(page.getByLabel('Unit', { exact: true })).toHaveValue('pcs');
  await page.getByLabel('Quantity', { exact: true }).first().fill('3');
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await page.getByLabel('Ingredient 2', { exact: true }).fill('Wild garlic');
  await expect(page.getByText("New ingredient: it won't merge")).toBeVisible();
  await page.getByLabel('Quantity', { exact: true }).nth(1).fill('20');
  await page.getByLabel('Step 1', { exact: true }).fill('Fry the garlic, add the eggs.');
  await page.getByRole('button', { name: 'Save recipe' }).click();

  await expect(page.getByRole('heading', { name: 'Garlic eggs' })).toBeVisible();
  await expect(page.getByText('Wild garlic')).toBeVisible();
  await page.getByRole('button', { name: 'Add to week' }).click();
  await page.getByRole('button', { name: 'Sunday' }).click();
  await page.getByRole('button', { name: 'Dinner' }).click();
  await page.getByRole('button', { name: 'Breakfast' }).click();
  await page.getByRole('button', { name: 'Add to 1 meal' }).click();

  await page.reload();
  await page.goto('/#/app/list');
  await expect(page.getByRole('checkbox', { name: /Wild garlic/ })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /^3\s+Eggs/ })).toBeVisible();

  await page.goto('/#/app/recipes?f=mine');
  await expect(page.getByRole('link', { name: /Garlic eggs/ })).toBeVisible();
});

test("edit and delete your own recipe; Mama's recipes edit but never delete", async ({ page }) => {
  await page.goto('/#/app/recipes/waffles/edit');
  await expect(page.getByLabel('Recipe name', { exact: true })).toHaveValue('Waffles');
  await expect(page.getByRole('button', { name: 'Delete recipe' })).toHaveCount(0);

  await page.goto('/#/app/recipes/new');
  await page.getByLabel('Recipe name', { exact: true }).fill('Toast');
  await page.getByLabel('Ingredient 1', { exact: true }).fill('Butter');
  await page.getByLabel('Quantity', { exact: true }).fill('10');
  await page.getByLabel('Step 1', { exact: true }).fill('Toast it.');
  await page.getByRole('button', { name: 'Save recipe' }).click();

  await page.getByRole('link', { name: 'Edit recipe' }).click();
  await page.getByLabel('Recipe name', { exact: true }).fill('Butter toast');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Butter toast' })).toBeVisible();

  await page.getByRole('link', { name: 'Edit recipe' }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete recipe' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Recipes' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Butter toast/ })).toHaveCount(0);
});

test('import from the web: an AI reply fills the form, a bad one is refused', async ({ page }) => {
  await page.goto('/#/app/recipes/new');
  const reply = page.getByLabel("Paste the AI's reply", { exact: true });
  await reply.fill('Sorry, I cannot open links.');
  await page.getByRole('button', { name: 'Fill the form' }).click();
  await expect(page.getByText("That reply isn't a recipe FlavorFam can read.")).toBeVisible();

  await reply.fill('```json\n' + JSON.stringify({
    title: 'Shakshuka', category: 'breakfast', servings: 2, timeMinutes: 25,
    ingredients: [{ name: 'Eggs', qty: 4, unit: 'pcs' }, { name: 'Harissa', qty: 1, unit: 'tablespoon' }],
    steps: ['Simmer the tomatoes.', 'Crack in the eggs.'], source: 'https://example.com/shakshuka',
  }) + '\n```');
  await page.getByRole('button', { name: 'Fill the form' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Form filled from the reply' })).toBeVisible();
  await expect(page.getByLabel('Recipe name', { exact: true })).toHaveValue('Shakshuka');
  await expect(page.getByLabel('Unit').nth(1)).toHaveValue('tbsp');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Shakshuka' })).toBeVisible();
  const source = page.getByRole('link', { name: 'example.com (opens in a new tab)' });
  await expect(source).toHaveAttribute('href', 'https://example.com/shakshuka');
  await expect(source).toHaveAttribute('target', '_blank');
});

test('edit a built-in recipe from the tab bar: the edit replaces it and the plan keeps it', async ({ page }) => {
  await seedPlan(page, samplePlan);
  await page.goto('/#/app/recipes/lentils-eggs');
  await page.getByRole('link', { name: 'Edit recipe' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Edit recipe' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete recipe' })).toHaveCount(0);
  await page.getByLabel('Recipe name', { exact: true }).fill("Mum's lentils with eggs");
  await page.getByRole('button', { name: 'Save recipe' }).click();

  await expect(page.getByRole('heading', { name: "Mum's lentils with eggs" })).toBeVisible();
  await page.goto('/#/app/week');
  await expect(page.getByRole('link', { name: "Mum's lentils with eggs" })).toBeVisible();
});

// Runs only while the seed data has a placeholder (draft) recipe; there are none right now.
const draft = (seedRecipesJson as { id: string; title: string; draft?: boolean }[]).find((r) => r.draft);
test('delete a draft from the tab bar: it leaves the list and the week, and stays gone', async ({ page }) => {
  test.skip(!draft, 'no placeholder recipes in the seed data');
  await seedPlan(page, [{ day: 'mon', slot: 'dinner', recipeId: draft!.id }]);
  await page.goto(`/#/app/recipes/${draft!.id}`);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete recipe' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Recipes' })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(draft!.title) })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('link', { name: new RegExp(draft!.title) })).toHaveCount(0);
});

test("edit Mama's recipe: the change sticks, the Bulgarian title stays", async ({ page }) => {
  await page.goto('/#/app/recipes/waffles');
  await page.getByRole('link', { name: 'Edit recipe' }).click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Mama adds a pinch of cinnamon.');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByText('Mama adds a pinch of cinnamon.')).toBeVisible();
  await expect(page.getByText('Гофрети')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Mama adds a pinch of cinnamon.')).toBeVisible();
});

test('All lists the most recently added or edited recipe first', async ({ page }) => {
  await page.goto('/#/app/recipes/new');
  await page.getByLabel('Recipe name', { exact: true }).fill('Zucchini fritters');
  await page.getByLabel('Ingredient 1', { exact: true }).fill('Eggs');
  await page.getByLabel('Quantity', { exact: true }).first().fill('2');
  await page.getByLabel('Step 1', { exact: true }).fill('Fry.');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await page.goto('/#/app/recipes');
  await expect(page.getByRole('main').getByRole('listitem').first()).toContainText('Zucchini fritters');

  await page.goto('/#/app/recipes/waffles/edit');
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Crispier with sparkling water.');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await page.goto('/#/app/recipes');
  const tiles = page.getByRole('main').getByRole('listitem');
  await expect(tiles.first()).toContainText('Waffles');
  await expect(tiles.nth(1)).toContainText('Zucchini fritters');
});

test('context bar: search on list screens, recipe actions on a recipe, Save/Cancel on the form', async ({ page }) => {
  await page.goto('/#/app/recipes');
  await expect(page.getByRole('button', { name: 'Search recipes' })).toBeVisible();

  await page.goto('/#/app/recipes/waffles');
  await expect(page.getByRole('button', { name: 'Search recipes' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add to week' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit recipe' })).toBeVisible();

  await page.getByRole('link', { name: 'Edit recipe' }).click();
  await expect(page.getByRole('button', { name: 'Save recipe' })).toBeVisible();
  await page.getByLabel('Recipe name', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByLabel('Recipe name', { exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Waffles' })).toBeVisible();

  await page.goto('/#/app/list');
  await expect(page.getByRole('button', { name: 'Search recipes' })).toBeVisible();
});

test('add to week: one dish across several meals, toggles are accessible, repeats are skipped', async ({ page }) => {
  await page.goto('/#/app/recipes/chicken-traybake');
  await page.getByRole('button', { name: 'Add to week' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add to week' });
  await expect(sheet.getByRole('button', { name: 'Pick at least one day and one meal.' })).toBeDisabled();
  await sheet.getByRole('button', { name: 'Monday' }).click();
  await sheet.getByRole('button', { name: 'Wednesday' }).click();
  await sheet.getByRole('button', { name: 'Lunch' }).click();
  await expect(sheet.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true');
  await expectNoA11yViolations(page);
  await sheet.getByRole('button', { name: 'Add to 4 meals' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Added to 4 meals this week.' })).toHaveText('Added to 4 meals this week.');

  await page.getByRole('button', { name: 'Add to week' }).click();
  // Meals are remembered between opens (Lunch + Dinner); only the days reset.
  await sheet.getByRole('button', { name: 'Monday' }).click();
  await sheet.getByRole('button', { name: 'Add to 2 meals' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Already planned for those meals.' })).toHaveText('Already planned for those meals.');

  await page.goto('/#/app/week');
  await expect(page.getByRole('link', { name: 'Chicken and Potato Traybake' })).toHaveCount(4);
});

test('shopping list: seasonings sit together under Spices & seasonings', async ({ page }) => {
  await seedPlan(page, samplePlan);
  await page.goto('/#/app/list');
  await expect(page.getByRole('region', { name: 'Spices & seasonings' }).getByText(/Salt/).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pantry' }).getByText(/Salt/)).toHaveCount(0);
});

test('a seed recipe source with no https:// still becomes a safe new-tab link', async ({ page }) => {
  await page.goto('/#/app/recipes/chocolate-yoghurt-cake');
  const source = page.getByRole('link', { name: /recepti\.gotvach\.bg/ });
  await expect(source).toHaveAttribute('href', 'https://recepti.gotvach.bg/r-58545');
  await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
});

test('one dish per slot: adding to a planned meal replaces it and says so', async ({ page }) => {
  await seedPlan(page, samplePlan);
  await page.goto('/#/app/recipes/lentils-eggs');
  await page.getByRole('button', { name: 'Add to week' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add to week' });
  await expect(sheet.getByText('meals already planned are replaced')).toBeVisible();
  await sheet.getByRole('button', { name: 'Monday' }).click();
  await sheet.getByRole('button', { name: 'Add to 1 meal' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Added to 1 meal this week. 1 planned meal was replaced.' })).toHaveText('Added to 1 meal this week. 1 planned meal was replaced.');
  await page.goto('/#/app/week');
  await expect(page.getByRole('link', { name: 'Chicken and Potato Traybake' })).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flavorfam:v1') ?? '{}'));
  expect(saved.plan.filter((p: { day: string; slot: string }) => p.day === 'mon' && p.slot === 'dinner')).toHaveLength(1);
});

test('snackbar: saving confirms with a snackbar that can be dismissed', async ({ page }) => {
  await page.goto('/#/app/recipes/waffles/edit');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Waffles' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Recipe saved.' })).toHaveText('Recipe saved.');
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByRole('button', { name: 'Dismiss' })).toHaveCount(0);
  await expectNoA11yViolations(page);
});

test('home: three scrollable rails with counters', async ({ page }) => {
  await seedPlan(page, samplePlan);
  await page.goto('/#/app');
  await expect(page.getByText('5 of 21 meals planned')).toBeVisible();
  await expect(page.getByText(/^0 of \d+ ticked$/)).toBeVisible();
  const recent = page.getByRole('list', { name: 'Recent recipes' });
  await expect(recent.getByRole('listitem')).toHaveCount(5);
  await expect(page.getByRole('list', { name: 'This week' }).getByRole('listitem').first()).toContainText('Mon · Dinner');
  const scrolls = await recent.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scrolls).toBe(true);
});
