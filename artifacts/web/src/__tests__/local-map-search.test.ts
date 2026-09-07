import { describe, expect, it } from "vitest";
import { parseLocalMapSearch } from "../features/map/parseLocalMapSearch";

const cases = [
  ["Book Store Atlanta", { subject: "bookstore", city: "Atlanta", stateCode: "GA" }],
  ["bookstore Atlanta", { subject: "bookstore", city: "Atlanta", stateCode: "GA" }],
  ["Book Store Atlanta, GA", { subject: "bookstore", city: "Atlanta", stateCode: "GA" }],
  ["bookstores in Atlanta", { subject: "bookstore", city: "Atlanta", stateCode: "GA" }],
  ["bookshop Atlanta", { subject: "bookstore", city: "Atlanta", stateCode: "GA" }],
  ["barber near me", { subject: "barber", usesDeviceLocation: true }],
  ["barber near 19104", { subject: "barber", city: "19104" }],
  ["bookstore", { subject: "bookstore", usesDeviceLocation: true }],
  ["barber", { subject: "barber", usesDeviceLocation: true }],
  ["barber shop Atlanta", { subject: "barber", city: "Atlanta", stateCode: "GA" }],
  ["locs", { subject: "locs", usesDeviceLocation: true }],
  ["natural hair", { subject: "locs", usesDeviceLocation: true }],
  ["HVAC", { subject: "hvac", usesDeviceLocation: true }],
  ["locs in Philadelphia", { subject: "locs", city: "Philadelphia", stateCode: "PA" }],
  ["natural-hair in Philadelphia", { subject: "locs", city: "Philadelphia", stateCode: "PA" }],
  ["HVAC in Phoenix", { subject: "hvac", city: "Phoenix", stateCode: "AZ" }],
  ["plumber Atlanta", { subject: "plumber", city: "Atlanta", stateCode: "GA" }],
  ["electrician Philadelphia PA", { subject: "electrician", city: "Philadelphia", stateCode: "PA" }],
  ["welder 30303", { subject: "welder", city: "30303" }],
  ["plumber", { subject: "plumber", usesDeviceLocation: true }],
] as const;

describe("parseLocalMapSearch", () => {
  it.each(cases)("separates the subject and location for %s", (input, expected) => {
    expect(parseLocalMapSearch(input)).toEqual(expected);
  });

  it("never marks a typed city or ZIP as device-location intent", () => {
    expect(parseLocalMapSearch("bookstore Atlanta").usesDeviceLocation).not.toBe(true);
    expect(parseLocalMapSearch("barber near 19104").usesDeviceLocation).not.toBe(true);
    expect(parseLocalMapSearch("electrician Philadelphia PA").usesDeviceLocation).not.toBe(true);
    expect(parseLocalMapSearch("welder 30303").usesDeviceLocation).not.toBe(true);
  });

  it("never infers an unvalidated trailing word as a city", () => {
    expect(parseLocalMapSearch("mobile dog grooming")).toEqual({
      subject: "mobile dog grooming",
      usesDeviceLocation: true,
    });
  });

  it("reuses canonical aliases for arbitrary services", () => {
    expect(parseLocalMapSearch("locksmith Philly")).toEqual({
      subject: "locksmith",
      city: "Philadelphia",
      stateCode: "PA",
    });
  });
});
