"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { validateProductionVersion } = require("../release-version-policy.cjs");

const SHA = "a".repeat(40);

test("accepts only the exact SHA with boolean false stale_bundle", () => {
  assert.equal(validateProductionVersion({ built_from_sha: SHA, stale_bundle: false }, SHA), true);
});

for (const stale of [undefined, null, "false", "true", true]) {
  test(`rejects stale_bundle value ${String(stale)}`, () => {
    assert.throws(
      () => validateProductionVersion({ built_from_sha: SHA, stale_bundle: stale }, SHA),
      /fresh bundle/,
    );
  });
}

test("rejects a different full SHA", () => {
  assert.throws(
    () => validateProductionVersion({ built_from_sha: "b".repeat(40), stale_bundle: false }, SHA),
    /exact reviewed/,
  );
});
