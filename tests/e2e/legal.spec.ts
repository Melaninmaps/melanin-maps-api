import { test, expect } from "@playwright/test";

test.describe("Legal pages", () => {
  test("Privacy Policy has substantial content", async ({ page }) => {
    await page.goto("/privacy-policy");
    await page.waitForLoadState("networkidle").catch(() => {});

    await expect(page.locator("body")).toBeVisible();

    // Should have a heading
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    // Should have substantial text — more than 200 chars of body text
    const bodyText = await page.locator("main, article, [class*='prose'], body").first().innerText();
    expect(bodyText.length).toBeGreaterThan(200);

    // Should not be a pure placeholder
    expect(bodyText.toLowerCase()).not.toContain("coming soon");
    expect(bodyText.toLowerCase()).not.toContain("placeholder");
  });

  test("Terms of Service has substantial content", async ({ page }) => {
    await page.goto("/terms");
    await page.waitForLoadState("networkidle").catch(() => {});

    await expect(page.locator("body")).toBeVisible();

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 8_000 });

    const bodyText = await page.locator("main, article, [class*='prose'], body").first().innerText();
    expect(bodyText.length).toBeGreaterThan(200);

    expect(bodyText.toLowerCase()).not.toContain("coming soon");
    expect(bodyText.toLowerCase()).not.toContain("placeholder");
  });
});
