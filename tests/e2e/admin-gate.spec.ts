import { test, expect } from "@playwright/test";

test.describe("Admin gate for unauthenticated visitors", () => {
  test("visiting /admin shows access-denied state or redirects away", async ({ page }) => {
    await page.goto("admin");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const isRedirected = !url.includes("/admin");

    if (isRedirected) {
      expect(url).not.toContain("/admin");
    } else {
      const body = await page.locator("body").innerText();
      const hasAccessDenied =
        /access denied|sign in|log in|unauthorized|not authorized|forbidden|admin only|restricted/i.test(body);
      expect(hasAccessDenied).toBe(true);
    }
  });

  test("admin page does not expose sensitive data to unauthenticated users", async ({ page }) => {
    await page.goto("admin");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const isRedirected = !url.includes("/admin");

    if (!isRedirected) {
      const body = await page.locator("body").innerText();
      const hasAdminDashboard =
        /waitlist entries|approve|reject|admin dashboard|manage users/i.test(body);
      expect(hasAdminDashboard).toBe(false);
    }
  });
});
