import { describe, expect, it, vi } from "vitest";
import { fetchTikTokVideoPreview } from "../tiktokPreview";

describe("TikTok Community preview metadata", () => {
  const canonicalVideo = "https://www.tiktok.com/@mappingwithmelanin/video/7351234567890123456";

  it("returns only a documented HTTPS TikTok CDN thumbnail and bounded display metadata", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      thumbnail_url: "https://p16-sign.tiktokcdn.com/obj/tos-maliva-p-0068/cover.jpg",
      title: "A public Community video preview",
      author_name: "Mapping With Melanin",
    }), { status: 200 }));

    await expect(fetchTikTokVideoPreview(canonicalVideo, fetcher)).resolves.toEqual({
      thumbnailUrl: "https://p16-sign.tiktokcdn.com/obj/tos-maliva-p-0068/cover.jpg",
      title: "A public Community video preview",
      authorName: "Mapping With Melanin",
    });
    expect(fetcher).toHaveBeenCalledWith(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalVideo)}`,
      expect.objectContaining({ redirect: "error" }),
    );
  });

  it("fails closed before any provider request for noncanonical or non-TikTok URLs", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(fetchTikTokVideoPreview("https://evil.example/video/1", fetcher)).resolves.toBeNull();
    await expect(fetchTikTokVideoPreview("https://www.tiktok.com/@mappingwithmelanin", fetcher)).resolves.toBeNull();

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects non-CDN thumbnails and unavailable provider responses", async () => {
    const unsafeThumbnailFetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      thumbnail_url: "https://example.com/not-a-tiktok-cover.jpg",
      title: "Should not be returned",
    }), { status: 200 }));
    const unavailableFetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 }));

    await expect(fetchTikTokVideoPreview(canonicalVideo, unsafeThumbnailFetcher)).resolves.toBeNull();
    await expect(fetchTikTokVideoPreview(canonicalVideo, unavailableFetcher)).resolves.toBeNull();
  });
});
