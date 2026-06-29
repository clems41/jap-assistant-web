import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth/login');
    await this.page.waitForURL(/\/auth\/login/);
  }

  async fillAndSubmit(email: string, password: string) {
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }

  async expectRedirectToHome() {
    await this.page.waitForURL(/\/home/, { timeout: 15_000 });
  }

  async expectError() {
    await expect(this.page.locator('p-toast .p-toast-message-error')).toBeVisible();
  }

  async expectStillOnLogin() {
    await expect(this.page).toHaveURL(/\/auth\/login/);
  }
}
