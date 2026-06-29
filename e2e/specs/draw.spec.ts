import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi } from '../fixtures/auth';
import { makeTestUser, TestUser } from '../fixtures/data';

test.describe('DRAW — Outil tirage au sort', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    user = makeTestUser();
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);
  });

  // DRAW-01
  test('DRAW-01 : tirage de 8 éléments révélés un à un sans doublon', async ({ page }) => {
    await page.goto('/draw');
    await page.waitForLoadState('networkidle');

    await page.locator('[inputId="draw-count"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option', { hasText: '8' }).click();

    await page.getByRole('button', { name: 'Mélanger' }).click();

    await expect(page.locator('button.flip-container')).toHaveCount(8);

    const chips = page.locator('button.flip-container');
    for (let i = 0; i < 8; i++) {
      await expect(chips.nth(i)).toHaveAttribute('aria-pressed', 'false');
    }

    const values: string[] = [];
    for (let i = 0; i < 8; i++) {
      await chips.nth(i).click();
      await expect(chips.nth(i)).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 });
      const label = await chips.nth(i).getAttribute('aria-label');
      const valueMatch = label?.match(/valeur (\d+)/);
      if (valueMatch) values.push(valueMatch[1]);
    }

    const unique = new Set(values);
    expect(unique.size).toBe(8);
  });

  // DRAW-02
  test('DRAW-02 : réinitialisation du tirage', async ({ page }) => {
    await page.goto('/draw');
    await page.waitForLoadState('networkidle');
    await page.locator('[inputId="draw-count"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option', { hasText: '8' }).click();
    await page.getByRole('button', { name: 'Mélanger' }).click();

    await page.locator('button.flip-container').first().click();
    await expect(page.locator('button.flip-container').first()).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Mélanger' }).click();

    const chips = page.locator('button.flip-container');
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'false');
  });

  // DRAW-03
  test('DRAW-03 : changement du nombre d\'éléments', async ({ page }) => {
    await page.goto('/draw');
    await page.waitForLoadState('networkidle');

    await page.locator('[inputId="draw-count"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option', { hasText: /^2$/ }).click();
    await page.getByRole('button', { name: 'Mélanger' }).click();
    await expect(page.locator('button.flip-container')).toHaveCount(2);

    await page.locator('[inputId="draw-count"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option', { hasText: '16' }).click();
    await page.getByRole('button', { name: 'Mélanger' }).click();
    await expect(page.locator('button.flip-container')).toHaveCount(16);

    const chips = page.locator('button.flip-container');
    const values: string[] = [];
    for (let i = 0; i < 16; i++) {
      await chips.nth(i).click();
      // Wait for flip to complete (aria-pressed updates after OnPush CD)
      await expect(chips.nth(i)).toHaveAttribute('aria-pressed', 'true', { timeout: 3_000 });
      const label = await chips.nth(i).getAttribute('aria-label');
      const valueMatch = label?.match(/valeur (\d+)/);
      if (valueMatch) values.push(valueMatch[1]);
    }
    expect(new Set(values).size).toBe(16);
  });
});
