/*
 * Mapping With Melanin — Kinfolk Authenticated Release Gate
 *
 * Framework: Playwright Test
 * Run only against staging or a deliberately approved production smoke-test
 * account. This is the test Replit must run BEFORE calling a Kinfolk change
 * complete.
 *
 * Required application data-testid attributes:
 *   kinfolk-chat-input
 *   kinfolk-send
 *   kinfolk-provenance-note
 *   kinfolk-response-style-conversational
 *   kinfolk-response-style-concise
 *   kinfolk-response-style-detailed
 *   kinfolk-response-style-professional
 *   kinfolk-save-taste-profile
 *
 * Required environment variables:
 *   E2E_BASE_URL=https://staging.example.com
 *   E2E_KINFOLK_EMAIL=staging-kinfolk-tester@example.test
 *   E2E_KINFOLK_PASSWORD=<staging test account password>
 *
 * Install/run:
 *   pnpm add -D @playwright/test
 *   pnpm playwright install chromium
 *   E2E_BASE_URL=... E2E_KINFOLK_EMAIL=... E2E_KINFOLK_PASSWORD=... \
 *     pnpm playwright test MWM_Kinfolk_Authenticated_Release_Gate.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = (process.env.E2E_BASE_URL ?? '').replace(/\/$/, '');
const EMAIL = process.env.E2E_KINFOLK_EMAIL ?? '';
const PASSWORD = process.env.E2E_KINFOLK_PASSWORD ?? '';
const ALLOW_PRODUCTION = process.env.ALLOW_PRODUCTION_E2E === 'true';

type ChatContract = {
  sessionId?: string;
  reply?: string;
  intentClass?: string;
  provenanceNote?: string;
  sources?: unknown[];
  evidenceStatus?: 'available' | 'degraded';
  error?: string;
};

type PreferenceContract = {
  responseStyle?: 'conversational' | 'concise' | 'detailed' | 'professional';
  deliveryProfile?: {
    detailLevel?: 'quick' | 'standard' | 'deep';
    detail_level?: 'quick' | 'standard' | 'deep';
  };
};

function assertSafeBaseUrl(): void {
  if (!BASE_URL) throw new Error('E2E_BASE_URL is required.');
  const host = new URL(BASE_URL).hostname.toLowerCase();
  const isProduction = host === 'mappingwithmelanin.com' || host === 'www.mappingwithmelanin.com';
  const looksNonProduction = host.includes('staging') || host.includes('preview') || host === 'localhost' || host === '127.0.0.1';
  if (isProduction && !ALLOW_PRODUCTION) {
    throw new Error('Refusing to run against production unless ALLOW_PRODUCTION_E2E=true.');
  }
  if (!isProduction && !looksNonProduction) {
    throw new Error(`Refusing unknown E2E host: ${host}`);
  }
}

async function login(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/(map|travel)/, { timeout: 20_000 });
}

async function sendKinfolkMessage(page: Page, message: string): Promise<ChatContract> {
  await page.goto(`${BASE_URL}/travel?e2e=kinfolk-release-gate`);
  await expect(page.getByTestId('kinfolk-chat-input')).toBeVisible({ timeout: 20_000 });

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/kinfolk/chat') && response.request().method() === 'POST',
  );

  await page.getByTestId('kinfolk-chat-input').fill(message);
  await page.getByTestId('kinfolk-send').click();

  const response = await responsePromise;
  const payload = (await response.json()) as ChatContract;
  expect(response.status(), `${message}: chat endpoint must not fail`).toBe(200);
  expect(payload.reply, `${message}: reply is required`).toEqual(expect.any(String));
  return payload;
}

async function readPreferences(page: Page): Promise<PreferenceContract> {
  return page.evaluate(async () => {
    const response = await fetch('/api/kinfolk/preferences', { credentials: 'include' });
    if (!response.ok) throw new Error(`preferences HTTP ${response.status}`);
    return response.json();
  }) as Promise<PreferenceContract>;
}

test.beforeAll(() => {
  assertSafeBaseUrl();
  if (!EMAIL || !PASSWORD) throw new Error('E2E_KINFOLK_EMAIL and E2E_KINFOLK_PASSWORD are required.');
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('regulated Thailand travel policy routing', () => {
  const cases = [
    "What are Thailand's visa requirements for a U.S. citizen visiting Phuket?",
    'How do I extend my stay in Thailand?',
    'Thailand extension documents for staying longer',
  ];

  for (const prompt of cases) {
    test(`classifies and cites: ${prompt}`, async ({ page }) => {
      const payload = await sendKinfolkMessage(page, prompt);

      expect(payload.intentClass).toBe('legal_regulated');
      expect(payload.provenanceNote?.trim().length).toBeGreaterThan(15);
      expect(Array.isArray(payload.sources)).toBeTruthy();

      // The visible note is a distinct response-level component, not prose
      // silently embedded in the answer.
      await expect(page.getByTestId('kinfolk-provenance-note').last()).toContainText(/official|verify|legal|authority/i);
    });
  }
});

test('cultural control query remains conversational and not legal-regulated', async ({ page }) => {
  const payload = await sendKinfolkMessage(page, 'Who is the best rapper from Philadelphia?');

  expect(payload.intentClass).not.toBe('legal_regulated');
  expect(payload.intentClass).toMatch(/culture_entertainment|general_knowledge/);
  expect(payload.provenanceNote).toBeFalsy();
});

test('Detailed response style survives save, fresh API read, and hard refresh', async ({ page }) => {
  await page.goto(`${BASE_URL}/travel?e2e=preference-hydration`);
  const detailed = page.getByTestId('kinfolk-response-style-detailed');
  const save = page.getByTestId('kinfolk-save-taste-profile');

  await expect(detailed).toBeVisible({ timeout: 20_000 });
  await detailed.click();
  await save.click();

  // The active route must return the persisted new contract immediately.
  await expect.poll(async () => (await readPreferences(page)).responseStyle).toBe('detailed');
  const saved = await readPreferences(page);
  expect(saved.deliveryProfile?.detailLevel ?? saved.deliveryProfile?.detail_level).toBe('deep');

  // This is the exact user-visible failure that previous audits caught.
  await page.reload();
  await expect(page.getByTestId('kinfolk-response-style-detailed')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('kinfolk-response-style-conversational')).toHaveAttribute('aria-pressed', 'false');

  const reloaded = await readPreferences(page);
  expect(reloaded.responseStyle).toBe('detailed');
});

/*
 * REPLIT RELEASE RULE
 * This file is a required CI/CD gate. A deployment is NOT “ready for Manus”
 * when static bundle checks or public /health pass alone. It becomes ready only
 * when this suite passes against the deployed environment using a real
 * authenticated test account.
 */
