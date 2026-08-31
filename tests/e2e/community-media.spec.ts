import { expect, test } from "@playwright/test";

test("a later failed upload preserves the earlier successful community attachment", async ({ page }) => {
  await page.route("**/api/auth/user", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        role: "user",
        user: {
          id: "community-media-audit",
          firstName: "Media",
          lastName: "Tester",
          role: "user",
          approved: true,
          profileSetupComplete: true,
        },
      }),
    });
  });
  await page.route("**/api/community/posts**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ posts: [] }) });
  });

  let uploadCount = 0;
  await page.route("**/api/media/upload?purpose=community_post", async (route) => {
    uploadCount += 1;
    if (uploadCount === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://example.com/community-first.jpg", assetId: "first", type: "image" }),
      });
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Second upload failed safely" }),
    });
  });

  await page.goto("community");
  await page.getByTestId("community-compose-open").click();
  const photoInput = page.getByTestId("community-photo-input");

  await photoInput.setInputFiles({
    name: "first.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("first"),
  });
  await expect(page.getByTestId("community-media-previews").locator("img")).toHaveCount(1);

  await photoInput.setInputFiles({
    name: "second.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("second"),
  });
  await expect(page.getByTestId("community-upload-error")).toContainText("Second upload failed safely");
  await expect(page.getByTestId("community-media-previews").locator("img")).toHaveCount(1);
  await expect(page.getByTestId("community-media-previews").locator("img")).toHaveAttribute(
    "src",
    "https://example.com/community-first.jpg",
  );
});