import { describe, expect, it } from "vitest";
import { parseMediaUrls } from "../lib/mediaUrls";
import { normalizeExternalUrl } from "../lib/urlSafety";

describe("community media URL normalization", () => {
  it("accepts direct arrays and historical JSON text", () => {
    expect(parseMediaUrls(["https://example.com/a.jpg"])).toEqual([
      "https://example.com/a.jpg",
    ]);
    expect(parseMediaUrls('[\"https://example.com/a.jpg\"]')).toEqual([
      "https://example.com/a.jpg",
    ]);
  });

  it("drops malformed payloads and non-string entries without throwing", () => {
    expect(parseMediaUrls("{bad json")).toBeUndefined();
    expect(parseMediaUrls({ url: "https://example.com/a.jpg" })).toBeUndefined();
    expect(parseMediaUrls([" ", 1, null, "https://example.com/a.jpg"])).toEqual([
      "https://example.com/a.jpg",
    ]);
  });
});

describe("external URL normalization", () => {
  it("allows absolute http URLs and upgrades bare domains to https", () => {
    expect(normalizeExternalUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(normalizeExternalUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects unsafe and incomplete schemes", () => {
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("mailto:test@example.com")).toBeNull();
    expect(normalizeExternalUrl(" ")).toBeNull();
  });
});
