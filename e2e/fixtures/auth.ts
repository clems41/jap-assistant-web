import { APIRequestContext, Page } from '@playwright/test';
import { API_BASE, TestUser } from './data';

export async function registerViaApi(request: APIRequestContext, user: TestUser): Promise<void> {
  const res = await request.post(`${API_BASE}/auth/register/`, {
    data: {
      email: user.email,
      password: user.password,
      first_name: user.first_name,
      last_name: user.last_name,
    },
  });
  if (!res.ok()) {
    throw new Error(`register failed: ${res.status()} ${await res.text()}`);
  }
}

export async function getAuthToken(request: APIRequestContext, user: TestUser): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/token/`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) {
    throw new Error(`login failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.access as string;
}

export async function loginViaApi(page: Page, user: TestUser): Promise<void> {
  // Get tokens via API without going through the UI login form
  const ctx = page.request;
  const res = await ctx.post(`${API_BASE}/auth/token/`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) {
    throw new Error(`loginViaApi failed: ${res.status()} ${await res.text()}`);
  }
  const { access, refresh } = await res.json();

  // Inject tokens into localStorage and trigger Angular auth state
  await page.goto('/loading');
  await page.evaluate(
    ({ access, refresh }: { access: string; refresh: string }) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    },
    { access, refresh },
  );

  // Navigate to home — Angular's authGuard will read localStorage and allow through
  await page.goto('/home');
  await page.waitForURL(/\/home/, { timeout: 15_000 });
}

export async function logoutViaUi(page: Page): Promise<void> {
  await page.locator('header button:has(.bi-box-arrow-right)').click();
  await page.waitForURL(/\/auth\/login/);
}
