import { expect, test } from "@playwright/test";

const startHere = [
  "Housing & Home",
  "Education & Learning",
  "Trades, Skills & Certifications",
  "Health & Wellness",
  "Money & Economic Mobility",
  "Careers & Professional Life",
  "Business & Entrepreneurship",
  "Community Resources & Help",
];

test.describe("Living Library foundation", () => {
  test("opens with readable introductory copy and populated foundational cards", async ({
    page,
  }) => {
    // Stub the foundation-topics endpoint so the test is environment-independent
    await page.route("**/api/library/foundation-topics*", async (route) => {
      await route.fulfill({
        json: {
          topics: startHere.map((title, i) => ({
            id: `10000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            title,
            summary: `Foundation for ${title.toLowerCase()}.`,
            iconKey: ["housing", "education", "home-services", "health", "money", "career", "business", "community"][i],
            isFeatured: true,
            sortOrder: (i + 1) * 10,
            entryCount: 0,
          })),
        },
      });
    });

    await page.goto("/library");

    await expect(
      page.getByRole("heading", { name: /knowledge that grows with the community/i }),
    ).toBeVisible();

    await expect(
      page.getByText(/begin with trusted foundations for the diaspora/i),
    ).toBeVisible();

    for (const title of startHere) {
      await expect(page.getByRole("link", { name: new RegExp(title, "i") })).toBeVisible();
    }

    await expect(page.locator(".living-library-topic-card")).toHaveCount(8);

    // Cards must never show only "research entries" with no title or summary
    await expect(page.getByText(/^research entries$/i)).toHaveCount(0);

    // Cards with zero entries must show the honest call to action
    await expect(
      page.getByText("Explore this foundation").first(),
    ).toBeVisible();
  });

  test("a topic card navigates to the correct topic page", async ({ page }) => {
    await page.route("**/api/library/foundation-topics*", async (route) => {
      await route.fulfill({
        json: {
          topics: [
            {
              id: "10000000-0000-0000-0000-000000000001",
              slug: "housing-home",
              title: "Housing & Home",
              summary: "Renting, homeownership, neighborhoods, home services, and housing rights.",
              iconKey: "housing",
              isFeatured: true,
              sortOrder: 10,
              entryCount: 0,
            },
          ],
        },
      });
    });

    await page.goto("/library");
    await page.getByRole("link", { name: /housing & home/i }).click();
    await expect(page).toHaveURL(/\/library\/topics\/housing-home$/);
  });
});
