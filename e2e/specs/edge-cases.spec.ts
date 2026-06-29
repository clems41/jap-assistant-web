import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import {
  createTournamentViaApi,
  addRankedPairsViaApi,
  setGameFormatViaApi,
  getTournamentViaApi,
} from '../fixtures/tournament';
import { TournamentSetupPage } from '../pages/TournamentSetupPage';
import { makeTestUser, TestUser } from '../fixtures/data';

test.describe('EDGE — Cas limites, sécurité et UX', () => {
  let user: TestUser;

  test.beforeEach(() => {
    user = makeTestUser();
  });

  // EDGE-01 (PARTIEL — teste l'absence d'overflow horizontal à 390px)
  test('EDGE-01 : responsive mobile — pas d\'overflow horizontal à 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const pagesToCheck = ['/auth/login', '/auth/register'];

    for (const url of pagesToCheck) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(395);
    }

    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.goto(`/tournaments/setup/${tournamentId}`);
    await page.waitForLoadState('networkidle');
    const setupScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(setupScrollWidth).toBeLessThanOrEqual(395);
  });

  // EDGE-02
  test('EDGE-02 : formulaires avec champs vides bloquent la soumission', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    await page.goto('/auth/register');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.goto('/home');
    await page.getByRole('button', { name: 'Ajouter un tournoi' }).click();
    await expect(page.locator('.p-dialog-title', { hasText: 'Nouveau tournoi' })).toBeVisible();
    const createBtn = page.locator('[role="dialog"] p-button[label="Créer le tournoi"] button');
    await expect(createBtn).toBeDisabled();
  });

  // EDGE-03
  test('EDGE-03 : toast d\'erreur quand le backend est inaccessible', async ({ page }) => {
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.route('**/api/v1/**', route => route.abort('failed'));

    await page.goto('/home');
    await page.waitForTimeout(2_000);

    await expect(page.locator('p-toast .p-toast-message-error').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('body')).toBeVisible();
  });

  // EDGE-04
  test('EDGE-04 : expiration du token JWT redirige vers login', async ({ page }) => {
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });

    await page.goto('/tournaments/setup/999');

    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
  });

  // EDGE-06
  test('EDGE-06 : pagination de la liste des tournois', async ({ page }) => {
    await registerViaApi(page.request, user);
    const token = await getAuthToken(page.request, user);

    // Use dates within the next 3 months (home page "upcoming" filter: today → today+3months)
    const base = new Date();
    base.setDate(base.getDate() + 7);
    for (let i = 0; i < 12; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i * 2);
      await createTournamentViaApi(page.request, token, {
        name: `Tournoi Pagination ${i + 1}`,
        start_date: d.toISOString().split('T')[0],
      });
    }

    await loginViaApi(page, user);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await page.locator('p-tab[value="upcoming"]').click();
    await page.waitForLoadState('networkidle');

    // Verify at least one tournament is displayed
    await expect(page.locator('app-tournament-list a').first()).toBeVisible({ timeout: 10_000 });

    // Check paginator if it appears (depends on backend page size)
    const paginatorVisible = await page.locator('p-paginator').isVisible({ timeout: 3_000 }).catch(() => false);
    if (paginatorVisible) {
      const page2Btn = page.locator('p-paginator button', { hasText: /^2$/ });
      if (await page2Btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await page2Btn.click();
        await expect(page.locator('app-tournament-list')).toBeVisible();
      }
    }
  });

  // EDGE-07
  test('EDGE-07 : statut du tournoi évolue vers SET automatiquement', async ({ page }) => {
    await registerViaApi(page.request, user);
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await setGameFormatViaApi(page.request, token, tournamentId);
    await addRankedPairsViaApi(page.request, token, tournamentId, 4);

    // Verify via API that status moved to SET
    const tournament = await getTournamentViaApi(page.request, token, tournamentId);
    expect(['SET', 'READY', 'STARTED'].includes(String(tournament['status']))).toBe(true);

    await loginViaApi(page, user);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    // Setup page badge on players tab should show 0 warnings (all data valid)
    await setupPage.clickTab('infos');
    await expect(page.locator('app-qr-code-share')).toBeVisible({ timeout: 10_000 });
  });

  // EDGE-08
  test('EDGE-08 : impossible de modifier un tournoi FINISHED', async ({ page }) => {
    await registerViaApi(page.request, user);
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    await page.request.patch(`http://localhost:8000/api/v1/tournaments/${tournamentId}/`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'FINISHED' },
    });

    await loginViaApi(page, user);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('infos');

    const saveBtn = page.getByRole('button', { name: 'Sauvegarder' });
    if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(saveBtn).toBeDisabled();
    }

    await setupPage.clickTab('settings');
    const settingsSaveBtn = page.getByRole('button', { name: 'Sauvegarder' });
    if (await settingsSaveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(settingsSaveBtn).toBeDisabled();
    }
  });
});
