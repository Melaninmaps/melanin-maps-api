import { test, expect } from "@playwright/test";

const NAV_ROUTES = [
  { path: "/", label: "Home" },
  { path: "/discover", label: "Discover" },
  { path: "/map", label: "Map" },
  { path: "/events", label: "Events" },
  { path: "/community", label: "Community" },
  { path: "/for-business-owners", label: "For Business Owners" },
  { path: "/privacy-policy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms" },
];

for (const { path, label } of NAV_ROUTES) {
  test(`${label} page loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);

    await expect(page.locator("body")).toBeVisible();
    // Allow the page to settle
    await page.waitForLoadState("networkidle").catch(() => {});

    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toHaveLength(0);
  });
}

test("admin page shows access-denied or redirect for unauthenticated user", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForLoadState("networkidle").catch(() => {});

  // Should either redirect to login or show an access denied message
  const url = page.url();
  const isRedirected = url.includes("/login") || url.includes("/pending");
  const hasAccessDenied = await page
    .locator("text=/access denied|not authorized|forbidden|admin only|sign in/i")
    .isVisible()
    .catch(() => false);

  expect(isRedirected || hasAccessDenied).toBeTruthy();
});
