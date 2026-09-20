import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("map profile navigation", () => {
  it("opens an MWM profile directly from a business pin", () => {
    const map = source("../pages/map.tsx");
    expect(map).toContain('navigate(`/businesses/${biz.id}`)');
  });

  it("opens first-party cultural and discoverability profiles while retaining non-profile info windows", () => {
    const map = source("../pages/map.tsx");
    expect(map).toContain('navigate(pin.detailPath)');
    expect(map).toContain('navigate(site.detail_url)');
    expect(map).toContain("infoWindowRef.current?.setContent");
  });

  it("removes crowded map shortcut strips without removing typed discovery", () => {
    const map = source("../pages/map.tsx");
    const nativeMap = source("../../../mobile/components/MapTabView.native.tsx");
    expect(map).toContain("Shortcut chips are deliberately omitted");
    expect(map).toContain("Search businesses, heritage, events");
    expect(nativeMap).toContain("Typed search keeps");
    expect(nativeMap).not.toContain("CategoryPill");
  });

  it("keeps sundown-town history available only when a member selects it", () => {
    const map = source("../pages/map.tsx");
    expect(map).toContain("nearby sundown-town history");
    expect(map).toContain("setShowSundownLayer");
    expect(map).toContain("not a current safety rating");
  });
});
