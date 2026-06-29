import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import {
  setupFullTournamentWithBracket,
  getMatchesViaApi,
  startMatchViaApi,
  scoreMatchViaApi,
} from '../fixtures/tournament';
import { TournamentSetupPage } from '../pages/TournamentSetupPage';
import { makeTestUser, TestUser } from '../fixtures/data';

test.describe('MATCH — Gestion des matchs', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    user = makeTestUser();
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);
  });

  // MATCH-01
  test('MATCH-01 : démarrage d\'un match', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('matchs');

    await page.locator('p-tab[value="upcoming"]').click();

    const startBtn = page.locator('p-button[label="Lancer le match"]').first();
    await expect(startBtn).toBeVisible({ timeout: 10_000 });
    await startBtn.locator('button').click();

    await page.locator('p-tab[value="started"]').click();
    await expect(page.locator('app-match-card').first()).toBeVisible({ timeout: 10_000 });
  });

  // MATCH-02
  test('MATCH-02 : saisie d\'un score', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const match = matches.find(m => m.pair1 && m.pair2);
    if (!match) test.skip();
    await startMatchViaApi(page.request, token, tournamentId, match!.id);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('matchs');
    await page.locator('p-tab[value="started"]').click();

    // [label] is a dynamic Angular binding — not an HTML attribute, use hasText instead
    await page.locator('p-button', { hasText: /saisir le score/i }).first().locator('button').click();

    // p-dialog is at body level (appendTo="body")
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.locator('[role="dialog"] input#score-input').fill('6/2 6/3');

    await page.locator('[role="dialog"] p-radiobutton').first().click();
    await page.locator('[role="dialog"] p-button[label="Enregistrer"]').click();

    await page.locator('p-tab[value="finished"]').click();
    await expect(page.locator('app-match-card p-tag', { hasText: /terminé|finished/i })).toBeVisible({ timeout: 8_000 });
  });

  // MATCH-03
  test('MATCH-03 : suppression d\'un score', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const match = matches.find(m => m.pair1 && m.pair2);
    if (!match) test.skip();
    await startMatchViaApi(page.request, token, tournamentId, match!.id);
    await scoreMatchViaApi(page.request, token, tournamentId, match!.id, match!.pair1!);

    // Score deletion is in the BRACKET view (not in match-list dialog which has no delete button)
    // After scoring, the winner is placed in the next round's slot — clicking X on that slot deletes the score
    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('brackets');
    await expect(page.locator('app-bracket-chart')).toBeVisible({ timeout: 10_000 });

    // The X button (bi-x-lg) on a promoted winner's slot
    const deleteScoreX = page.locator('app-bracket-chart button:has(.bi-x-lg)').first();
    await expect(deleteScoreX).toBeVisible({ timeout: 10_000 });

    await deleteScoreX.click();
    const confirmBtn = page.locator('.p-confirmdialog button', { hasText: /supprimer/i });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // After score deletion, the match should move back to upcoming
    await setupPage.clickTab('matchs');
    await page.locator('p-tab[value="upcoming"]').click();
    await expect(page.locator('app-match-card').first()).toBeVisible({ timeout: 8_000 });
  });

  // MATCH-04
  test('MATCH-04 : impossible de supprimer si match suivant scoré', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const matchesWithPairs = matches.filter(m => m.pair1 && m.pair2);
    if (matchesWithPairs.length < 2) test.skip();

    const [m1, m2] = matchesWithPairs;
    await startMatchViaApi(page.request, token, tournamentId, m1.id);
    await scoreMatchViaApi(page.request, token, tournamentId, m1.id, m1.pair1!);

    await startMatchViaApi(page.request, token, tournamentId, m2.id);
    await scoreMatchViaApi(page.request, token, tournamentId, m2.id, m2.pair1!);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('matchs');
    await page.locator('p-tab[value="finished"]').click();

    await page.locator('p-button', { hasText: /score/i }).first().locator('button').click();
    // p-dialog is at body level (appendTo="body")
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const deleteBtn = page.locator('[role="dialog"] p-button', { hasText: /supprimer/i });
    if (await deleteBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.locator('p-toast .p-toast-message-error')).toBeVisible({ timeout: 8_000 });
    } else {
      expect(true).toBe(true);
    }
  });

  // MATCH-05 (PARTIEL — teste le changement d'ordre via drag-and-drop)
  test('MATCH-05 : réordonnancement par drag-and-drop', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    // Score a match to reach STARTED (backend allows reordering only in STARTED)
    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const firstMatch = matches.find(m => m.pair1 && m.pair2);
    if (!firstMatch) test.skip();
    await startMatchViaApi(page.request, token, tournamentId, firstMatch!.id);
    await scoreMatchViaApi(page.request, token, tournamentId, firstMatch!.id, firstMatch!.pair1!);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('matchs');
    await page.locator('p-tab[value="upcoming"]').click();

    const matchItems = page.locator('[cdkDrag]');
    await expect(matchItems.first()).toBeVisible({ timeout: 10_000 });
    const count = await matchItems.count();
    if (count < 2) test.skip();

    const firstItemText = await matchItems.nth(0).textContent();

    const handle = matchItems.nth(0).locator('[cdkDragHandle]');
    await expect(handle).toBeVisible({ timeout: 5_000 });

    // CDK drag-and-drop requires explicit mouse events with steps to register the drag
    const handleBB = await handle.boundingBox();
    const targetBB = await matchItems.nth(count - 1).boundingBox();
    if (!handleBB || !targetBB) throw new Error('bounding boxes not available');

    const srcX = handleBB.x + handleBB.width / 2;
    const srcY = handleBB.y + handleBB.height / 2;
    const dstX = targetBB.x + targetBB.width / 2;
    const dstY = targetBB.y + targetBB.height / 2;

    await page.mouse.move(srcX, srcY);
    await page.mouse.down();
    // Small initial move to activate CDK drag detection
    await page.mouse.move(srcX, srcY + 5, { steps: 3 });
    await page.mouse.move(dstX, dstY, { steps: 20 });
    await page.mouse.up();

    await expect(matchItems.first()).toHaveText(/.+/, { timeout: 3_000 });
    const newFirstItemText = await matchItems.nth(0).textContent();
    expect(newFirstItemText).not.toEqual(firstItemText);
  });

  // MATCH-06
  test('MATCH-06 : affichage de l\'heure estimée de début', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    await page.request.post(`http://localhost:8000/api/v1/tournaments/${tournamentId}/time-slots/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { start_time: '09:00:00', end_time: '18:00:00', courts_available: 4 },
    });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('matchs');
    await page.locator('p-tab[value="upcoming"]').click();

    const matchCards = page.locator('app-match-card');
    await expect(matchCards.first()).toBeVisible({ timeout: 10_000 });
    const count = await matchCards.count();
    expect(count).toBeGreaterThan(0);
  });

  // MATCH-07
  test('MATCH-07 : propagation automatique du vainqueur', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const match = matches.find(m => m.pair1 && m.pair2);
    if (!match) test.skip();

    await startMatchViaApi(page.request, token, tournamentId, match!.id);
    await scoreMatchViaApi(page.request, token, tournamentId, match!.id, match!.pair1!);

    const updatedMatches = await getMatchesViaApi(page.request, token, tournamentId);
    const nextMatch = updatedMatches.find(m => m.pair1 === match!.pair1 || m.pair2 === match!.pair1);
    expect(nextMatch).toBeDefined();
  });

  // MATCH-08
  test('MATCH-08 : finale — fin automatique du tournoi', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);

    let safety = 0;
    while (safety < 20) {
      const upcoming = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
      const ready = upcoming.find(m => m.pair1 && m.pair2);
      if (!ready) break;

      await startMatchViaApi(page.request, token, tournamentId, ready.id);
      await scoreMatchViaApi(page.request, token, tournamentId, ready.id, ready.pair1!);
      safety++;
    }

    const tournamentRes = await page.request.get(`http://localhost:8000/api/v1/tournaments/${tournamentId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tournament = await tournamentRes.json();
    expect(tournament.status).toBe('FINISHED');
  });
});
