import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { registerViaApi, loginViaApi } from '../fixtures/auth';
import { makeTestUser, MAILPIT_API, TestUser } from '../fixtures/data';

test.describe('AUTH — Authentification', () => {
  // Each test gets its own unique user (timestamp-based email)
  let user: TestUser;

  test.beforeEach(() => {
    user = makeTestUser();
  });

  // AUTH-01
  test('AUTH-01 : inscription d\'un nouvel utilisateur', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('#email', user.email);
    await page.fill('#first_name', user.first_name);
    await page.fill('#last_name', user.last_name);
    await page.locator('#password').fill(user.password);
    await page.locator('#password_confirm').fill(user.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/home/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/home/);
  });

  // AUTH-02
  test('AUTH-02 : inscription avec email déjà utilisé', async ({ page }) => {
    await registerViaApi(page.request, user);

    await page.goto('/auth/register');
    await page.fill('#email', user.email);
    await page.fill('#first_name', 'Autre');
    await page.fill('#last_name', 'User');
    await page.locator('#password').fill(user.password);
    await page.locator('#password_confirm').fill(user.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('p-toast .p-toast-message-error')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  // AUTH-03
  test('AUTH-03 : inscription mots de passe non concordants', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('#email', user.email);
    await page.fill('#first_name', 'Test');
    await page.fill('#last_name', 'User');
    await page.locator('#password').fill('test1234!');
    await page.locator('#password_confirm').fill('autrechose!');
    await page.locator('#password_confirm').press('Tab');

    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('text=Les mots de passe ne correspondent pas')).toBeVisible();
  });

  // AUTH-04
  test('AUTH-04 : connexion valide', async ({ page }) => {
    await registerViaApi(page.request, user);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillAndSubmit(user.email, user.password);
    await loginPage.expectRedirectToHome();
  });

  // AUTH-05
  test('AUTH-05 : connexion avec mauvais mot de passe', async ({ page }) => {
    await registerViaApi(page.request, user);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillAndSubmit(user.email, 'mauvaismdp');
    await loginPage.expectError();
    await loginPage.expectStillOnLogin();
  });

  // AUTH-06
  test('AUTH-06 : déconnexion', async ({ page }) => {
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.locator('header button:has(.bi-box-arrow-right)').click();
    await page.waitForURL(/\/auth\/login/);

    await page.goto('/home');
    await page.waitForURL(/\/auth\/login/);
  });

  // AUTH-07
  test('AUTH-07 : accès page protégée sans connexion', async ({ page }) => {
    await page.goto('/home');
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });

    await page.goto('/tournaments/setup/1');
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
  });

  // AUTH-08
  test('AUTH-08 : accès pages auth avec session active', async ({ page }) => {
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.goto('/auth/login');
    await page.waitForURL(/\/home/, { timeout: 10_000 });

    await page.goto('/auth/register');
    await page.waitForURL(/\/home/, { timeout: 10_000 });
  });

  // AUTH-09
  test('AUTH-09 : réinitialisation du mot de passe via Mailpit', async ({ page, request }) => {
    const newPassword = 'NewPass9999!';
    await registerViaApi(page.request, user);

    await request.delete(`${MAILPIT_API}/api/v1/messages`);

    await page.goto('/auth/password-forgotten');
    await page.fill('#email', user.email);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email envoyé')).toBeVisible();

    await expect.poll(async () => {
      const res = await request.get(`${MAILPIT_API}/api/v1/messages`);
      const body = await res.json();
      return body.messages?.length ?? 0;
    }, { timeout: 15_000, message: 'Mailpit: aucun email reçu' }).toBeGreaterThan(0);

    const listRes = await request.get(`${MAILPIT_API}/api/v1/messages`);
    const { messages } = await listRes.json();
    const msgRes = await request.get(`${MAILPIT_API}/api/v1/message/${messages[0].ID}`);
    const msgBody = await msgRes.json();
    const html: string = msgBody.HTML ?? '';
    const match = html.match(/href="([^"]*reset-password[^"]*)"/);
    if (!match) throw new Error('Lien de reset introuvable dans l\'email HTML');

    await page.goto(match[1]);
    await page.locator('#password').fill(newPassword);
    await page.locator('#password_confirm').fill(newPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });

    const loginPage = new LoginPage(page);
    await loginPage.fillAndSubmit(user.email, newPassword);
    await loginPage.expectRedirectToHome();
  });

  // AUTH-10
  test('AUTH-10 : réinitialisation avec token invalide', async ({ page }) => {
    await page.goto('/auth/reset-password?token=tokeninvalide');
    await page.locator('#password').fill('test9999!');
    await page.locator('#password_confirm').fill('test9999!');
    await page.click('button[type="submit"]');

    await expect(page.locator('p-toast .p-toast-message-error')).toBeVisible();
  });

  // AUTH-11
  test('AUTH-11 : consultation du profil utilisateur', async ({ page }) => {
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.goto('/user-profile');
    await page.waitForSelector('section', { timeout: 10_000 });

    await expect(page.getByText(user.first_name, { exact: true })).toBeVisible();
    await expect(page.getByText(user.last_name, { exact: true })).toBeVisible();
    await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  });

  // AUTH-12
  test('AUTH-12 : changement de mot de passe depuis le profil', async ({ page }) => {
    const newPassword = 'NewPass9999!';
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.goto('/user-profile');
    await page.locator('#old_password').fill(user.password);
    await page.locator('#password').fill(newPassword);
    await page.locator('#password_confirm').fill(newPassword);
    await page.click('button[type="submit"]');

    await expect(page.locator('p-toast .p-toast-message-success')).toBeVisible();

    await page.locator('header button:has(.bi-box-arrow-right)').click();
    await page.waitForURL(/\/auth\/login/);

    const loginPage = new LoginPage(page);
    await loginPage.fillAndSubmit(user.email, newPassword);
    await loginPage.expectRedirectToHome();
  });

  // AUTH-13
  test('AUTH-13 : changement de mot de passe avec mauvais ancien mot de passe', async ({ page }) => {
    await registerViaApi(page.request, user);
    await loginViaApi(page, user);

    await page.goto('/user-profile');
    await page.locator('#old_password').fill('mauvaismdp');
    await page.locator('#password').fill('newpass1234!');
    await page.locator('#password_confirm').fill('newpass1234!');
    await page.click('button[type="submit"]');

    await expect(page.locator('p-toast .p-toast-message-error')).toBeVisible();
  });
});
