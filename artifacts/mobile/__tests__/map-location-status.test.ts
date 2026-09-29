import { describe, expect, it } from "vitest";
import {
  mapLocationFailureNotice,
  mapLocationServicesOffNotice,
} from "../lib/mapLocationStatus";

describe("map location failure policy", () => {
  it("turns a denied permission into an actionable Settings message", () => {
    expect(mapLocationFailureNotice(new Error("Location permission denied"))).toEqual({
      kind: "permission",
      message: expect.stringContaining("phone Settings"),
    });
  });

  it("turns a slow device fix into a visible retry message", () => {
    expect(mapLocationFailureNotice(new Error("location timeout"))).toEqual({
      kind: "timeout",
      message: expect.stringContaining("Retry location"),
    });
  });

  it("distinguishes disabled device services from app permission", () => {
    expect(mapLocationServicesOffNotice()).toEqual({
      kind: "services_off",
      message: expect.stringContaining("Location Services are off"),
    });
  });
});
