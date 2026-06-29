import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import {
  setupFullTournamentWithBracket,
  getMatchesViaApi,
  startMatchViaApi,
  scoreMatchViaApi,
  getTournamentBracketViaApi,
} from '../fixtures/tournament';
import { TournamentSetupPage } from '../pages/TournamentSetupPage';
import { makeTestUser, TestUser } from '../fixtures/data';

test.describe('CLASS — Tableaux de classement', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    user = makeTestUser();
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);
  });

  async function advanceTournamentToClassification(
    request: import('@playwright/test').APIRequestContext,
    token: string,
    tournamentId: number,
  ) {
    const matches = await getMatchesViaApi(request, token, tournamentId, 'UPCOMING');
    const firstRoundMatches = matches.filter(m => m.pair1 && m.pair2).slice(0, 4);
    for (const m of firstRoundMatches) {
      await startMatchViaApi(request, token, tournamentId, m.id);
      await scoreMatchViaApi(request, token, tournamentId, m.id, m.pair1!);
    }
  }

  // CLASS-01
  test('CLASS-01 : affichage des brackets de classement', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);
    await advanceTournamentToClassification(page.request, token, tournamentId);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);

    const classTab = page.locator('p-tab[value="classification"]');
    await expect(classTab).toBeVisible({ timeout: 15_000 });

    await classTab.click();
    await expect(page.locator('app-classification-brackets')).toBeVisible({ timeout: 10_000 });
  });

  // CLASS-02
  test('CLASS-02 : saisie d\'un score de classement', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);
    await advanceTournamentToClassification(page.request, token, tournamentId);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);

    const classTab = page.locator('p-tab[value="classification"]');
    await expect(classTab).toBeVisible({ timeout: 15_000 });
    await classTab.click();

    // Classification brackets use app-bracket-chart in score-only mode — click "+" junction buttons
    const plusBtns = page.locator('app-classification-brackets app-bracket-chart button').filter({ hasText: '+' });
    await expect(plusBtns.first()).toBeVisible({ timeout: 12_000 });

    const countBefore = await plusBtns.count();
    await plusBtns.first().click();

    // p-dialog at body level (appendTo="body")
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[role="dialog"] div.cursor-pointer').first().click();
    await page.locator('[role="dialog"] input#score-input').fill('6/4 7/5');
    await page.locator('[role="dialog"] p-button[label="Enregistrer"]').click();

    await expect(plusBtns).toHaveCount(countBefore - 1, { timeout: 8_000 });
  });

  // CLASS-03
  test('CLASS-03 : suppression d\'un score de classement', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);
    await advanceTournamentToClassification(page.request, token, tournamentId);

    // Score a classification semi-final via API (same pattern as MATCH-03)
    const bracket = await getTournamentBracketViaApi(page.request, token, tournamentId);
    const classificationBrackets = (bracket['classification_brackets'] as Array<{
      root_match: {
        child1?: { id: number; pair1: number | null; pair2: number | null } | null;
        child2?: { id: number; pair1: number | null; pair2: number | null } | null;
      };
    }>) ?? [];
    if (!classificationBrackets.length) { test.skip(); return; }

    const rootMatch = classificationBrackets[0].root_match;
    const classMatch = [rootMatch.child1, rootMatch.child2].find(m => m?.pair1 && m?.pair2);
    if (!classMatch) { test.skip(); return; }

    await scoreMatchViaApi(page.request, token, tournamentId, classMatch.id, classMatch.pair1!);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);

    const classTab = page.locator('p-tab[value="classification"]');
    await expect(classTab).toBeVisible({ timeout: 15_000 });
    await classTab.click();

    // In score-only mode, X buttons are all "delete score" type (no "remove pair" X)
    const xBtn = page.locator('app-classification-brackets app-bracket-chart button:has(.bi-x-lg)').first();
    await expect(xBtn).toBeVisible({ timeout: 12_000 });

    await xBtn.click();
    const confirmBtn = page.locator('.p-confirmdialog button', { hasText: /supprimer/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    // After deletion, a "+" junction button reappears for the reset match
    const plusBtns = page.locator('app-classification-brackets app-bracket-chart button').filter({ hasText: '+' });
    await expect(plusBtns.first()).toBeVisible({ timeout: 8_000 });
  });
});
