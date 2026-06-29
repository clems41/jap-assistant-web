import { Page, expect } from '@playwright/test';

export class PublicTournamentPage {
  constructor(private page: Page) {}

  async goto(code: string) {
    await this.page.goto(`/public/tournaments/${code}`);
    await this.page.waitForSelector('p-tabs', { timeout: 15_000 });
  }

  async clickTab(value: 'infos' | 'players' | 'matchs' | 'bracket' | 'classification') {
    await this.page.locator(`p-tab[value="${value}"]`).click();
    await this.page.waitForTimeout(300);
  }

  async expectNoEditButtons() {
    const editButtons = this.page.locator('button', { hasText: /ajouter|modifier|supprimer|démarrer|saisir le score|lancer/i });
    await expect(editButtons).toHaveCount(0);
  }

  async waitForMatchStatus(matchLabel: string, status: string) {
    const matchCard = this.page.locator('app-match-card', { hasText: matchLabel });
    await expect(matchCard.locator('p-tag', { hasText: status })).toBeVisible({ timeout: 12_000 });
  }
}
