import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) - ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`);
  expect(summary, 'axe violations').toEqual([]);
}

/** Seeds localStorage with a known plan so screens render deterministic content. */
export async function seedPlan(page: Page, plan: { day: string; slot: string; recipeId: string }[], checked: string[] = []) {
  await page.addInitScript(([p, c]) => {
    if (!localStorage.getItem('flavorfam:v1')) {
      localStorage.setItem('flavorfam:v1', JSON.stringify({
        version: 1, checked: c,
        plan: (p as { day: string; slot: string; recipeId: string }[]).map((e, i) => ({ ...e, id: `seed-${i}` })),
      }));
    }
  }, [plan, checked] as const);
}

export const samplePlan = [
  { day: 'mon', slot: 'dinner', recipeId: 'tortilla' },
  { day: 'tue', slot: 'lunch', recipeId: 'lentils-eggs' },
  { day: 'wed', slot: 'breakfast', recipeId: 'mekitsi' },
  { day: 'thu', slot: 'dinner', recipeId: 'salmon-broccoli' },
  { day: 'sat', slot: 'dinner', recipeId: 'shopska-salad' },
];
