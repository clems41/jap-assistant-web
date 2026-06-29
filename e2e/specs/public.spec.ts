import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import {
  setupFullTournamentWithBracket,
  getTournamentViaApi,
  getMatchesViaApi,
  startMatchViaApi,
} from '../fixtures/tournament';
import { PublicTournamentPage } from '../pages/PublicTournamentPage';
import { makeTestUser, TestUser } from '../fixtures/data';

function publicCodeFromTournament(tournament: Record<string, unknown>): string {
  if (tournament['public_code']) return String(tournament['public_code']);
  // Extract from qr_code_url: "http://...:/public/tournaments/XXXXX"
  const qrUrl = String(tournament['qr_code_url'] ?? '');
  return qrUrl.split('/public/tournaments/').pop() ?? '';
}

test.describe('PUB — Accès public', () => {
  let user: TestUser;

  test.beforeEach(() => {
    user = makeTestUser();
  });

  // PUB-01
  test('PUB-01 : accès via le lien public sans authentification', async ({ page }) => {
    await registerViaApi(page.request, user);
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);
    const tournament = await getTournamentViaApi(page.request, token, tournamentId);

    const publicPage = new PublicTournamentPage(page);
    await publicPage.goto(publicCodeFromTournament(tournament));

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator(`text=${tournament['name']}`).first()).toBeVisible();
  });

  // PUB-02
  test('PUB-02 : contenu des onglets de la page publique', async ({ page }) => {
    await registerViaApi(page.request, user);
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);
    const tournament = await getTournamentViaApi(page.request, token, tournamentId);

    const publicPage = new PublicTournamentPage(page);
    await publicPage.goto(publicCodeFromTournament(tournament));

    await publicPage.clickTab('infos');
    await expect(page.locator(`text=${tournament['name']}`).first()).toBeVisible();

    await publicPage.clickTab('players');
    await expect(page.locator('app-public-tournament-players')).toBeVisible();

    await publicPage.clickTab('matchs');
    await expect(page.locator('app-public-tournament-matches')).toBeVisible();

    await publicPage.clickTab('bracket');
    await expect(
      page.locator('app-bracket-chart').or(page.getByText("tableau n'a pas encore été généré"))
    ).toBeVisible();
  });

  // PUB-03
  test('PUB-03 : lecture seule — aucun bouton d\'édition', async ({ page }) => {
    await registerViaApi(page.request, user);
    const token = await getAuthToken(page.request, user);
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);
    const tournament = await getTournamentViaApi(page.request, token, tournamentId);

    const publicPage = new PublicTournamentPage(page);
    await publicPage.goto(publicCodeFromTournament(tournament));

    const tabs: Array<'infos' | 'players' | 'matchs' | 'bracket'> = ['infos', 'players', 'matchs', 'bracket'];
    for (const tab of tabs) {
      await publicPage.clickTab(tab);
      const editBtns = page.locator('button', { hasText: /ajouter|modifier|supprimer|démarrer|lancer/i });
      await expect(editBtns).toHaveCount(0);
      const scoreBtn = page.locator('p-button[label="Saisir le score"], p-button[label="Lancer le match"]');
      await expect(scoreBtn).toHaveCount(0);
    }
  });

  // PUB-04
  test('PUB-04 : mise à jour en temps réel via WebSocket', async ({ browser }) => {
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();

    const publicCtx = await browser.newContext();
    const spectatorPage = await publicCtx.newPage();

    try {
      await registerViaApi(adminPage.request, user);
      const token = await getAuthToken(adminPage.request, user);
      const tournamentId = await setupFullTournamentWithBracket(adminPage.request, token);
      const tournament = await getTournamentViaApi(adminPage.request, token, tournamentId);

      const publicPage = new PublicTournamentPage(spectatorPage);
      await publicPage.goto(publicCodeFromTournament(tournament));
      await publicPage.clickTab('matchs');

      await loginViaApi(adminPage, user);
      const matches = await getMatchesViaApi(adminPage.request, token, tournamentId, 'UPCOMING');
      const match = matches.find(m => m.pair1 && m.pair2);
      if (!match) test.skip();

      await startMatchViaApi(adminPage.request, token, tournamentId, match!.id);

      await expect(
        spectatorPage.locator('p-tag', { hasText: /en cours|started/i }).first()
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await adminCtx.close();
      await publicCtx.close();
    }
  });

  // PUB-06
  test('PUB-06 : accès avec code invalide affiche une page d\'erreur', async ({ page }) => {
    await page.goto('/public/tournaments/codeinvalide123');
    await expect(
      page.locator('*').filter({ hasText: /introuvable|404/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
