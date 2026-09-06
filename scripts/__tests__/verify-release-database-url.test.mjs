import assert from "node:assert/strict";
import test from "node:test";
import {
  databaseIdentityFingerprint,
  validateReleaseDatabaseUrl,
} from "../verify-release-database-url.mjs";

const differentProduction = databaseIdentityFingerprint("prod.example", "5432", "mwm_prod");

for (const raw of [
  "postgresql://db.example/mwm_staging?host=prod.example",
  "postgresql://db.example/mwm_staging?hostaddr=10.0.0.5",
  "postgresql://db.example/mwm_staging?port=6543",
  "postgresql://db.example/mwm_staging?dbname=mwm_prod",
  "postgresql://db.example/mwm_staging?",
  "postgresql://db.example/mwm_staging#host=prod.example",
  "postgresql://db.example/mwm_staging#",
  "postgresql://%2Fvar%2Frun%2Fpostgresql/mwm_staging",
  "postgresql:///mwm_staging",
]) {
  test(`rejects override, fragment, or socket URL: ${raw}`, () => {
    assert.throws(() => validateReleaseDatabaseUrl(raw, differentProduction));
  });
}

test("normalizes postgres and postgresql schemes plus default and explicit ports", () => {
  const a = validateReleaseDatabaseUrl("postgres://db.example/mwm_staging", differentProduction);
  const b = validateReleaseDatabaseUrl("postgresql://db.example:5432/mwm_staging", differentProduction);
  assert.equal(a, b);
});

test("rejects the exact normalized production database identity", () => {
  const production = databaseIdentityFingerprint("db.example", "5432", "mwm_staging");
  assert.throws(
    () => validateReleaseDatabaseUrl("postgresql://user:secret@DB.EXAMPLE/mwm_staging", production),
    /equals production/,
  );
});

test("treats a DNS trailing root dot as the same production host", () => {
  const production = databaseIdentityFingerprint("db.example", "5432", "mwm_staging");
  assert.throws(
    () => validateReleaseDatabaseUrl("postgresql://db.example./mwm_staging", production),
    /equals production/,
  );
});

test("accepts a distinct explicit TCP staging database", () => {
  assert.match(
    validateReleaseDatabaseUrl("postgresql://db.example:6543/mwm_release_test", differentProduction),
    /^[0-9a-f]{64}$/,
  );
});
