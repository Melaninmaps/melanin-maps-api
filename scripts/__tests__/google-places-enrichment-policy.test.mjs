import test from "node:test";
import assert from "node:assert/strict";
import {
  assessGooglePlacesIdentity,
  mayAutoApplyGooglePlacesFacts,
} from "../google-places-enrichment-policy.mjs";

test("rejects a city-only Google Places coincidence", () => {
  assert.equal(assessGooglePlacesIdentity({
    businessName: "Neighborhood Kitchen",
    businessAddress: "100 Market Street",
    businessCity: "Philadelphia",
    businessState: "PA",
    placeName: "Different Kitchen",
    placeAddress: "100 Market Street, Philadelphia, PA 19106",
  }), "REJECT");
});

test("requires the stored street number when it is available", () => {
  assert.equal(assessGooglePlacesIdentity({
    businessName: "Neighborhood Kitchen",
    businessAddress: "100 Market Street",
    businessCity: "Philadelphia",
    businessState: "PA",
    placeName: "Neighborhood Kitchen",
    placeAddress: "200 Market Street, Philadelphia, PA 19106",
  }), "REVIEW");
});

test("prioritizes an exact name and complete location only for review", () => {
  assert.equal(assessGooglePlacesIdentity({
    businessName: "Neighborhood Kitchen",
    businessAddress: "100 Market Street",
    businessCity: "Philadelphia",
    businessState: "PA",
    placeName: "Neighborhood Kitchen",
    placeAddress: "100 Market Street, Philadelphia, PA 19106",
  }), "HIGH");
  assert.equal(mayAutoApplyGooglePlacesFacts(), false);
});
