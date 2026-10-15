import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("builds a bounded apply manifest from separate, immutable screening receipts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kinfolk-presence-manifest-"));
  const output = join(directory, "apply-manifest.json");
  await writeFile(join(directory, "summary.json"), JSON.stringify({
    verifierVersion: "kinfolk-current-online-presence-v1",
    inputSha256: "a".repeat(64),
    completedAt: "2026-10-15T15:26:45.115Z",
  }));
  await writeFile(join(directory, "website-removal-proposals.json"), JSON.stringify([{
    businessId: "keep-social", businessName: "Keep social", city: "Philadelphia", state: "PA", originalWebsite: "https://closed.example",
    verifiedOfficialSocial: [{ platform: "facebook", url: "https://facebook.com/keep-social" }],
    verification: { classification: "REMOVE_CONFIRMED_INACTIVE" }, currentSnapshotHash: "b".repeat(64),
  }]));
  await writeFile(join(directory, "delete-review-proposals.json"), JSON.stringify([{
    businessId: "review", businessName: "Review", city: "Houston", state: "TX", originalLinks: { website: "https://closed-two.example", social: {} },
    websiteVerification: { classification: "REMOVE_CONFIRMED_INACTIVE" }, socialVerification: {}, originalSnapshot: {},
  }]));
  await execFileAsync(process.execPath, [
    "scripts/src/build-kinfolk-current-online-presence-apply-manifest.mjs",
    "--input-dir", directory,
    "--output", output,
  ], { cwd: process.cwd() });
  const manifest = JSON.parse(await readFile(output, "utf8"));
  assert.equal(manifest.kind, "kinfolk_current_online_presence_apply_v1");
  assert.match(manifest.manifestFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(manifest.websiteRemovals.length, 1);
  assert.equal(manifest.deleteReviews.length, 1);
});
