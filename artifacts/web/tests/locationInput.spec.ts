import { expect, test } from "@playwright/test";

for (const route of ["/businesses", "/explore", "/events"]) {
  test(`${route} — area input foreground is dark and readable on white surface`, async ({ page }) => {
    await page.goto(route);
    const areaInput = page.getByRole("searchbox", { name: "Search area" });
    await areaInput.fill("Charlotte, NC");
    await expect(areaInput).toHaveValue("Charlotte, NC");
    await expect(areaInput).toHaveCSS("color", "rgb(40, 20, 10)");
    await expect(areaInput).toHaveCSS("-webkit-text-fill-color", "rgb(40, 20, 10)");
  });
}

test("Businesses — typed city resolves and shows an explicit success state", async ({ page }) => {
  await page.route("**/api/locations/resolve?q=Charlotte%2C%20NC", async (route) =>
    route.fulfill({
      json: {
        id: "charlotte-nc",
        label: "Charlotte, NC",
        cityName: "Charlotte",
        stateCode: "NC",
        neighborhoodName: null,
        latitude: 35.2271,
        longitude: -80.8431,
      },
    }),
  );
  await page.goto("/businesses");
  await page.getByRole("searchbox", { name: "Search area" }).fill("Charlotte, NC");
  await page.getByRole("button", { name: "Search area" }).click();
  await expect(page.getByText("Showing results for Charlotte, NC.")).toBeVisible();
});

test("Explore — typed city resolves and shows an explicit success state", async ({ page }) => {
  await page.route("**/api/locations/resolve?q=Atlanta%2C%20GA", async (route) =>
    route.fulfill({
      json: {
        id: "atlanta-ga",
        label: "Atlanta, GA",
        cityName: "Atlanta",
        stateCode: "GA",
        neighborhoodName: null,
        latitude: 33.749,
        longitude: -84.388,
      },
    }),
  );
  await page.goto("/explore");
  await page.getByRole("searchbox", { name: "Search area" }).fill("Atlanta, GA");
  await page.getByRole("button", { name: "Explore this area" }).click();
  await expect(page.getByText("Showing results for Atlanta, GA.")).toBeVisible();
});

test("location permission denial gives a visible manual-area instruction rather than silently failing", async ({
  page,
  context,
}) => {
  await context.grantPermissions([]);
  await page.goto("/explore");
  await page.getByRole("button", { name: "Use my location" }).click();
  await expect(
    page.getByText(/location permission was not granted|enter a city/i),
  ).toBeVisible();
});

test("Businesses empty state does not contain the nationwide-list sentence", async ({ page }) => {
  await page.goto("/businesses");
  const source = await page.content();
  expect(source).not.toContain("We will not show a nationwide list and label it local");
});
