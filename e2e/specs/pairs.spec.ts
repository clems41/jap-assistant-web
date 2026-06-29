import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import {
  createTournamentViaApi,
  setupFullTournamentWithBracket,
  getMatchesViaApi,
  startMatchViaApi,
  scoreMatchViaApi,
} from '../fixtures/tournament';
import { TournamentSetupPage } from '../pages/TournamentSetupPage';
import { makeTestUser, TestUser } from '../fixtures/data';
import * as path from 'path';

test.describe('PAIR — Gestion des paires', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    user = makeTestUser();
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);
  });

  // PAIR-01
  test('PAIR-01 : ajout manuel d\'une paire', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('players');
    await setupPage.openAddPairDialog();

    await setupPage.fillPairForm(
      { last_name: 'Dupont', first_name: 'Alice', license: '1234567A' },
      { last_name: 'Martin', first_name: 'Beatrice', license: '2345678B' },
    );
    await setupPage.submitPairForm();

    await expect(page.locator('text=DUPONT Alice')).toBeVisible();
    await expect(page.locator('text=MARTIN Beatrice')).toBeVisible();
  });

  // PAIR-02
  test('PAIR-02 : modification d\'une paire (mise à jour du ranking)', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.request.post(`http://localhost:8000/api/v1/tournaments/${tournamentId}/pairs/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        player1: { last_name: 'Dupont', first_name: 'Alice', license_number: '1234567A', ranking: 200 },
        player2: { last_name: 'Martin', first_name: 'Beatrice', license_number: '2345678B', ranking: 150 },
      },
    });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('players');

    await setupPage.openEditPairDialog(0);
    await setupPage.fillEditPairForm({ player1_ranking: 120 });
    await setupPage.submitPairForm();

    // Poids should be 120 + 150 = 270
    await expect(page.locator('text=Poids : 270')).toBeVisible();
  });

  // PAIR-03
  test('PAIR-03 : suppression d\'une paire', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.request.post(`http://localhost:8000/api/v1/tournaments/${tournamentId}/pairs/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        player1: { last_name: 'Dupont', first_name: 'Alice', license_number: '1234567a', ranking: 200 },
        player2: { last_name: 'Martin', first_name: 'Beatrice', license_number: '2345678b', ranking: 150 },
      },
    });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('players');

    await expect(page.locator('text=DUPONT Alice')).toBeVisible();

    await page.locator('p-button[label="Supprimer"]').first().locator('button').click();
    const confirmBtn = page.locator('.p-confirmdialog button', { hasText: /oui|confirmer|supprimer/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    await expect(page.locator('text=DUPONT Alice')).not.toBeVisible({ timeout: 8_000 });
  });

  // PAIR-04
  test('PAIR-04 : import de paires depuis un fichier XLS valide', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('players');
    await setupPage.openImportPairsDialog();

    const fileInput = page.locator('p-fileupload input[type="file"]');
    const xlsPath = path.join(__dirname, '../files/pairs_valid.xls');
    await fileInput.setInputFiles(xlsPath);

    // Import closes the dialog automatically on success (no toast)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Paires inscrites')).toBeVisible();
  });

  // PAIR-05
  test('PAIR-05 : import avec fichier XLS invalide', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('players');
    await setupPage.openImportPairsDialog();

    const fileInput = page.locator('p-fileupload input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid.xls',
      mimeType: 'application/vnd.ms-excel',
      buffer: Buffer.from('This is not a valid XLS file'),
    });

    await expect(page.locator('p-toast .p-toast-message-error')).toBeVisible({ timeout: 10_000 });
  });

  // PAIR-06
  test('PAIR-06 : badge de saisie incomplète (paire sans ranking)', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.request.post(`http://localhost:8000/api/v1/tournaments/${tournamentId}/pairs/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        // Explicit null ranking so backend returns weight=null (without it, default ranking is applied)
        player1: { last_name: 'Dupont', first_name: 'Alice', license_number: '1234567A', ranking: null },
        player2: { last_name: 'Martin', first_name: 'Beatrice', license_number: '2345678B', ranking: null },
      },
    });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);

    // p-tab[value] attribute may not be reflected; filter by tab text instead
    const playersTab = page.locator('p-tab').filter({ hasText: /^Joueurs/ });
    await expect(playersTab.locator('p-badge')).toBeVisible({ timeout: 10_000 });
  });

  // PAIR-07
  test('PAIR-07 : joueurs verrouillés quand le tournoi est STARTED', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    // Score a QF match to trigger STARTED status (backend auto-transitions on first score)
    const tournamentId = await setupFullTournamentWithBracket(page.request, token);
    const matches = await getMatchesViaApi(page.request, token, tournamentId, 'UPCOMING');
    const match = matches.find(m => m.pair1 && m.pair2);
    if (!match) test.skip();
    await startMatchViaApi(page.request, token, tournamentId, match!.id);
    await scoreMatchViaApi(page.request, token, tournamentId, match!.id, match!.pair1!);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('players');

    await expect(page.getByRole('button', { name: 'Ajouter une paire' })).not.toBeVisible();
    await expect(page.locator('text=Le tournoi est en cours ou terminé')).toBeVisible();
  });

  // PAIR-09
  test('PAIR-09 : un joueur ne peut être dans deux paires du même tournoi', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.request.post(`http://localhost:8000/api/v1/tournaments/${tournamentId}/pairs/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        player1: { last_name: 'Dupont', first_name: 'Alice', license_number: '1234567A', ranking: 200 },
        player2: { last_name: 'Martin', first_name: 'Beatrice', license_number: '2345678B', ranking: 150 },
      },
    });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('players');
    await setupPage.openAddPairDialog();

    await setupPage.fillPairForm(
      { last_name: 'Dupont', first_name: 'Alice', license: '1234567A' },
      { last_name: 'Durand', first_name: 'Claire', license: '3456789C' },
    );
    await page.getByRole('button', { name: 'Valider' }).click();

    await expect(page.locator('p-toast .p-toast-message-error')).toBeVisible();
  });
});
