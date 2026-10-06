import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const iosLayout = readFileSync(
  new URL("../app/(tabs)/_layout.tsx", import.meta.url),
  "utf8",
);
const androidLayout = readFileSync(
  new URL("../app/(tabs)/_layout.android.tsx", import.meta.url),
  "utf8",
);
const mapSurface = readFileSync(
  new URL("../components/FullMapView.tsx", import.meta.url),
  "utf8",
);

describe("map-first native front layout", () => {
  it("opens the existing map tab on both iOS and Android", () => {
    expect(iosLayout).toContain('initialRouteName="map"');
    expect(androidLayout).toContain('initialRouteName="map"');
    expect(iosLayout).toContain('name="map"');
    expect(androidLayout).toContain('name="map"');
  });

  it("retains the full-map surface with overlay controls rather than a preview card", () => {
    expect(mapSurface).toContain('map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }');
    expect(mapSurface).toContain('topOverlay: { position: "absolute", top: 0, left: 0, right: 0, gap: 6 }');
    expect(mapSurface).toContain('card: {\n    position: "absolute",\n    bottom: 0');
  });
});
