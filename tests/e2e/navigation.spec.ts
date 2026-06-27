import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/", label: "Home" },
  { path: "/discover", label: "Discover" },
  { path: "/explore", label: "Explore" },
  { path: "/businesses", label: "Businesses" },
  { path: "/events", label: "Events" },
  { path: "/community", label: "Community" },
  { path: "/safety", label: "Safety" },
  { path: "/map", label: "Map" },
  { path: "/for-business-owners", label: "For Business Owners" },
  { path: "/membership", label: "Membership" },
  { path: "/travel", label: "KinfolkAI" },
  { path: "/privacy-policy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms" },
];

for (const route of ROUTES) {
  test(`navigation: ${route.label} (${route.path}) loads without error page`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(route.path);

    const status = response?.status() ?? 200;
    expect(status).toBeLessThan(400);

    const notFoundHeading = page.getByRole("heading", { name: /404|not found|page not found/i });
    await expect(notFoundHeading).toHaveCount(0);

    const errorHeading = page.getByRole("heading", { name: /500|server error|something went wrong/i });
    await expect(errorHeading).toHaveCount(0);

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
