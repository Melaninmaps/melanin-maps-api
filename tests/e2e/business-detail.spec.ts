import { test, expect } from "@playwright/test";

async function navigateToFirstBusiness(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto("discover");
  await page.waitForLoadState("networkidle");
  const firstCard = page.getByTestId("business-card").first();
  await expect(firstCard).toBeVisible({ timeout: 15_000 });
  await firstCard.click();
  await expect(page).toHaveURL(/businesses\//, { timeout: 15_000 });
  await expect(page.getByTestId("business-hero")).toBeVisible({ timeout: 15_000 });
}

test.describe("Business detail page", () => {
  test("hero, name, category, share, and save button are present", async ({ page }) => {
    await navigateToFirstBusiness(page);

    await expect(page.getByTestId("business-name")).toBeVisible();
    await expect(page.getByTestId("business-category")).toBeVisible();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible();

    const shareButton = page.getByTestId("business-share-btn");
    await expect(shareButton).toBeVisible();
  });

  test("location tab reveals the map area and contact section", async ({ page }) => {
    await navigateToFirstBusiness(page);

    const locationTab = page.getByRole("tab", { name: /location/i });
    await expect(locationTab).toBeVisible();
    await locationTab.click();

    const mapArea = page.locator('[aria-label*="Map"], [aria-label*="map"], [title*="Map"], iframe, [aria-label*="Google Maps"], [href*="maps.google.com"]').first();
    await expect(mapArea).toBeVisible({ timeout: 10_000 });

    const directionsLink = page.getByRole("link", { name: /get directions/i });
    await expect(directionsLink).toBeVisible();
  });

  test("call link is present when business has a phone number", async ({ page }) => {
    await navigateToFirstBusiness(page);

    const locationTab = page.getByRole("tab", { name: /location/i });
    await locationTab.click();

    const callLink = page.getByTestId("business-call-link");
    const count = await callLink.count();
    if (count > 0) {
      await expect(callLink).toBeVisible();
      const href = await callLink.getAttribute("href");
      expect(href).toMatch(/^tel:/);
    }
  });

  test("reviews tab is accessible", async ({ page }) => {
    await navigateToFirstBusiness(page);

    const reviewsTab = page.getByRole("tab", { name: /reviews/i });
    await expect(reviewsTab).toBeVisible();
    await reviewsTab.click();

    await expect(page.getByText(/community voices/i)).toBeVisible({ timeout: 5_000 });
  });
});
