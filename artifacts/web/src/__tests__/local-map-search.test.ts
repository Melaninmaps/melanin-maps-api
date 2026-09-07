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
  ["plumber in Boston, MA", { subject: "plumber", city: "Boston", stateCode: "MA" }],
  ["plumber Boston MA", { subject: "plumber", city: "Boston", stateCode: "MA" }],
  ["plumber in Boise, ID", { subject: "plumber", city: "Boise", stateCode: "ID" }],
  ["plumber Los Angeles CA", { subject: "plumber", city: "Los Angeles", stateCode: "CA" }],
  ["plumber Salt Lake City UT", { subject: "plumber", city: "Salt Lake City", stateCode: "UT" }],
  ["plumber in Charleston, West Virginia", { subject: "plumber", city: "Charleston", stateCode: "WV" }],
  ["mobile dog grooming Boston MA", { subject: "mobile dog grooming", city: "Boston", stateCode: "MA" }],
  ["electrician in Spokane, Washington", { subject: "electrician", city: "Spokane", stateCode: "WA" }],
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
    expect(parseLocalMapSearch("plumber Boston MA").usesDeviceLocation).not.toBe(true);
    expect(parseLocalMapSearch("plumber in Boise, ID").usesDeviceLocation).not.toBe(true);
    expect(parseLocalMapSearch("welder 30303").usesDeviceLocation).not.toBe(true);
  });

  it("never infers an unvalidated trailing word as a city", () => {
    expect(parseLocalMapSearch("mobile dog grooming")).toEqual({
      subject: "mobile dog grooming",
      usesDeviceLocation: true,
    });
    expect(parseLocalMapSearch("plumber Nowhere ZZ")).toEqual({
      subject: "plumber Nowhere ZZ",
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
