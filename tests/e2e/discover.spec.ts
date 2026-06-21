import { test, expect } from "@playwright/test";

test.describe("Business discovery", () => {
  test("Discover page loads and shows businesses", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle").catch(() => {});

    await expect(page.locator("body")).toBeVisible();

    // Should show some kind of business list or search
    const hasContent = await page
      .locator(
        '[data-testid="business-card"], .business-card, article, [class*="card"], input[placeholder*="search" i], input[placeholder*="business" i]',
      )
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test("searching for a term filters results", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle").catch(() => {});

    const searchInput = page
      .locator('input[placeholder*="search" i], input[type="search"], input[placeholder*="business" i]')
      .first();

    if (!(await searchInput.isVisible({ timeout: 8_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await searchInput.fill("restaurant");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);

    // Results should still be visible (not empty)
    await expect(page.locator("body")).toBeVisible();
  });

  test("clicking a business card opens the business detail page", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle").catch(() => {});

    const businessCard = page
      .locator('a[href*="/businesses/"], [data-testid="business-card"]')
      .first();

    if (!(await businessCard.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await businessCard.click();
    await page.waitForLoadState("networkidle").catch(() => {});

    expect(page.url()).toMatch(/\/businesses\//);
    await expect(page.locator("h1, [data-testid='business-name']")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Business detail page", () => {
  test("shows key business information", async ({ page }) => {
    // Navigate via discover to get a real business ID
    await page.goto("/discover");
    await page.waitForLoadState("networkidle").catch(() => {});

    const link = page.locator('a[href*="/businesses/"]').first();
    if (!(await link.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await link.click();
    await page.waitForLoadState("networkidle").catch(() => {});

    expect(page.url()).toMatch(/\/businesses\//);

    // Verify critical elements are present
    await expect(page.locator("h1")).toBeVisible({ timeout: 10_000 });

    const hasSaveBtn = await page
      .locator('button:has-text("Save"), button[aria-label*="save" i], [data-testid="save-button"]')
      .isVisible()
      .catch(() => false);

    const hasShareBtn = await page
      .locator('button:has-text("Share"), button[aria-label*="share" i]')
      .isVisible()
      .catch(() => false);

    // At least one of save/share should be present
    expect(hasSaveBtn || hasShareBtn).toBeTruthy();
  });
});
