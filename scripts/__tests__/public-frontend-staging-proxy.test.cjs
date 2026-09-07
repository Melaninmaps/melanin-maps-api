"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "../..");
const server = fs.readFileSync(path.join(ROOT, "static-server.mjs"), "utf8");
const nixpacks = fs.readFileSync(path.join(ROOT, "nixpacks.toml"), "utf8");
const railway = fs.readFileSync(path.join(ROOT, "railway.toml"), "utf8");

test("public frontend uses only the accepted isolated staging API", () => {
  assert.match(server, /https:\/\/mwm-staging\.35\.196\.78\.19\.nip\.io/);
  assert.match(server, /app\.use\("\/api", proxyApi\)/);
  assert.match(server, /await assertUpstreamReady/);
  assert.doesNotMatch(server, /mappingwithmelanin\.com.*\/api/);
});

test("public frontend cannot access or mutate a production database", () => {
  assert.doesNotMatch(server, /from ["']pg["']|require\(["']pg["']\)|new Pool|pool\.query|CREATE TABLE|ALTER TABLE|INSERT INTO|runMigration|runStartupMigrations/);
  assert.doesNotMatch(server, /dist\/index\.mjs|spawn\(|child_process/);
  assert.match(server, /DATABASE_URL is intentionally ignored/);
});

test("Railway starts only the frontend proxy and uses upstream health", () => {
  assert.match(nixpacks, /node static-server\.mjs/);
  assert.doesNotMatch(nixpacks, /dist\/index|api-server|BUILD_IDENTITY/);
  assert.match(railway, /healthcheckPath = "\/api\/healthz"/);
});

test("static server blocks binary and signing artifacts", () => {
  for (const extension of ["ipa", "aab", "apk", "pem", "p12", "mobileprovision"]) {
    assert.match(server, new RegExp(extension));
  }
});
