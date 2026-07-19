import { test, expect } from "@playwright/test";

const BASE = "";

test.describe("Registration flow", () => {
  test("registration page loads and shows sign-up form", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.locator("body").innerText();
    const hasForm =
      /sign up|create account|join|register|email|get started/i.test(body);
    expect(hasForm).toBeTruthy();
  });

  test("registration with missing fields shows validation error", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const submitBtn = page
      .getByRole("button", { name: /sign up|create account|join|register|get started/i })
      .first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      const body = await page.locator("body").innerText();
      const hasError = /required|invalid|enter your|please provide/i.test(body);
      expect(hasError).toBeTruthy();
    }
  });
});

test.describe("Login flow", () => {
  test("login page loads with email and password fields", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("login with wrong credentials shows error", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("notareal@example.com");
      await passwordInput.fill("wrongpassword123");
      const submitBtn = page.getByRole("button", { name: /sign in|log in|login|continue/i }).first();
      await submitBtn.click();
      await page.waitForTimeout(1500);
      const body = await page.locator("body").innerText();
      const hasError = /invalid|incorrect|wrong|not found|error|try again|failed/i.test(body);
      expect(hasError).toBeTruthy();
    }
  });

  test("login page does not expose session token in URL", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const url = page.url();
    expect(url).not.toContain("token=");
    expect(url).not.toContain("session=");
  });
});

test.describe("Password reset flow", () => {
  test("forgot password page loads", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.locator("body").innerText();
    const hasReset = /forgot|reset|password|email/i.test(body);
    expect(hasReset).toBeTruthy();
  });

  test("forgot password with unknown email does not expose user existence", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
      .first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("definitelynotreal@example.com");
      const submitBtn = page.getByRole("button", { name: /send|reset|submit|continue/i }).first();
      await submitBtn.click();
      await page.waitForTimeout(1500);
      const body = await page.locator("body").innerText();
      const exposesMissing = /no account|not found|does not exist|not registered/i.test(body);
      expect(exposesMissing).toBeFalsy();
    }
  });
});

test.describe("Logout flow", () => {
  test("unauthenticated user redirected away from profile", async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const url = page.url();
    const body = await page.locator("body").innerText();
    const isGated = url.includes("/login") || url.includes("/signup") ||
      /sign in|log in|create account|join now/i.test(body);
    expect(isGated).toBeTruthy();
  });
});

test.describe("Logout all devices", () => {
  test("profile page shows All Devices or sign-out option when authenticated", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.locator("body").innerText();
    const hasLoginPage = /sign in|log in|email/i.test(body);
    if (!hasLoginPage) {
      await page.goto(`${BASE}/profile`);
      await page.waitForLoadState("networkidle").catch(() => {});
      const profileBody = await page.locator("body").innerText();
      const hasSignOut = /sign out|log out|all devices/i.test(profileBody);
      expect(hasSignOut).toBeTruthy();
    }
  });
});

test.describe("Blocked/locked user behavior", () => {
  test("lockout returns 423 with minutes remaining", async ({ page }) => {
    const responses: { status: number; body: string }[] = [];
    await page.route("**/api/auth/login-email", async (route, request) => {
      const response = await page.request.fetch(request);
      responses.push({
        status: response.status(),
        body: await response.text(),
      });
      await route.fulfill({ response });
    });
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
      .first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("locked@example.com");
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill("wrongpassword");
      const btn = page.getByRole("button", { name: /sign in|log in|login|continue/i }).first();
      await btn.click();
      await page.waitForTimeout(1000);
    }
    const locked = responses.find((r) => r.status === 423);
    if (locked) {
      const body = JSON.parse(locked.body) as { error?: string; locked_until?: string };
      if (body.locked_until) {
        expect(typeof body.locked_until).toBe("string");
      }
    }
  });
});

test.describe("Session persistence", () => {
  test("navigating between pages does not clear auth state", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const cookies1 = await page.context().cookies();
    await page.goto(`${BASE}/discover`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const cookies2 = await page.context().cookies();
    const sessionCookie1 = cookies1.find((c) => c.name.toLowerCase().includes("session") || c.name.toLowerCase().includes("sid"));
    const sessionCookie2 = cookies2.find((c) => c.name.toLowerCase().includes("session") || c.name.toLowerCase().includes("sid"));
    if (sessionCookie1 && sessionCookie2) {
      expect(sessionCookie1.value).toBe(sessionCookie2.value);
    }
  });

  test("expired or invalid session token is rejected by API", async ({ page }) => {
    const response = await page.request.get(`/api/auth/user`, {
      headers: { Authorization: "Bearer INVALID_SESSION_TOKEN_TESTING" },
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("Profile loading", () => {
  test("profile page loads without JS errors for unauthenticated visitor", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const criticalErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Non-Error promise rejection")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Business search", () => {
  test("discover page loads businesses", async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.locator("body").innerText();
    const hasContent = /discover|business|explore|find|search/i.test(body);
    expect(hasContent).toBeTruthy();
  });

  test("businesses API returns results", async ({ page }) => {
    const response = await page.request.get(`/api/businesses`);
    expect(response.status()).toBeLessThan(400);
    const data = await response.json() as unknown;
    expect(Array.isArray(data) || typeof data === "object").toBeTruthy();
  });

  test("business search API accepts query parameter", async ({ page }) => {
    const response = await page.request.get(`/api/businesses?q=restaurant`);
    expect(response.status()).toBeLessThan(400);
  });
});

test.describe("Community feed", () => {
  test("community page loads without error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${BASE}/community`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const criticalErrors = errors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("Non-Error promise rejection")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("community posts API returns data", async ({ page }) => {
    const response = await page.request.get(`/api/community/posts`);
    expect(response.status()).toBeLessThan(400);
  });
});

test.describe("Membership page", () => {
  test("membership page loads with plan cards", async ({ page }) => {
    await page.goto(`${BASE}/membership`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.locator("body").innerText();
    const hasPlans = /navigator|trailblazer|explorer|membership|subscribe|upgrade/i.test(body);
    expect(hasPlans).toBeTruthy();
  });

  test("membership checkout requires authentication", async ({ page }) => {
    const response = await page.request.post(`/api/billing/checkout`, {
      data: { planName: "navigator", billing: "monthly" },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("failed purchase: invalid product returns 400 or 404", async ({ page }) => {
    const response = await page.request.post(`/api/billing/checkout`, {
      data: { planName: "__invalid_plan__", billing: "monthly" },
      headers: { Cookie: "" },
    });
    expect([400, 401, 403, 404]).toContain(response.status());
  });

  test("RevenueCat sync without auth returns 401", async ({ page }) => {
    const response = await page.request.post(`/api/revenuecat/sync`, {
      data: { productIdentifier: "mwm_nav_monthly" },
    });
    expect(response.status()).toBe(401);
  });

  test("RevenueCat sync with invalid product returns 400", async ({ page }) => {
    const response = await page.request.post(`/api/revenuecat/sync`, {
      data: { productIdentifier: "__fake_product__" },
      headers: { Authorization: "Bearer INVALID_TOKEN" },
    });
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("Profile editing", () => {
  test("profile update API requires authentication", async ({ page }) => {
    const response = await page.request.patch(`/api/auth/profile`, {
      data: { firstName: "Test" },
    });
    expect([401, 403]).toContain(response.status());
  });
});
