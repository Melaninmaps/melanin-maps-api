import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseMediaUrls } from "../lib/mediaUrls";
import { normalizeExternalUrl } from "../lib/urlSafety";

describe("Expo config plugin imports", () => {
  it("uses the supported config-plugins package in the iOS maps plugin", () => {
    const pluginSource = readFileSync(
      new URL("../plugins/withRnMapsPodfileFix.js", import.meta.url),
      "utf8",
    );

    expect(pluginSource).toContain('require("@expo/config-plugins")');
    expect(pluginSource).not.toContain('require("expo/config-plugins")');
  });
});

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

describe("safety report incident-location contract", () => {
  it("submits Police/ICE as a governed subtype and never sends exact GPS", () => {
    const source = readFileSync(new URL("../app/report-police.tsx", import.meta.url), "utf8");
    expect(source).toContain('category: "police"');
    expect(source).toContain("encounterType: form.encounterType");
    expect(source).toContain("isAnonymous: true");
    expect(source).not.toContain("category: form.encounterType");
    expect(source).not.toContain("geo.streetNumber");
    expect(source).not.toContain("geo.street");
    const payload = source.slice(source.indexOf("body: JSON.stringify"), source.indexOf("if (!res.ok)"));
    expect(payload).not.toContain("latitude");
    expect(payload).not.toContain("longitude");
  });

  it("requests current location only after the member chooses the incident-location button", () => {
    const source = readFileSync(new URL("../app/report-safety.tsx", import.meta.url), "utf8");
    expect(source).toContain("handleUseCurrentLocation");
    expect(source).toContain("Use current location for this incident");
    expect(source).toContain('locationSource: "current_device"');
    expect(source).not.toContain("Auto-detect city from GPS on mount");
    expect(source).not.toContain("useEffect(() =>");
    expect(source).not.toContain("place.streetNumber");
    expect(source).not.toContain("place.street");
  });
});
