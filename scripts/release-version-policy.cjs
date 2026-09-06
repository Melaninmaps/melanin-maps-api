"use strict";

function validateProductionVersion(value, expectedSha) {
  const liveSha = String(value?.built_from_sha ?? "");
  if (!/^[0-9a-f]{40}$/.test(expectedSha) || liveSha !== expectedSha) {
    throw new Error("live API is not the exact reviewed release evidence SHA");
  }
  if (value?.stale_bundle !== false) {
    throw new Error("live API did not explicitly report a fresh bundle");
  }
  return true;
}

module.exports = { validateProductionVersion };
