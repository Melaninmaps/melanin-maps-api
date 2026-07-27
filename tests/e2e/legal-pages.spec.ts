import { test, expect } from "@playwright/test";

test.describe("Privacy Policy page", () => {
  test("loads with a heading and substantial content", async ({ page }) => {
    await page.goto("privacy-policy");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();

    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(500);

    const placeholder = /lorem ipsum|coming soon|placeholder/i;
    expect(body).not.toMatch(placeholder);
  });

  test("contains key privacy sections", async ({ page }) => {
    await page.goto("privacy-policy");
    await page.waitForLoadState("networkidle");

    const text = await page.locator("body").innerText();
    expect(text).toMatch(/information|data|collect/i);
  });
});

test.describe("Terms of Service page", () => {
  test("loads with a heading and substantial content", async ({ page }) => {
    await page.goto("terms");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /terms of service/i, level: 1 })).toBeVisible();

    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(500);

    const placeholder = /lorem ipsum|coming soon|placeholder/i;
    expect(body).not.toMatch(placeholder);
  });

  test("contains key terms sections", async ({ page }) => {
    await page.goto("terms");
    await page.waitForLoadState("networkidle");

    const text = await page.locator("body").innerText();
    expect(text).toMatch(/accept|agree|service/i);
  });
});
