import { Page, expect } from '@playwright/test';

export class TournamentSetupPage {
  constructor(private page: Page) {}

  async goto(id: number) {
    await this.page.goto(`/tournaments/setup/${id}`);
    await this.page.waitForSelector('p-tabs', { timeout: 15_000 });
  }

  async clickTab(value: 'infos' | 'players' | 'settings' | 'brackets' | 'classification' | 'matchs') {
    await this.page.locator(`p-tab[value="${value}"]`).click();
    await this.page.waitForTimeout(300);
  }

  // ─── Onglet Joueurs ──────────────────────────────────────────────────

  async openAddPairDialog() {
    await this.page.getByRole('button', { name: 'Ajouter une paire' }).click();
    await expect(this.page.locator('.p-dialog-title', { hasText: 'Ajouter une paire' })).toBeVisible();
  }

  async openEditPairDialog(index = 0) {
    await this.page.locator('p-button[label="Modifier"]').nth(index).locator('button').click();
    await expect(this.page.locator('.p-dialog-title', { hasText: 'Modifier une paire' })).toBeVisible();
  }

  async fillPairForm(p1: {
    last_name: string; first_name: string; license: string; phone?: string; ranking?: number;
  }, p2: {
    last_name: string; first_name: string; license: string; phone?: string; ranking?: number;
  }) {
    await this.page.fill('#player1_last_name', p1.last_name);
    await this.page.fill('#player1_first_name', p1.first_name);
    await this.fillInputMask('#player1_license_number', p1.license);
    if (p1.phone) await this.page.fill('#player1_phone_number', p1.phone);

    await this.page.fill('#player2_last_name', p2.last_name);
    await this.page.fill('#player2_first_name', p2.first_name);
    await this.fillInputMask('#player2_license_number', p2.license);
    if (p2.phone) await this.page.fill('#player2_phone_number', p2.phone);
  }

  async fillEditPairForm(updates: { player1_ranking?: number; player2_ranking?: number }) {
    if (updates.player1_ranking !== undefined) {
      const input = this.page.locator('#player1_ranking');
      await input.click();
      await input.clear();
      await input.pressSequentially(String(updates.player1_ranking));
      await input.press('Tab');
    }
    if (updates.player2_ranking !== undefined) {
      const input = this.page.locator('#player2_ranking');
      await input.click();
      await input.clear();
      await input.pressSequentially(String(updates.player2_ranking));
      await input.press('Tab');
    }
  }

  async submitPairForm() {
    await this.page.getByRole('button', { name: 'Valider' }).click();
    await expect(this.page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10_000 });
  }

  async deletePair(index = 0) {
    this.page.once('dialog', d => d.accept());
    await this.page.locator('p-button[label="Supprimer"]').nth(index).locator('button').click();
    // PrimeNG uses a ConfirmDialog
    const confirmBtn = this.page.locator('.p-confirmdialog p-button[label="Oui"], .p-confirmdialog button', { hasText: /oui|confirmer/i });
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }

  async openImportPairsDialog() {
    await this.page.getByRole('button', { name: 'Importer' }).click();
    await expect(this.page.locator('.p-dialog-title', { hasText: 'Importer des paires' })).toBeVisible();
  }

  // ─── Onglet Configuration ─────────────────────────────────────────────

  async selectOption(inputId: string, optionText: string) {
    await this.page.locator(`[inputId="${inputId}"]`).click();
    await this.page.locator('.p-select-overlay .p-select-option', { hasText: optionText }).first().click();
  }

  async setMatchDuration(minutes: number) {
    await this.page.fill('#estimated_match_duration', String(minutes));
    await this.page.locator('#estimated_match_duration').press('Tab');
  }

  async addTimeSlot(startTime: string, endTime: string, courts: number) {
    await this.fillTimePicker('#start_time', startTime);
    await this.fillTimePicker('#end_time', endTime);
    const courtsInput = this.page.locator('#courts_available');
    await courtsInput.click();
    await courtsInput.clear();
    await courtsInput.pressSequentially(String(courts));
    await courtsInput.press('Tab');
    const addBtn = this.page.getByRole('button', { name: 'Ajouter' }).last();
    await expect(addBtn).toBeEnabled({ timeout: 5_000 });
    await addBtn.click();
  }

  // ─── Onglet Tableau ───────────────────────────────────────────────────

  async generateBracket(dimension: number) {
    await this.selectOption('dimension', String(dimension));
    await this.page.getByRole('button', { name: 'Générer le tableau' }).click();
    await this.page.waitForSelector('app-bracket-chart', { timeout: 15_000 });
  }

  // ─── Toast ────────────────────────────────────────────────────────────

  async expectSuccessToast(text?: string) {
    const toast = this.page.locator('p-toast .p-toast-message-success');
    await expect(toast).toBeVisible({ timeout: 8_000 });
    if (text) await expect(toast.locator('.p-toast-detail')).toContainText(text);
  }

  async expectErrorToast(text?: string) {
    const toast = this.page.locator('p-toast .p-toast-message-error');
    await expect(toast).toBeVisible({ timeout: 8_000 });
    if (text) await expect(toast.locator('.p-toast-detail')).toContainText(text);
  }

  // ─── Helpers privés ───────────────────────────────────────────────────

  private async fillInputMask(inputId: string, value: string) {
    const input = this.page.locator(`input${inputId}`);
    await input.click();
    await input.clear();
    await input.pressSequentially(value);
    await this.page.keyboard.press('Tab');
  }

  private async fillTimePicker(inputId: string, time: string) {
    const input = this.page.locator(`input${inputId}`);
    await input.click({ clickCount: 3 }); // select all existing text
    await input.pressSequentially(time);   // type character by character for p-datepicker
    await this.page.keyboard.press('Tab');
  }
}

export async function expectToast(page: Page, severity: 'success' | 'error' | 'info', text?: string) {
  const toast = page.locator(`p-toast .p-toast-message-${severity}`);
  await expect(toast).toBeVisible({ timeout: 8_000 });
  if (text) await expect(toast.locator('.p-toast-detail')).toContainText(text);
}
