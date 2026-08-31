import { test, expect, type Page } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/", label: "Home", heading: /mapping with melanin|travel with confidence/i },
  { path: "/for-business-owners", label: "For Business Owners", heading: /business|list/i },
  { path: "/membership", label: "Membership", heading: /membership|community/i },
  { path: "/privacy-policy", label: "Privacy Policy", heading: /privacy/i },
  { path: "/privacy", label: "Privacy alias", heading: /privacy/i },
  { path: "/terms", label: "Terms", heading: /terms/i },
  { path: "/community-guidelines", label: "Community Guidelines", heading: /community guidelines/i },
  { path: "/trust-and-safety", label: "Trust and Safety", heading: /trust|safety/i },
  { path: "/about", label: "About", heading: /about|mapping with melanin/i },
  { path: "/features", label: "Features", heading: /feature/i },
  { path: "/contact", label: "Contact", heading: /contact/i },
  { path: "/cities", label: "Cities", heading: /city|cities/i },
  { path: "/roadmap", label: "Roadmap", heading: /where we're going/i },
  { path: "/waitlist", label: "Waitlist", heading: /join the waitlist/i },
  { path: "/preview", label: "Preview" },
  { path: "/library", label: "Living Library", heading: /library|knowledge/i },
];

const MEMBER_ROUTES = [
  { path: "/explore", label: "Explore" },
  { path: "/discover", label: "Discover" },
  { path: "/businesses", label: "Businesses" },
  { path: "/events", label: "Events" },
  { path: "/community", label: "Community" },
  { path: "/travel", label: "KinfolkAI" },
  { path: "/safety", label: "Safety" },
  { path: "/map", label: "Map" },
  { path: "/rate-neighborhood", label: "Rate neighborhood" },
  { path: "/resources", label: "Resources" },
  { path: "/jobs", label: "Jobs" },
  { path: "/verify-business", label: "Verify business" },
  { path: "/profile", label: "Profile" },
  { path: "/billing", label: "Billing" },
  { path: "/business-dashboard", label: "Business dashboard" },
  { path: "/notifications", label: "Notifications" },
  { path: "/circles", label: "Circles" },
  { path: "/collections", label: "Collections" },
  { path: "/financial-hub", label: "Financial hub" },
  { path: "/marketplace", label: "Marketplace" },
  { path: "/wellness", label: "Wellness" },
  { path: "/connections", label: "Connections" },
  { path: "/guides", label: "Guides" },
];

function artifactPath(path: string) {
  return path === "/" ? "./" : path.replace(/^\//, "");
}

async function assertNoFatalPageSignals(page: Page) {
  const notFoundHeading = page.getByRole("heading", { name: /404|not found|page not found/i });
  await expect(notFoundHeading).toHaveCount(0);

  const errorHeading = page.getByRole("heading", { name: /500|server error|something went wrong/i });
  await expect(errorHeading).toHaveCount(0);
  await expect(page.locator("body")).toBeVisible();
}

async function mockApprovedMember(page: Page) {
  await page.route("**/api/auth/user", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        role: "user",
        user: {
          id: "navigation-audit-member",
          firstName: "Navigation",
          lastName: "Tester",
          role: "user",
          approved: true,
          profileSetupComplete: true,
          memberType: "individual",
          tier: "community",
        },
      }),
    });
  });
}

