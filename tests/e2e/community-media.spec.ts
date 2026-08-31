import { expect, test, type Page } from "@playwright/test";

const AUTH_BODY = {
  role: "user",
  user: {
    id: "community-media-audit",
    firstName: "Media",
    lastName: "Tester",
    role: "user",
    approved: true,
    profileSetupComplete: true,
  },
};

type TestPost = { id: string; content: string; mediaUrls?: string[] };

async function mockCommunity(page: Page, posts: TestPost[] = []) {
  await page.route("**/api/auth/user", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(AUTH_BODY) });
  });
  await page.route("**/api/community/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (/\/api\/community\/posts\/[^/]+\/comments$/.test(url.pathname) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ comments: [], access: { canComment: true, commentPolicy: "everyone" } }),
      });
      return;
    }
    if (url.pathname.endsWith("/hashtags/trending")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ trending: [] }) });
      return;
    }
    if (url.pathname.endsWith("/posts") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ posts: posts.map((post) => ({
          authorName: "Media Tester",
          authorInitials: "MT",
          authorColor: "#CA922B",
          authorId: AUTH_BODY.user.id,
          upvotes: 0,
          commentsCount: 0,
          commentPolicy: "everyone",
          createdAt: new Date().toISOString(),
          category: "general",
          postType: "community",
          ...post,
        })) }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });
}

test("comment draft stays visible and accessible under a dark color scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await mockCommunity(page, [{ id: "comments-post", content: "Open this conversation" }]);
  await page.goto("community");
  await page.getByTestId("community-post-comments-comments-post").click();

  const textarea = page.getByRole("textbox", { name: "Comment" });
  await expect(textarea).toHaveAttribute("placeholder", "Add to the conversation…");
  await expect(page.getByRole("button", { name: "Post comment" })).toBeVisible();
  await textarea.fill("A visible community reply");
  await textarea.focus();

  const styles = await textarea.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      color: computed.color,
      caretColor: computed.caretColor,
      webkitTextFillColor: computed.getPropertyValue("-webkit-text-fill-color"),
      backgroundColor: computed.backgroundColor,
      boxShadow: computed.boxShadow,
      placeholderColor: getComputedStyle(element, "::placeholder").color,
    };
  });
  expect(styles.color).toBe("rgb(58, 31, 14)");
  expect(styles.caretColor).toBe("rgb(58, 31, 14)");
  expect(styles.webkitTextFillColor).toBe("rgb(58, 31, 14)");
  expect(styles.backgroundColor).toBe("rgb(250, 246, 239)");
  expect(styles.placeholderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.boxShadow).not.toBe("none");
});

test("TikTok and Instagram watch pages render safe provider links, never native video", async ({ page }) => {
  await mockCommunity(page, [{
    id: "social-post",
    content: "Social links",
    mediaUrls: [
      "https://www.tiktok.com/@creator/video/123456789",
      "https://www.instagram.com/reel/ABC123/",
    ],
  }]);
  await page.goto("community");

  await expect(page.getByTestId("community-media-provider-0")).toHaveAttribute("data-provider", "TikTok");
  await expect(page.getByTestId("community-media-provider-1")).toHaveAttribute("data-provider", "Instagram");
  await expect(page.getByTestId("community-media-provider-0")).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator("video")).toHaveCount(0);
});

test("native uploaded video has inline metadata playback and an accessible error fallback", async ({ page }) => {
  await page.route("https://media.example.test/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "video/mp4",
      body: Buffer.from("AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAuVtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxOWY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAAz//727L4FNhTIwQAAAAhBmiJsQr/+wAAAAAgBnkF5Cv/EgQAAA11tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAeAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACh3RyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAEAAAABAAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAHgAAAQAAAEAAAAAAf9tZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAADIAAAAGAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAGqbWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAABanN0YmwAAAC+c3RzZAAAAAAAAAABAAAArmF2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAEAAQAEgAAABIAAAAAAAAAAEVTGF2YzYwLjMxLjEwMiBsaWJ4MjY0AAAAAAAAAAAAAAAY//8AAAA0YXZjQwFkAAr/4QAXZ2QACqzZXsBEAAADAAQAAAMAyDxIllgBAAZo6+PLIsD9+PgAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAvuIAAL7iAAAAGHN0dHMAAAAAAAAAAQAAAAMAAAIAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAAAoY3R0cwAAAAAAAAADAAAAAQAABAAAAAABAAAGAAAAAAEAAAIAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAADAAAAAQAAACBzdHN6AAAAAAAAAAAAAAADAAACxQAAAAwAAAAMAAAAFHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjYwLjE2LjEwMA==", "base64"),
    });
  });
  await mockCommunity(page, [{
    id: "video-post",
    content: "Uploaded video",
    mediaUrls: ["https://media.example.test/community/uploaded.mp4"],
  }]);
  await page.goto("community");

  const video = page.getByTestId("community-native-video");
  await expect(video).toHaveAttribute("playsinline", "");
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect(video).toHaveAttribute("aria-label", "Community post video");
  await video.dispatchEvent("error");
  const fallback = page.getByTestId("community-native-video-unavailable");
  await expect(fallback).toHaveAttribute("role", "status");
  await expect(fallback).toContainText("Video unavailable");
  await expect(fallback.getByRole("link", { name: "Open video" })).toHaveAttribute("href", "https://media.example.test/community/uploaded.mp4");
});

test("community image picker advertises JPEG extensions and common MIME variants", async ({ page }) => {
  await mockCommunity(page);
  await page.goto("community");
  await page.getByTestId("community-compose-open").click();
  const accept = await page.getByTestId("community-photo-input").getAttribute("accept");
  expect(accept?.split(",")).toEqual(expect.arrayContaining([
    ".jpg", ".jpeg", ".jpe", "image/jpeg", "image/jpg", "image/pjpeg",
  ]));
});

test("a later failed upload preserves the earlier successful community attachment", async ({ page }) => {
  await mockCommunity(page);
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
      status: 502,
      contentType: "application/json",
      headers: { "x-request-id": "later-upload-99" },
      body: JSON.stringify({ error: "Second upload failed safely", code: "MEDIA_STORAGE_SAVE_FAILED", requestId: "later-upload-99" }),
    });
  });

  await page.goto("community");
  await page.getByTestId("community-compose-open").click();
  const photoInput = page.getByTestId("community-photo-input");
  await photoInput.setInputFiles({ name: "first.jpg", mimeType: "image/jpeg", buffer: Buffer.from("first") });
  await expect(page.getByTestId("community-media-previews").locator("img")).toHaveCount(1);
  await photoInput.setInputFiles({ name: "second.jpeg", mimeType: "image/pjpeg", buffer: Buffer.from("second") });
  await expect(page.getByTestId("community-upload-error")).toContainText("Second upload failed safely");
  await expect(page.getByTestId("community-upload-error")).toContainText("later-upload-99");
  await expect(page.getByTestId("community-media-previews").locator("img")).toHaveCount(1);
  await expect(page.getByTestId("community-media-previews").locator("img")).toHaveAttribute("src", "https://example.com/community-first.jpg");
});
