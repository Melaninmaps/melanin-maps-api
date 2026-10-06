import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  new URL("../pages/home.tsx", import.meta.url),
  "utf8",
);
const mapSource = readFileSync(
  new URL("../pages/map.tsx", import.meta.url),
  "utf8",
);

describe("map-first Web layout", () => {
  it("sends authenticated members to the existing protected map route", () => {
    expect(homeSource).toContain('navigate("/map", { replace: true })');
    expect(homeSource).not.toContain('navigate("/discover", { replace: true })');
  });

  it("keeps the map canvas full-size at desktop and narrow breakpoints when results open", () => {
    expect(mapSource).toContain('data-testid="map-first-shell"');
    expect(mapSource).toContain('data-testid="map-canvas-shell"');
    expect(mapSource).toContain('className="relative h-full w-full"');
    expect(mapSource).toContain('data-testid="map-sidebar-overlay"');
    expect(mapSource).toContain('className="absolute inset-y-0 left-0 z-20 w-80 max-w-[calc(100%-3.5rem)] shadow-2xl"');
    expect(mapSource).toContain('map.fitBounds(bounds, { top: 84, right: 32, bottom: 48, left: 352 });');
  });
});
