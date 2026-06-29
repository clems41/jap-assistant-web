import { request } from '@playwright/test';
import { API_BASE } from './fixtures/data';

export default async function globalSetup() {
  const ctx = await request.newContext();

  let attempts = 0;
  while (attempts < 30) {
    try {
      // Any response (including 401/404) means the server is listening
      await ctx.get(`${API_BASE}/tournaments/enums/categories/`);
      break;
    } catch {
      // Connection refused — backend not ready yet
    }
    await new Promise(r => setTimeout(r, 2_000));
    attempts++;
  }

  if (attempts === 30) {
    throw new Error(`Backend at ${API_BASE} did not respond after 60 seconds`);
  }

  await ctx.dispose();
}
