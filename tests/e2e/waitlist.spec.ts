import { test, expect } from "@playwright/test";

test.describe("Waitlist signup flow", () => {
  test("shows the waitlist form and submits successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Locate the waitlist/signup form
    const emailInput = page
      .locator('input[type="email"], input[placeholder*="email" i], input[name="email"]')
      .first();

    await expect(emailInput).toBeVisible({ timeout: 10_000 });

    const unique = `test-${Date.now()}@playwright-test.invalid`;
    await emailInput.fill(unique);

    // Fill first name if present
    const firstNameInput = page
      .locator('input[placeholder*="name" i], input[name="firstName"], input[name="first"]')
      .first();
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill("Playwright");
    }

    // Fill city if present
    const cityInput = page
      .locator('input[placeholder*="city" i], input[name="city"]')
      .first();
    if (await cityInput.isVisible()) {
      await cityInput.fill("Atlanta");
    }

    const submitBtn = page
      .locator('button[type="submit"], button:has-text("Join"), button:has-text("Waitlist"), button:has-text("Get Early Access")')
      .first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Expect some form of success feedback
    await expect(
      page.locator(
        'text=/thank you|success|confirmed|you.re in|waitlist/i, [data-testid="waitlist-success"]',
      ),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("does not submit with an invalid email", async ({ page }) => {
    await page.goto("/");
    const emailInput = page
      .locator('input[type="email"], input[placeholder*="email" i]')
      .first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await emailInput.fill("not-an-email");

    const submitBtn = page
      .locator('button[type="submit"], button:has-text("Join"), button:has-text("Waitlist")')
      .first();
    await submitBtn.click();

    // Browser validation or app-level error should prevent success state
    const successMessage = page.locator('[data-testid="waitlist-success"], text=/thank you|you.re in/i');
    await expect(successMessage).not.toBeVisible({ timeout: 5_000 });
  });
});
