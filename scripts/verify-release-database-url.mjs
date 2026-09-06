#!/usr/bin/env node
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export function databaseIdentityFingerprint(hostname, port, database) {
  const canonicalHostname = hostname.toLowerCase().replace(/\.+$/, "");
  return createHash("sha256")
    .update([canonicalHostname, port || "5432", database.toLowerCase()].join("|"))
    .digest("hex");
}

export function validateReleaseDatabaseUrl(raw, productionFingerprint) {
  if (typeof raw !== "string" || !raw) throw new Error("release-test database URL is required");
  if (!/^[0-9a-f]{64}$/.test(productionFingerprint ?? "")) {
    throw new Error("reviewed production database fingerprint is required");
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("release-test database URL is invalid");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("release-test database must use PostgreSQL");
  }
  if (raw.includes("?") || raw.includes("#") || url.search || url.hash) {
    throw new Error("release-test database URL cannot contain query overrides or fragments");
  }
  if (!url.hostname || /%2f|%5c/i.test(raw) || url.hostname.startsWith("/")) {
    throw new Error("release-test database must use an explicit TCP host");
  }

  let database;
  try {
    database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  } catch {
    throw new Error("release-test database name is invalid");
  }
  if (!database || /[/\\]/.test(database) || !/(test|staging|scratch)/i.test(database)) {
    throw new Error("release-test database name must identify test, staging, or scratch");
  }

  const fingerprint = databaseIdentityFingerprint(url.hostname, url.port || "5432", database);
  if (fingerprint === productionFingerprint) {
    throw new Error("release-test database identity equals production");
  }
  return fingerprint;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    validateReleaseDatabaseUrl(
      process.env.MWM_RELEASE_TEST_DATABASE_URL,
      process.env.MWM_PRODUCTION_DATABASE_FINGERPRINT,
    );
    console.log("Release-test database identity verified.");
  } catch (error) {
    console.error(`BUILD_106_BLOCKED: ${error instanceof Error ? error.message : "database identity verification failed"}`);
    process.exit(1);
  }
}
