import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import {
  createTournamentViaApi,
  addRankedPairsViaApi,
  setGameFormatViaApi,
  generateBracketViaApi,
  getMatchesViaApi,
  startMatchViaApi,
  scoreMatchViaApi,
  setupFullTournamentWithBracket,
} from '../fixtures/tournament';
import { TournamentSetupPage } from '../pages/TournamentSetupPage';
import { makeTestUser, TestUser } from '../fixtures/data';

test.describe('BRAK — Tableau / Bracket', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    user = makeTestUser();
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);
  });

  // BRAK-01
  test('BRAK-01 : génération d\'un bracket', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);
    await addRankedPairsViaApi(page.request, token, tournamentId, 8);
    await setGameFormatViaApi(page.request, token, tournamentId);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');

    await page.locator('[inputId="dimension"]').click();
    await page.locator('.p-select-overlay .p-select-option', { hasText: '8' }).click();

    // nb_pair_round_8 becomes required when dimension=8 (all 8 pairs enter at quarters)
    const nbPairRound8 = page.locator('[inputId="nb_pair_round_8"]');
    if (await nbPairRound8.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await nbPairRound8.click();
      await page.locator('.p-select-overlay .p-select-option', { hasText: /^8$/ }).click();
    }

    await page.getByRole('button', { name: 'Générer le tableau' }).click();

    await expect(page.locator('app-bracket-chart')).toBeVisible({ timeout: 15_000 });
  });

  // BRAK-02
  test('BRAK-02 : tirage au sort automatique', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);
    await addRankedPairsViaApi(page.request, token, tournamentId, 8);
    await setGameFormatViaApi(page.request, token, tournamentId);
    await generateBracketViaApi(page.request, token, tournamentId, 8);

    // The pairs panel (with "Tirage au sort" button) is hidden sm:flex — requires ≥640px viewport
    await page.setViewportSize({ width: 1024, height: 768 });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');

    const drawBtn = page.getByRole('button', { name: 'Placer automatiquement les paires' });
    await expect(drawBtn).toBeVisible({ timeout: 10_000 });
    await drawBtn.click();

    const confirmBtn = page.locator('.p-confirmdialog button', { hasText: /oui|confirmer/i });
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await expect(page.locator('app-bracket-chart')).toBeVisible({ timeout: 10_000 });
    // After draw, all slots should be filled (no "Choisir une paire" text)
    await expect(page.locator('app-bracket-chart').getByText('Choisir une paire')).toHaveCount(0, { timeout: 8_000 });
  });

  // BRAK-03
  test('BRAK-03 : placement manuel d\'une paire', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);
    await addRankedPairsViaApi(page.request, token, tournamentId, 8);
    await setGameFormatViaApi(page.request, token, tournamentId);
    await generateBracketViaApi(page.request, token, tournamentId, 8);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');

    // Empty slots show "Choisir une paire" text (not .bi-question-circle which is for match view)
    const emptySlot = page.locator('app-bracket-chart').getByText('Choisir une paire').first();
    await expect(emptySlot).toBeVisible({ timeout: 10_000 });
    await emptySlot.click();

    // p-dialog is rendered at body level (appendTo="body") — check [role="dialog"] not the host element
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 });

    const firstPairOption = page.locator('[role="dialog"] .p-dialog-content div[class*="cursor-pointer"]').first();
    await expect(firstPairOption).toBeVisible();
    await firstPairOption.click();

    await page.waitForTimeout(1_000);
  });

  // BRAK-04
  test('BRAK-04 : suppression du bracket', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);
    await addRankedPairsViaApi(page.request, token, tournamentId, 8);
    await setGameFormatViaApi(page.request, token, tournamentId);
    await generateBracketViaApi(page.request, token, tournamentId, 8);

    // "Supprimer le tableau" button is hidden sm:flex — requires ≥640px viewport
    await page.setViewportSize({ width: 1024, height: 768 });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');

    await expect(page.locator('app-bracket-chart')).toBeVisible({ timeout: 10_000 });

    const deleteBtn = page.getByRole('button', { name: 'Supprimer le tableau' }).first();
    await deleteBtn.click();

    const confirmBtn = page.locator('.p-confirmdialog button', { hasText: /oui|confirmer|supprimer/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    await expect(page.locator('app-generate-bracket')).toBeVisible({ timeout: 10_000 });
  });

  // BRAK-06 (PARTIEL — teste les sélecteurs CSS, pas la lisibilité visuelle)
  test('BRAK-06 : noms des paires présents dans l\'arbre du bracket', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');

    await expect(page.locator('app-bracket-chart')).toBeVisible();
    const pairNames = await page.locator('app-bracket-chart span').allTextContents();
    const hasPairName = pairNames.some(t => t.match(/joueur\d+/i));
    expect(hasPairName).toBe(true);
  });

  // BRAK-07
  test('BRAK-07 : saisie d\'un score dans le bracket', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const match = matches.find(m => m.pair1 && m.pair2);
    if (!match) test.skip();
    await startMatchViaApi(page.request, token, tournamentId, match!.id);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');

    // Junction buttons show "+" for each unscored match — count them before scoring
    const plusBtns = page.locator('app-bracket-chart button').filter({ hasText: '+' });
    await expect(plusBtns.first()).toBeVisible({ timeout: 10_000 });
    const countBefore = await plusBtns.count();

    await plusBtns.first().click();

    // p-dialog is at body level (appendTo="body")
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 });
    // Click outer winner div (cursor-pointer class) to call scoreForm.get('winnerId').setValue()
    await page.locator('[role="dialog"] div.cursor-pointer').first().click();
    await page.locator('[role="dialog"] input#score-input').fill('6/3 6/2');
    await page.locator('[role="dialog"] p-button[label="Enregistrer"]').click();

    // After scoring, one fewer "+" junction button (bracket reloads with saved score)
    await expect(plusBtns).toHaveCount(countBefore - 1, { timeout: 8_000 });
  });

  // BRAK-08
  test('BRAK-08 : suppression d\'un score dans le bracket', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const matchWithBothPairs = matches.find(m => m.pair1 && m.pair2);
    if (!matchWithBothPairs) test.skip();

    await startMatchViaApi(page.request, token, tournamentId, matchWithBothPairs!.id);
    await scoreMatchViaApi(page.request, token, tournamentId, matchWithBothPairs!.id, matchWithBothPairs!.pair1!);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');

    await expect(page.locator('app-bracket-chart')).toBeVisible({ timeout: 10_000 });

    // Two X button types in bracket: "remove pair" (no confirm) and "delete score" (p-confirmDialog).
    // Iterate X buttons until the one that triggers the confirm dialog is found (the promoted slot X).
    const xBtns = page.locator('app-bracket-chart button:has(.bi-x-lg)');
    await expect(xBtns.first()).toBeVisible({ timeout: 10_000 });

    let deletedScore = false;
    let currentCount = await xBtns.count();

    for (let i = 0; i < 10 && currentCount > 0; i++) {
      await xBtns.first().click();
      const confirmBtn = page.locator('.p-confirmdialog button', { hasText: /supprimer/i });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
        deletedScore = true;
        break;
      }
      // "Remove pair" click — wait for DOM to update before checking next X
      currentCount--;
      if (currentCount > 0) {
        await expect(xBtns).toHaveCount(currentCount, { timeout: 5_000 });
      }
    }

    expect(deletedScore).toBe(true);

    // After score deletion, a "+" junction button reappears (the scored match was reset)
    await expect(page.locator('app-bracket-chart button').filter({ hasText: '+' }).first()).toBeVisible({ timeout: 8_000 });
  });
});
