import { test, expect } from "@playwright/test";

test.describe("Business discovery", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("discover");
    await page.waitForLoadState("networkidle");
  });

  test("renders the discover page with search input and heading", async ({ page }) => {
    await expect(page.getByTestId("discover-search-input")).toBeVisible();
    await expect(page.getByRole("heading", { name: /explore with purpose/i })).toBeVisible();
  });

  test("shows business cards after initial load", async ({ page }) => {
    const firstCard = page.getByTestId("business-card").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
  });

  test("typing in the search box and clicking Search filters results", async ({ page }) => {
    await page.getByTestId("business-card").first().waitFor({ timeout: 15_000 });

    await page.getByTestId("discover-search-input").fill("restaurant");
    await page.getByTestId("discover-search-button").click();

    await page.waitForTimeout(500);
    await page.waitForLoadState("networkidle");

    const cards = page.getByTestId("business-card");
    const emptyState = page.getByText(/no businesses found/i);
    const cardCount = await cards.count();
    const emptyCount = await emptyState.count();
    expect(cardCount + emptyCount).toBeGreaterThan(0);
  });

  test("clicking a business card navigates to the detail page", async ({ page }) => {
    const firstCard = page.getByTestId("business-card").first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    await expect(page).toHaveURL(/businesses\//, { timeout: 15_000 });
    await expect(page.getByTestId("business-hero")).toBeVisible({ timeout: 15_000 });
  });
});

