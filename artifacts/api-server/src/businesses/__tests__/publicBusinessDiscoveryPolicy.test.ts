import { describe, expect, it } from "vitest";
import { isPublicBusinessDiscoveryRead } from "../publicBusinessDiscoveryPolicy";

describe("public business discovery reads", () => {
  it("allows only GET reads of approved contribution display endpoints", () => {
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses/example/contributions" })).toBe(true);
    expect(isPublicBusinessDiscoveryRead({ method: "POST", path: "/businesses/example/contributions" })).toBe(false);
    expect(isPublicBusinessDiscoveryRead({ method: "PATCH", path: "/businesses/example/contributions" })).toBe(false);
  });

  it("keeps protected business command routes private", () => {
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses/mine" })).toBe(false);
    expect(isPublicBusinessDiscoveryRead({ method: "GET", path: "/businesses/duplicate-check" })).toBe(false);
  });
});
