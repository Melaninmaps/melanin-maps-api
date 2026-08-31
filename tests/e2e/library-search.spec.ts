import { expect, test } from "@playwright/test";

const SEARCH_RESPONSE = {
  query: "HVAC",
  results: [
    {
      kind: "topic",
      id: "topic-trades",
      slug: "trades-skills-certifications",
      title: "Trades, Skills & Certifications",
      summary: "Apprenticeships, skilled trades, certifications, and career pathways.",
      iconKey: "home-services",
      entryCount: 1,
    },
    {
      kind: "entry",
      id: "entry-hvac",
      title: "Starting an HVAC apprenticeship",
      summary: "A reviewed path into the trade.",
      body: "Compare approved apprenticeship programs.\n\nConfirm licensing requirements in your state.",
      topicSlug: "trades-skills-certifications",
      topicTitle: "Trades, Skills & Certifications",
      sourceCount: 2,
      refreshedAt: "2026-08-20T12:00:00.000Z",
    },
  ],
  total: 2,
  nextCursor: null,
  clarification: {
    prompt: "What kind of HVAC information would help most?",
    choices: [
      { label: "Training and education", query: "HVAC training education" },
      { label: "Licenses and certifications", query: "HVAC licenses certifications" },
      { label: "Apprenticeships and jobs", query: "HVAC apprenticeships jobs" },
      { label: "Studies and workforce", query: "HVAC studies workforce" },
      { label: "Organizations and professionals", query: "HVAC organizations professionals" },
    ],
  },
  webResearch: {
    status: "unavailable",
    message: "Live-web research is unavailable for this search. Results shown here come only from governed internal Library content.",
  },
};

test.describe("Living Library search", () => {
  test("shows a blank query as an inline prompt without calling search", async ({ page }) => {
    let searchCalls = 0;
    await page.route("**/api/library/search?**", async (route) => {
      searchCalls += 1;
      await route.abort();
    });

    await page.goto("library/search");

    await expect(page.getByRole("heading", { name: "Find trusted knowledge already in the Library." })).toBeVisible();
    await expect(page.getByText("Enter a term to search approved Library content.")).toBeVisible();
    expect(searchCalls).toBe(0);
  });

  test("renders the HVAC Trades alias and nonblocking choices, then expands and collapses an approved entry", async ({ page }) => {
    let searchCalls = 0;
    await page.route("**/api/library/search?**", async (route) => {
      searchCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Cache-Control": "no-store" },
        body: JSON.stringify(SEARCH_RESPONSE),
      });
    });

    await page.goto("library/search?q=HVAC");

    await expect(page).toHaveURL(/\/web\/library\/search\?q=HVAC$/);
    await expect(page.getByRole("heading", { name: "Trades, Skills & Certifications" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What kind of HVAC information would help most?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Training and education" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Starting an HVAC apprenticeship" })).toBeVisible();
    await expect(page.getByText("Compare approved apprenticeship programs.")).toBeHidden();

    const toggle = page.getByRole("button", { name: "See More" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(page.getByText("Compare approved apprenticeship programs.")).toBeVisible();
    await expect(page.getByRole("button", { name: "See Less" })).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: "See Less" }).click();
    await expect(page.getByText("Compare approved apprenticeship programs.")).toBeHidden();
    expect(searchCalls).toBe(1);
  });
});
