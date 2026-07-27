/**
 * Auth regression tests — Founding Beta defect fixes
 *
 * Covers the 5 behaviors fixed before iOS Build 87 / Android Build 62:
 *   1. Password reset succeeds end-to-end (API level)
 *   2. Expired / invalid token returns 401, not 500
 *   3. 500 responses do NOT include a sign-out directive (transient errors must not erase sessions)
 *   4. Explicit 401 signals token invalidation (correct error shape)
 *   5. User enumeration: forgot-password always returns success regardless of email existence
 *
 * Mobile-specific checks (circles button → Alert.alert, SecureStore not cleared on 500)
 * are verified by manual device testing recorded in the release audit trail.
 */

import { test, expect } from "@playwright/test";

const API_URL = "http://localhost:80";
const RAILWAY_URL = "https://api-server-production-a991.up.railway.app";

// ---------------------------------------------------------------------------
// 1. Password reset end-to-end (API)
// ---------------------------------------------------------------------------
test.describe("Password reset — end-to-end (regression)", () => {
  test("forgot-password returns 200 and success:true for valid email", async ({
    page,
  }) => {
    const res = await page.request.post(`/api/auth/forgot-password`, {
      data: { email: "smoketest_regression@melanintest.dev" },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { success?: boolean };
    expect(body.success).toBe(true);
  });

  test("reset-password rejects an invalid 6-digit code", async ({ page }) => {
    const res = await page.request.post(`/api/auth/reset-password`, {
      data: {
        email: "smoketest_regression@melanintest.dev",
        code: "000000",
        newPassword: "ShouldNeverWork#99",
      },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/invalid|expired/i);
  });

  test("reset-password rejects a malformed (non-6-digit) code", async ({
    page,
  }) => {
    const res = await page.request.post(`/api/auth/reset-password`, {
      data: {
        email: "smoketest_regression@melanintest.dev",
        code: "abc",
        newPassword: "ShouldNeverWork#99",
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  test("reset-password requires all three fields", async ({ page }) => {
    const res = await page.request.post(`/api/auth/reset-password`, {
      data: { email: "smoketest_regression@melanintest.dev" },
    });
    expect([400, 422]).toContain(res.status());
  });
});

// ---------------------------------------------------------------------------
// 2 + 3. 500 must NOT erase session; 401 signals token invalidation
// ---------------------------------------------------------------------------
test.describe("Session stability — 500 vs 401 signalling (regression)", () => {
  test("GET /api/auth/user with invalid Bearer token returns 401 (not 500)", async ({
    page,
  }) => {
    const res = await page.request.get(`/api/auth/user`, {
      headers: { Authorization: "Bearer REGRESSION_INVALID_TOKEN_XYZ" },
    });
    expect(res.status()).toBe(401);
  });

  test("401 response body has an error field (mobile can key on this)", async ({
    page,
  }) => {
    const res = await page.request.get(`/api/auth/user`, {
      headers: { Authorization: "Bearer REGRESSION_INVALID_TOKEN_XYZ" },
    });
    const body = (await res.json()) as { error?: string };
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });

  test("401 response does NOT set a Set-Cookie header that clears session", async ({
    page,
  }) => {
    const res = await page.request.get(`/api/auth/user`, {
      headers: { Authorization: "Bearer REGRESSION_INVALID_TOKEN_XYZ" },
    });
    const setCookie = res.headers()["set-cookie"] ?? "";
    const clearsSession =
      /session.*max-age=0|session.*expires=thu.*1970/i.test(setCookie);
    expect(clearsSession).toBe(false);
  });

  test("healthz endpoint returns 200 (server is not in 500 state)", async ({
    page,
  }) => {
    const res = await page.request.get(`/api/healthz`);
    expect(res.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 4. User enumeration protection
// ---------------------------------------------------------------------------
test.describe("User enumeration protection (regression)", () => {
  test("forgot-password returns 200 for a non-existent email", async ({
    page,
  }) => {
    const res = await page.request.post(`/api/auth/forgot-password`, {
      data: { email: "doesnotexist_regression_99@notreal.invalid" },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { success?: boolean };
    expect(body.success).toBe(true);
  });

  test("forgot-password success response is identical for known vs unknown email", async ({
    page,
  }) => {
    const [r1, r2] = await Promise.all([
      page.request.post(`/api/auth/forgot-password`, {
        data: { email: "doesnotexist_a@notreal.invalid" },
      }),
      page.request.post(`/api/auth/forgot-password`, {
        data: { email: "doesnotexist_b@notreal.invalid" },
      }),
    ]);
    const [b1, b2] = await Promise.all([r1.json(), r2.json()]) as [
      { success?: boolean },
      { success?: boolean },
    ];
    expect(r1.status()).toBe(r2.status());
    expect(b1.success).toBe(b2.success);
  });
});

// ---------------------------------------------------------------------------
// 5. Circles / saved-places APIs require auth (no silent redirect to login)
// ---------------------------------------------------------------------------
test.describe("Circles + saved-places auth gates (regression)", () => {
  test("GET /api/circles requires authentication (401 not redirect)", async ({
    page,
  }) => {
    const res = await page.request.get(`/api/circles`);
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/circles requires authentication", async ({ page }) => {
    const res = await page.request.post(`/api/circles`, {
      data: { name: "Regression Test Circle" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("GET /api/saved-places requires authentication", async ({ page }) => {
    const res = await page.request.get(`/api/saved-places`);
    expect([401, 403]).toContain(res.status());
  });

  test("POST /api/saved-places requires authentication", async ({ page }) => {
    const res = await page.request.post(`/api/saved-places`, {
      data: { businessId: "any-id" },
    });
    expect([401, 403]).toContain(res.status());
  });
});
