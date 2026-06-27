import { test, expect } from "@playwright/test";

test.describe("Waitlist signup flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(".");
    await page.waitForLoadState("networkidle");
  });

  test("renders the waitlist form with email, city, and submit button", async ({ page }) => {
    await expect(page.getByTestId("waitlist-form")).toBeVisible();
    await expect(page.getByTestId("waitlist-email")).toBeVisible();
    await expect(page.getByTestId("waitlist-city")).toBeVisible();
    await expect(page.getByTestId("waitlist-submit")).toBeVisible();
  });

  test("shows confirmation state after successful submission with no JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.route("**/api/waitlist", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ position: 42, referralCode: "TESTREF" }),
      });
    });

    await page.getByTestId("waitlist-email").fill("test@example.com");
    await page.getByTestId("waitlist-city").fill("Atlanta");
    await page.getByTestId("waitlist-submit").click();

    await expect(page.getByTestId("waitlist-confirmation")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("waitlist-confirmation")).toContainText("You're on the list!");

    expect(errors).toHaveLength(0);
  });

  test("shows position number in confirmation when API returns it", async ({ page }) => {
    await page.route("**/api/waitlist", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ position: 7, referralCode: null }),
      });
    });

    await page.getByTestId("waitlist-email").fill("member@example.com");
    await page.getByTestId("waitlist-submit").click();

    await expect(page.getByTestId("waitlist-confirmation")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("waitlist-confirmation")).toContainText("#7");
  });

  test("shows confirmation even when API call fails", async ({ page }) => {
    await page.route("**/api/waitlist", async (route) => {
      await route.abort("failed");
    });

    await page.getByTestId("waitlist-email").fill("fail@example.com");
    await page.getByTestId("waitlist-submit").click();

    await expect(page.getByTestId("waitlist-confirmation")).toBeVisible({ timeout: 10_000 });
  });

  test("has no JS console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(".");
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });

  test("does not submit with an invalid email", async ({ page }) => {
    await page.getByTestId("waitlist-email").fill("not-an-email");
    await page.getByTestId("waitlist-submit").click();

    // Browser validation or app-level error should prevent success state
    const successMessage = page.getByTestId("waitlist-confirmation");
    await expect(successMessage).not.toBeVisible({ timeout: 5_000 });
  });
});
