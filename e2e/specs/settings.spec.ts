import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import { createTournamentViaApi } from '../fixtures/tournament';
import { TournamentSetupPage } from '../pages/TournamentSetupPage';
import { makeTestUser, TestUser } from '../fixtures/data';

test.describe('PARAM — Paramètres du tournoi', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    user = makeTestUser();
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);
  });

  // PARAM-01
  test('PARAM-01 : sélection du format de jeu avec auto-remplissage de la durée', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('settings');

    const durationBefore = await page.inputValue('#estimated_match_duration');

    await page.locator('[inputId="game_format"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option').first().click();

    const durationAfter = await page.inputValue('#estimated_match_duration');
    expect(durationAfter).not.toBe('');
    expect(parseInt(durationAfter, 10)).toBeGreaterThan(0);
    expect(durationAfter).not.toEqual(durationBefore);
  });

  // PARAM-02
  test('PARAM-02 : saisie manuelle de la durée estimée', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('settings');

    await page.locator('[inputId="configuration"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option').first().click();
    await expect(page.locator('.p-select-overlay')).not.toBeVisible({ timeout: 3_000 });

    await page.locator('[inputId="game_format"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option').first().click();

    const durationInput = page.locator('#estimated_match_duration');
    await durationInput.fill('90');
    await durationInput.press('Tab');

    const saveBtn = page.getByRole('button', { name: 'Sauvegarder' });
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    await saveBtn.click();
    // No toast — save resets form to untouched → button disabled again
    await expect(saveBtn).toBeDisabled({ timeout: 8_000 });

    await setupPage.goto(tournamentId);
    await setupPage.clickTab('settings');
    const savedVal = await page.locator('#estimated_match_duration').inputValue();
    expect(parseInt(savedVal, 10)).toBe(90);
  });

  // PARAM-03
  test('PARAM-03 : ajout d\'un créneau horaire', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('settings');

    await setupPage.addTimeSlot('09:00', '12:00', 4);

    await expect(page.locator('text=09:00')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=12:00')).toBeVisible();
    await expect(page.locator('text=4 terrain')).toBeVisible();
  });

  // PARAM-04
  test('PARAM-04 : modification d\'un créneau horaire', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.request.post(`http://localhost:8000/api/v1/tournaments/${tournamentId}/time-slots/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { start_time: '09:00:00', end_time: '12:00:00', courts_available: 4 },
    });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('settings');

    // pTooltip is on p-button host, not the inner button — use icon to identify
    await page.locator('button:has(.bi-pencil)').first().click();

    // Edit form courts: p-inputnumber with no inputId (add form uses inputId="courts_available")
    const courtsInput = page.locator('p-inputnumber:not([inputid]) input');
    await courtsInput.click();
    await courtsInput.clear();
    await courtsInput.pressSequentially('6');
    await courtsInput.press('Tab');

    await page.locator('button:has(.bi-check-lg)').first().click();

    await expect(page.locator('text=6 terrain')).toBeVisible({ timeout: 8_000 });
  });

  // PARAM-05
  test('PARAM-05 : suppression d\'un créneau horaire', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.request.post(`http://localhost:8000/api/v1/tournaments/${tournamentId}/time-slots/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { start_time: '10:00:00', end_time: '13:00:00', courts_available: 3 },
    });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('settings');

    await expect(page.locator('text=10:00')).toBeVisible();
    // pTooltip is on p-button host, not the inner button — use icon to identify
    await page.locator('button:has(.bi-trash)').first().click();

    await expect(page.locator('text=10:00')).not.toBeVisible({ timeout: 8_000 });
  });

  // PARAM-06
  test('PARAM-06 : validation des bornes de durée estimée', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('settings');

    await page.locator('[inputId="configuration"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option').first().click();
    await expect(page.locator('.p-select-overlay')).not.toBeVisible({ timeout: 3_000 });

    await page.locator('[inputId="game_format"]').click();
    await expect(page.locator('.p-select-overlay')).toBeVisible({ timeout: 5_000 });
    await page.locator('.p-select-overlay .p-select-option').first().click();

    const durationInput = page.locator('#estimated_match_duration');
    const saveBtn = page.getByRole('button', { name: 'Sauvegarder' });

    await durationInput.fill('0');
    await durationInput.press('Tab');
    await expect(saveBtn).toBeDisabled();

    await durationInput.fill('200');
    await durationInput.press('Tab');
    await expect(saveBtn).toBeDisabled();
  });
});
