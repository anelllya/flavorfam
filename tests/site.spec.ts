import { expect, test } from '@playwright/test';
import { expectNoA11yViolations } from './helpers';

for (const path of ['/#/', '/#/system', '/#/thinking', '/#/status']) {
  test(`site ${path} axe`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

test('the old /proof address lands on Status', async ({ page }) => {
  await page.goto('/#/proof');
  await expect(page).toHaveURL(/#\/status$/);
  await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible();
});
