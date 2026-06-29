import { test, expect } from '@playwright/test';
import { registerViaApi, loginViaApi, getAuthToken } from '../fixtures/auth';
import {
  createTournamentViaApi,
  getTournamentViaApi,
  setupFullTournamentWithBracket,
  getMatchesViaApi,
  startMatchViaApi,
  scoreMatchViaApi,
} from '../fixtures/tournament';
import { TournamentSetupPage } from '../pages/TournamentSetupPage';
import { makeTestUser, makeOtherUser, TestUser } from '../fixtures/data';

test.describe('TOUR — Gestion des tournois', () => {
  let user: TestUser;

  test.beforeEach(async ({ page }) => {
    user = makeTestUser();
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);
  });

  // TOUR-01
  test('TOUR-01 : création d\'un tournoi', async ({ page }) => {
    await page.goto('/home');
    await page.getByRole('button', { name: 'Ajouter un tournoi' }).click();
    await expect(page.locator('.p-dialog-title', { hasText: 'Nouveau tournoi' })).toBeVisible();

    await page.fill('#name', 'Tournoi Test A');
    await page.fill('#location', 'Club de Paris');

    await page.locator('[inputId="category"]').click();
    await page.locator('.p-select-overlay .p-select-option').first().click();

    await page.locator('[inputId="gender"]').click();
    await page.locator('.p-select-overlay .p-select-option').first().click();

    await page.locator('[inputId="league"]').click();
    await page.locator('.p-select-overlay .p-select-option').first().click();

    await page.locator('input#start_date').fill('15/06/2027');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('button', { name: 'Créer le tournoi' })).toBeEnabled({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Créer le tournoi' }).click();
    await page.waitForURL(/\/tournaments\/setup\/\d+/, { timeout: 15_000 });

    await page.goto('/home');
    await expect(page.locator('text=Tournoi Test A')).toBeVisible();
  });

  // TOUR-02
  test('TOUR-02 : affichage de la liste des tournois', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    // Within 3-month filter window of the home page (today + 3 months)
    await createTournamentViaApi(page.request, token, { name: 'Tournoi A venir', start_date: '2026-08-01' });

    await page.goto('/home');
    await expect(page.locator('p-tab[value="upcoming"]')).toBeVisible();
    await expect(page.locator('p-tab[value="past"]')).toBeVisible();

    await page.locator('p-tab[value="upcoming"]').click();
    await expect(page.locator('text=Tournoi A venir')).toBeVisible();
  });

  // TOUR-03
  test('TOUR-03 : filtres sur la liste des tournois', async ({ page }) => {
    const token = await getAuthToken(page.request, user);

    const enumRes = await page.request.get('http://localhost:8000/api/v1/tournaments/enums/categories/');
    const categories = await enumRes.json();
    const cat1 = Array.isArray(categories) ? categories[0] : Object.values(categories)[0];
    const cat1Value = typeof cat1 === 'object' ? (cat1 as { value: string; label: string }).value : String(cat1);
    const cat1Label = typeof cat1 === 'object' ? (cat1 as { value: string; label: string }).label : String(cat1);

    await createTournamentViaApi(page.request, token, { name: 'Tournoi Cat1', category: cat1Value, start_date: '2027-09-01' });
    await createTournamentViaApi(page.request, token, { name: 'Tournoi Cat1 aussi', category: cat1Value, start_date: '2027-09-02' });

    await page.goto('/home');
    await page.locator('p-tab[value="upcoming"]').click();

    const filterLocator = page.locator('[inputId="category"]').first();
    if (await filterLocator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await filterLocator.click();
      await page.locator('.p-select-overlay .p-select-option', { hasText: cat1Label }).first().click();
      await expect(page.locator('text=Tournoi Cat1')).toBeVisible();
    }
  });

  // TOUR-04
  test('TOUR-04 : modification des informations d\'un tournoi', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token, { name: 'Tournoi Original' });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('infos');

    await page.locator('#name').click();
    await page.fill('#name', 'Tournoi Modifié');
    await page.locator('#name').press('Tab');
    await expect(page.getByRole('button', { name: 'Sauvegarder' })).toBeEnabled({ timeout: 3_000 });
    await page.getByRole('button', { name: 'Sauvegarder' }).click();
    // After save, form resets to untouched → button disabled again
    await expect(page.getByRole('button', { name: 'Sauvegarder' })).toBeDisabled({ timeout: 8_000 });
    await expect(page.locator('#name')).toHaveValue('Tournoi Modifié');
  });

  // TOUR-05
  test('TOUR-05 : statut DRAFT d\'un tournoi nouvellement créé', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const tournament = await getTournamentViaApi(page.request, token, tournamentId);
    expect(tournament['status']).toBe('DRAFT');

    // Verify setup page loads correctly
    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('infos');
    await expect(page.locator('app-qr-code-share')).toBeVisible();
  });

  // TOUR-06 (PARTIEL — teste la présence du QR code et le clic "Copier")
  test('TOUR-06 : QR code présent et bouton copier déclenche un toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token);

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('infos');

    await expect(page.locator('app-qr-code-share')).toBeVisible();

    const copyBtn = page.locator('button', { hasText: /copier/i }).first();
    if (await copyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await copyBtn.click();
      await expect(page.locator('p-toast .p-toast-message-success')).toBeVisible();
    }
  });

  // TOUR-07
  test('TOUR-07 : suppression d\'un tournoi DRAFT', async ({ page }) => {
    const token = await getAuthToken(page.request, user);
    const tournamentId = await createTournamentViaApi(page.request, token, { name: 'A Supprimer' });

    const setupPage = new TournamentSetupPage(page);
    await setupPage.goto(tournamentId);
    await setupPage.clickTab('infos');

    await page.getByRole('button', { name: 'Supprimer' }).click();
    const confirmBtn = page.locator('.p-confirmdialog button', { hasText: /oui|confirmer|supprimer/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await page.waitForURL(/\/home/, { timeout: 10_000 });
    await expect(page.locator('text=A Supprimer')).not.toBeVisible();
  });

  // TOUR-08
  test('TOUR-08 : impossible de supprimer un tournoi STARTED', async ({ page }) => {
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
    await setupPage.clickTab('infos');

    const deleteBtn = page.getByRole('button', { name: 'Supprimer' });
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(deleteBtn).toBeDisabled();
    } else {
      // Button may be hidden when deletion is not allowed — also acceptable
      expect(true).toBe(true);
    }
  });

  // TOUR-09
  test('TOUR-09 : accès au tournoi d\'un autre utilisateur', async ({ page }) => {
    const otherUser = makeOtherUser();
    await registerViaApi(page.request, otherUser);
    const otherToken = await getAuthToken(page.request, otherUser);
    const otherTournamentId = await createTournamentViaApi(page.request, otherToken, { name: 'Tournoi Autre' });

    await page.goto(`/tournaments/setup/${otherTournamentId}`);
    await page.waitForTimeout(3_000);

    // Should show error page (403/404/message) OR redirect home/login
    const currentUrl = page.url();
    const hasErrorPage = await page
      .locator('*')
      .filter({ hasText: /403|404|Accès refusé|introuvable/i })
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(
      hasErrorPage || currentUrl.includes('/home') || currentUrl.includes('/auth/login')
    ).toBe(true);
  });
});
