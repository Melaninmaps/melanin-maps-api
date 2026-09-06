"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { isPhiladelphiaLocation } = require("../release-smoke-policy.cjs");

test("accepts Philadelphia with PA abbreviation", () => {
  assert.equal(isPhiladelphiaLocation("Philadelphia PA"), true);
});

test("accepts Philadelphia with full Pennsylvania name", () => {
  assert.equal(isPhiladelphiaLocation("Philadelphia Pennsylvania"), true);
});

test("rejects a non-Philadelphia Pennsylvania bakery", () => {
  assert.equal(isPhiladelphiaLocation("Pittsburgh Pennsylvania"), false);
});

test("rejects Philadelphia in the wrong state", () => {
  assert.equal(isPhiladelphiaLocation("Philadelphia Mississippi"), false);
});