for (const route of PUBLIC_ROUTES) {
  test(`route evidence: ${route.label} (${route.path})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(artifactPath(route.path));

    const status = response?.status() ?? 200;
    expect(status).toBeLessThan(400);
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertNoFatalPageSignals(page);
    if (route.heading) {
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    }
    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toHaveLength(0);
  });
}

for (const route of MEMBER_ROUTES) {
  test(`guest gate evidence: ${route.label} (${route.path})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(artifactPath(route.path));
    await page.waitForLoadState("networkidle").catch(() => {});
    expect(page.url()).toMatch(/\/(waitlist|pending-approval)(?:[/?#]|$)/);
    await assertNoFatalPageSignals(page);
    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toHaveLength(0);
  });
}

test.describe("desktop navigation journey", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("guest sees public nav, logo home, theme control, and active state", async ({ page }) => {
    await page.goto(artifactPath("/for-business-owners"));
    await page.waitForLoadState("networkidle").catch(() => {});

    const nav = page.getByTestId("desktop-navigation");
    await expect(nav).toBeVisible();
    await expect(nav.getByTestId("desktop-nav-link-map")).toBeVisible();
    await expect(nav.getByTestId("desktop-nav-link-businesses")).toBeVisible();
    await expect(nav.getByTestId("desktop-nav-link-safety")).toBeVisible();
    await expect(nav.getByTestId("desktop-nav-link-for-business-owners")).toHaveAttribute("aria-current", "page");
    await expect(nav.getByTestId("desktop-nav-link-community")).toHaveCount(0);
    await expect(page.getByTestId("logo-home-link")).toHaveAttribute("href", "/web/");
    await expect(page.getByTestId("desktop-theme-toggle")).toBeVisible();
  });

  test("guest public nav reaches the entry gate and logo returns home", async ({ page }) => {
    await page.goto(artifactPath("/"));
    await page.getByTestId("desktop-nav-link-map").click();
    await expect(page).toHaveURL(/\/web\/waitlist$/);
    await page.goto(artifactPath("/"));
    await page.getByTestId("logo-home-link").click();
    await expect(page).toHaveURL(/\/web\/?$/);
    await assertNoFatalPageSignals(page);
  });

  test("approved member can traverse full desktop nav", async ({ page }) => {
    await mockApprovedMember(page);
    await page.goto(artifactPath("/"));
    await page.waitForLoadState("networkidle").catch(() => {});
    const nav = page.getByTestId("desktop-navigation");
    for (const item of ["explore", "community", "library", "travel", "events", "circles", "guides", "marketplace", "connections"]) {
      await expect(nav.getByTestId(`desktop-nav-link-${item}`)).toBeVisible();
    }
    await nav.getByTestId("desktop-nav-link-travel").click();
    await expect(page).toHaveURL(/\/web\/travel$/);
    await assertNoFatalPageSignals(page);
  });

  test("authenticated controls expose notifications and profile destinations", async ({ page }) => {
    await mockApprovedMember(page);
    await page.goto(artifactPath("/"));
    await expect(page.getByTestId("desktop-notifications-link")).toHaveAttribute("href", /notifications/);
    await expect(page.getByTestId("desktop-profile-link")).toHaveAttribute("href", /profile/);
  });
});

test.describe("mobile navigation journey", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("guest hamburger opens, exposes public routes, theme control, and closes after navigation", async ({ page }) => {
    await page.goto(artifactPath("/"));
    const toggle = page.getByTestId("mobile-menu-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByTestId("mobile-navigation");
    await expect(menu).toBeVisible();
    await expect(menu.getByTestId("mobile-nav-link-map")).toBeVisible();
    await expect(menu.getByTestId("mobile-nav-link-businesses")).toBeVisible();
    await expect(menu.getByTestId("mobile-nav-link-safety")).toBeVisible();
    await expect(menu.getByTestId("mobile-nav-link-community")).toHaveCount(0);
    await expect(menu.getByTestId("mobile-theme-toggle")).toBeVisible();
    await menu.getByTestId("mobile-nav-link-map").click();
    await expect(page).toHaveURL(/\/web\/waitlist$/);
    await assertNoFatalPageSignals(page);
  });

  test("guest bottom navigation has usable map, business, safety, and sign-in destinations", async ({ page }) => {
    await page.goto(artifactPath("/"));
    const bottom = page.getByTestId("mobile-bottom-navigation");
    await expect(bottom).toBeVisible();
    for (const item of ["map", "businesses", "safety", "login"]) {
      await expect(bottom.getByTestId(`mobile-bottom-nav-link-${item}`)).toBeVisible();
    }
    await bottom.getByTestId("mobile-bottom-nav-link-login").click();
    await expect(page).toHaveURL(/\/web\/login$/);
  });

  test("approved member gets full bottom navigation and active state", async ({ page }) => {
    await mockApprovedMember(page);
    await page.goto(artifactPath("/"));
    const bottom = page.getByTestId("mobile-bottom-navigation");
    await expect(bottom).toBeVisible();
    for (const item of ["explore", "map", "community", "safety", "library", "profile"]) {
      await expect(bottom.getByTestId(`mobile-bottom-nav-link-${item}`)).toBeVisible();
    }
    await bottom.getByTestId("mobile-bottom-nav-link-library").click();
    await expect(page).toHaveURL(/\/web\/library$/);
    await expect(bottom.getByTestId("mobile-bottom-nav-link-library")).toHaveAttribute("aria-current", "page");
    await assertNoFatalPageSignals(page);
  });

  test("approved member mobile dropdown includes member routes and profile", async ({ page }) => {
    await mockApprovedMember(page);
    await page.goto(artifactPath("/"));
    await page.getByTestId("mobile-menu-toggle").click();
    const menu = page.getByTestId("mobile-navigation");
    for (const item of ["explore", "community", "library", "travel", "events", "circles", "guides", "marketplace", "connections"]) {
      await expect(menu.getByTestId(`mobile-nav-link-${item}`)).toBeVisible();
    }
    await expect(menu.getByTestId("mobile-profile-link")).toBeVisible();
    await menu.getByTestId("mobile-theme-toggle").click();
    await expect(page.getByTestId("mobile-navigation")).toBeHidden();
  });
});

test("admin page shows access-denied or redirect for unauthenticated user", async ({ page }) => {
  await page.goto(artifactPath("/admin"));
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
