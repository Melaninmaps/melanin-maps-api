import { describe, expect, it } from "vitest";
import {
  decodeMapPinCursor,
  encodeMapPinCursor,
  MAP_PIN_VIEWPORT_MAX_LIMIT,
  mapPinViewportFromQuery,
  mapPinViewportScope,
} from "../mapPinViewport";

const VIEWPORT_QUERY = {
  south: "39.8", west: "-75.3", north: "40.1", east: "-74.9",
};

describe("map pin viewport query policy", () => {
  it("keeps a request without bounds on the legacy-compatible path", () => {
    expect(mapPinViewportFromQuery({})).toBeNull();
  });

  it("requires all four valid bounds and a northward viewport", () => {
    expect(() => mapPinViewportFromQuery({ south: "39", west: "-75" })).toThrow("MAP_PIN_VIEWPORT_INVALID");
    expect(() => mapPinViewportFromQuery({ ...VIEWPORT_QUERY, north: "39.8" })).toThrow("MAP_PIN_VIEWPORT_INVALID");
    expect(() => mapPinViewportFromQuery({ ...VIEWPORT_QUERY, west: "-181" })).toThrow("MAP_PIN_VIEWPORT_INVALID");
  });

  it("caps a client page instead of accepting an unbounded marker request", () => {
    expect(mapPinViewportFromQuery({ ...VIEWPORT_QUERY, limit: "99999" })).toMatchObject({
      limit: MAP_PIN_VIEWPORT_MAX_LIMIT,
    });
  });

  it("binds an opaque cursor to its viewport and designation scope", () => {
    const viewport = mapPinViewportFromQuery(VIEWPORT_QUERY)!;
    const scope = mapPinViewportScope(viewport, ["woman", "black-african-american"]);
    const cursor = encodeMapPinCursor({
      latitude: "39.9526", longitude: "-75.1652", id: "business-1", scope,
    });
    expect(decodeMapPinCursor(cursor, scope)).toMatchObject({ id: "business-1" });
    expect(() => decodeMapPinCursor(cursor, `${scope}-changed`)).toThrow("MAP_PIN_CURSOR_INVALID");
  });
});
