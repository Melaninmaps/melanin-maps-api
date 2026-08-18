import { expect, test } from "@playwright/test";

const urbanReader = {
  id: "urban-reader",
  name: "Urban Reader",
  city: "Charlotte",
  stateCode: "NC",
  latitude: 35.227,
  longitude: -80.844,
  distanceMi: 0.5,
  detailUrl: "/businesses/urban-reader/urban-reader",
};
const curio = {
  id: "curio",
  name: "Curio, Craft & Conjure",
  city: "Charlotte",
  stateCode: "NC",
  latitude: 35.228,
  longitude: -80.845,
  distanceMi: 0.5,
  detailUrl: "/businesses/curio/curio-craft-conjure",
};

test(
  "Charlotte bookstore search displays and pins only the two local qualifying results",
  async ({ page }) => {
    let searchUrl = "";
    await page.route("**/api/map/local-business-search?*", async (route) => {
      searchUrl = route.request().url();
      await route.fulfill({
        json: {
          scope: "local",
          radiusMi: 5,
          limit: 2,
          results: [urbanReader, curio],
          pins: [urbanReader, curio],
          expansion: { available: false, nextRadiusMi: null, message: null },
        },
      });
    });

    // Also stub the location resolver so the area handoff sets detectedLocation
    await page.route("**/api/locations/resolve?*", async (route) => {
      await route.fulfill({
        json: {
          id: "charlotte-nc",
          label: "Charlotte, NC",
          cityName: "Charlotte",
          stateCode: "NC",
          neighborhoodName: null,
          latitude: 35.2271,
          longitude: -80.8431,
        },
      });
    });

    await page.goto("/map?q=bookstore&area=charlotte-nc");

    await expect(
      page.getByRole("region", { name: "Nearby search results" }),
    ).toContainText("Urban Reader");
    await expect(
      page.getByRole("region", { name: "Nearby search results" }),
    ).toContainText("Curio, Craft & Conjure");

    await expect(page.getByText(/Hakim's Books/i)).not.toBeVisible();
    await expect(page.getByText(/Liberation Station/i)).not.toBeVisible();

    expect(searchUrl).toContain("radius=5");
    expect(searchUrl).toContain("expand=0");

    await expect(page.locator("[data-testid='local-search-pin']")).toHaveCount(2);
  },
);

test(
  "a wider radius is requested only after an explicit member action",
  async ({ page }) => {
    const urls: string[] = [];

    await page.route("**/api/map/local-business-search?*", async (route) => {
      urls.push(route.request().url());
      await route.fulfill({
        json: {
          scope: "local",
          radiusMi: 5,
          limit: 2,
          results: [urbanReader],
          pins: [urbanReader],
          expansion: {
            available: true,
            nextRadiusMi: 10,
            message: "Only 1 nearby result found. Search within 10 miles?",
          },
        },
      });
    });

    await page.route("**/api/locations/resolve?*", async (route) => {
      await route.fulfill({
        json: {
          id: "charlotte-nc",
          label: "Charlotte, NC",
          cityName: "Charlotte",
          stateCode: "NC",
          neighborhoodName: null,
          latitude: 35.2271,
          longitude: -80.8431,
        },
      });
    });

    await page.goto("/map?q=bookstore&area=charlotte-nc");

    await expect(page.getByText(/search within 10 miles/i)).toBeVisible();
    expect(urls).toHaveLength(1);

    await page.getByRole("button", { name: "Search within 10 miles" }).click();
    await expect.poll(() => urls.length).toBe(2);
    expect(urls[1]).toContain("radius=10");
    expect(urls[1]).toContain("expand=1");
  },
);
