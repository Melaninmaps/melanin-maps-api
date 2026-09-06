import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyReleaseEvidence } from "../verify-release-evidence.mjs";

function git(repo, ...args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

function commit(repo, message) {
  git(repo, "add", ".");
  git(repo, "commit", "-m", message);
  return git(repo, "rev-parse", "HEAD");
}

test("accepts an evidence-only release commit after reviewed code and rejects later source changes", () => {
  const repo = mkdtempSync(join(tmpdir(), "mwm-release-evidence-"));
  try {
    git(repo, "init");
    git(repo, "config", "user.email", "release-test@example.invalid");
    git(repo, "config", "user.name", "Release Test");
    writeFileSync(join(repo, "app.ts"), "export const version = 106;\n");
    const reviewedCodeSha = commit(repo, "reviewed code");
    assert.throws(
      () => verifyReleaseEvidence(repo, reviewedCodeSha, reviewedCodeSha),
      /strict descendant/,
    );

    const releases = join(repo, "docs/product/releases");
    mkdirSync(releases, { recursive: true });
    writeFileSync(join(releases, "BUILD_105_PROVENANCE.json"), "{\"reconciled\":true}\n");
    writeFileSync(join(releases, "BUILD_106_ACCEPTANCE.json"), `{\"reviewedCodeSha\":\"${reviewedCodeSha}\"}\n`);
    const evidenceSha = commit(repo, "release acceptance evidence");
    assert.deepEqual(
      verifyReleaseEvidence(repo, reviewedCodeSha, evidenceSha).changed.sort(),
      [
        "docs/product/releases/BUILD_105_PROVENANCE.json",
        "docs/product/releases/BUILD_106_ACCEPTANCE.json",
      ],
    );

    writeFileSync(join(repo, "app.ts"), "export const version = 107;\n");
    const changedSourceSha = commit(repo, "unreviewed source change");
    assert.throws(
      () => verifyReleaseEvidence(repo, reviewedCodeSha, changedSourceSha),
      /application\/source changed/,
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("rejects source change and revert history before the evidence commit", () => {
  const repo = mkdtempSync(join(tmpdir(), "mwm-release-revert-"));
  try {
    git(repo, "init");
    git(repo, "config", "user.email", "release-test@example.invalid");
    git(repo, "config", "user.name", "Release Test");
    writeFileSync(join(repo, "app.ts"), "export const version = 106;\n");
    const reviewedCodeSha = commit(repo, "reviewed code");
    writeFileSync(join(repo, "app.ts"), "export const version = 999;\n");
    const changedSha = commit(repo, "unreviewed source change");
    git(repo, "revert", "--no-edit", changedSha);
    const releases = join(repo, "docs/product/releases");
    mkdirSync(releases, { recursive: true });
    writeFileSync(join(releases, "BUILD_106_ACCEPTANCE.json"), `{\"reviewedCodeSha\":\"${reviewedCodeSha}\"}\n`);
    const evidenceSha = commit(repo, "release evidence after revert");
    assert.throws(
      () => verifyReleaseEvidence(repo, reviewedCodeSha, evidenceSha),
      /intervening commit changed/,
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("rejects a merged and later reverted source change before evidence", () => {
  const repo = mkdtempSync(join(tmpdir(), "mwm-release-merge-"));
  try {
    git(repo, "init");
    git(repo, "config", "user.email", "release-test@example.invalid");
    git(repo, "config", "user.name", "Release Test");
    writeFileSync(join(repo, "app.ts"), "export const version = 106;\n");
    const reviewedCodeSha = commit(repo, "reviewed code");
    const mainBranch = git(repo, "branch", "--show-current");
    git(repo, "checkout", "-b", "feature");
    writeFileSync(join(repo, "app.ts"), "export const version = 999;\n");
    commit(repo, "feature source change");
    git(repo, "checkout", mainBranch);
    git(repo, "merge", "--no-ff", "feature", "-m", "merge feature");
    const mergeSha = git(repo, "rev-parse", "HEAD");
    git(repo, "revert", "-m", "1", "--no-edit", mergeSha);
    const releases = join(repo, "docs/product/releases");
    mkdirSync(releases, { recursive: true });
    writeFileSync(join(releases, "BUILD_106_ACCEPTANCE.json"), `{\"reviewedCodeSha\":\"${reviewedCodeSha}\"}\n`);
    const evidenceSha = commit(repo, "release evidence after merge revert");
    assert.throws(
      () => verifyReleaseEvidence(repo, reviewedCodeSha, evidenceSha),
      /intervening commit changed/,
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
